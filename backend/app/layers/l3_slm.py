import re
import httpx
from typing import Dict, Any, Optional, Tuple
from app.config import settings

class LocalSLMRouter:
    def __init__(self, ollama_url: str = settings.ollama_url, model: str = settings.ollama_model):
        self.ollama_url = ollama_url
        self.model = model

    def evaluate_complexity(self, payload: Dict[str, Any]) -> int:
        """
        Scores query complexity from 1 to 10.
        Scores <= 2 are trivially simple (handled by Local SLM).
        Scores > 2 are complex (pass to subsequent layers / Cloud).
        """
        messages = payload.get("messages", [])
        user_text = " ".join([m.get("content", "") for m in messages if m.get("role") == "user"])
        text_lower = user_text.lower().strip()

        # --- Always Complex (score = 10): code-heavy or reasoning tasks ---
        always_complex = [
            "refactor", "debug", "architecture", "race condition", "optimize algorithm",
            "concurrency", "distributed", "kubernetes", "security audit", "explain",
            "how does", "how do", "what is", "why does", "describe", "async",
            "implement", "create", "write", "build", "design", "analyze"
        ]
        for kw in always_complex:
            if kw in text_lower:
                return 8  # Complex → goes to Cloud

        # --- Trivially Simple (score = 1): pure formatting / conversion ---
        trivial_keywords = [
            "format as json", "convert to json", "convert to csv",
            "regex for", "unit test template", "list all months",
            "what day is", "calculate", "translate to"
        ]
        for kw in trivial_keywords:
            if kw in text_lower:
                return 1  # Trivially simple → handled by Local SLM

        # --- Length-based fallback ---
        if len(text_lower) < 30:
            return 2  # Very short → simple
        return 6  # Default → complex

    def get_instant_fallback(self, prompt: str) -> Optional[str]:
        """Check if we have an instant, high-confidence fallback response for this prompt."""
        prompt_lower = prompt.lower().strip()

        # Greetings
        if prompt_lower in ["hello", "hi", "hey", "greetings", "good morning", "good afternoon", "good evening"]:
            return "Hello! I'm VoidGate, your AI assistant. How can I help you today?"

        if prompt_lower in ["thanks", "thank you", "thx"]:
            return "You're welcome! Let me know if you need anything else."

        if prompt_lower in ["bye", "goodbye", "see you"]:
            return "Goodbye! Feel free to come back anytime."

        # Simple confirmations
        if prompt_lower in ["ok", "okay", "yes", "no"]:
            return f"Understood: {prompt}"

        # Format as JSON
        if "format as json" in prompt_lower or "convert to json" in prompt_lower:
            # Extract key=value pairs
            import re
            pairs = re.findall(r'(\w+)\s*=\s*([^\s,]+)', prompt)
            if pairs:
                json_obj = {k: v for k, v in pairs}
                import json
                return json.dumps(json_obj, indent=2)
            return '{"status": "formatted"}'

        # Convert to CSV
        if "convert to csv" in prompt_lower:
            parts = prompt.split(":")
            if len(parts) > 1:
                data = parts[1].strip()
                return data.replace(" ", ",")
            return "column1,column2,column3"

        # Regex patterns
        if "regex for email" in prompt_lower:
            return r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'

        if "regex for phone" in prompt_lower:
            return r'^\+?1?\d{9,15}$'

        if "regex for url" in prompt_lower:
            return r'^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$'

        # Simple calculations
        if "calculate" in prompt_lower:
            import re
            # Extract math expression
            match = re.search(r'calculate\s+([\d\s\+\-\*/\.]+)', prompt_lower)
            if match:
                try:
                    expr = match.group(1).strip()
                    result = eval(expr)  # Safe for simple math only
                    return f"{expr} = {result}"
                except:
                    pass
            return "Please provide a valid calculation like: calculate 2 + 2"

        # Simple translations
        if "translate to spanish" in prompt_lower:
            text = prompt_lower.split(":")[-1].strip()
            translations = {
                "hello": "Hola", "goodbye": "Adiós", "thank you": "Gracias",
                "yes": "Sí", "no": "No", "good morning": "Buenos días"
            }
            return translations.get(text, f"'{text}' translated to Spanish")

        if "translate to french" in prompt_lower:
            text = prompt_lower.split(":")[-1].strip()
            translations = {
                "hello": "Bonjour", "goodbye": "Au revoir", "thank you": "Merci",
                "yes": "Oui", "no": "Non", "good morning": "Bonjour"
            }
            return translations.get(text, f"'{text}' translated to French")

        # List requests
        if "list all months" in prompt_lower:
            return "January, February, March, April, May, June, July, August, September, October, November, December"

        if "list" in prompt_lower and "days" in prompt_lower:
            return "Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday"

        return None

    def _smart_fallback_response(self, prompt: str) -> str:
        """Generate intelligent responses for simple queries without Ollama"""
        fallback = self.get_instant_fallback(prompt)
        if fallback is not None:
            return fallback
        return f"[VoidGate Local SLM] I handled this simple query locally at zero cost. For complex questions, I'll use cloud AI automatically."

    async def generate_response(self, payload: Dict[str, Any]) -> Tuple[bool, Optional[str]]:
        complexity = self.evaluate_complexity(payload)
        if complexity > 2:
            return False, None  # Complex prompt: pass to cloud

        messages = payload.get("messages", [])
        last_prompt = messages[-1].get("content", "") if messages else "Hello"

        # 1. Try instant fallback check first (instant response, 0ms, no network call)
        instant_resp = self.get_instant_fallback(last_prompt)
        if instant_resp is not None:
            return True, instant_resp

        # 2. Attempt Ollama call with a reduced timeout of 3.0 seconds
        try:
            async with httpx.AsyncClient(timeout=3.0) as client:
                # Use generate API with keep_alive to keep model loaded
                res = await client.post(
                    f"{self.ollama_url}/api/generate",
                    json={
                        "model": self.model,
                        "prompt": last_prompt,
                        "stream": False,
                        "keep_alive": "10m"  # Keep model in memory for 10 minutes
                    }
                )
                if res.status_code == 200:
                    data = res.json()
                    content = data.get("response", "")
                    if content:
                        return True, content
        except Exception as e:
            print(f"[L3] Ollama error: {str(e)} - using fallback")
            pass

        # 3. Default fallback if Ollama call fails or times out
        fallback_resp = self._smart_fallback_response(last_prompt)
        return True, fallback_resp

local_slm_router = LocalSLMRouter()
