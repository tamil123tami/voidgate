import math
import re
from typing import Dict, Any, List, Optional, Tuple
from app.config import settings

class SemanticCache:
    def __init__(self, threshold: float = 0.92):
        self.threshold = threshold
        # Store tuples of (normalized_prompt, tokens_set, vector_mock, response_text)
        self._entries: List[Tuple[str, set, List[float], str]] = []

    def _tokenize(self, text: str) -> set:
        words = re.findall(r'\w+', text.lower())
        return set(words)

    def _cosine_similarity(self, set1: set, set2: set) -> float:
        if not set1 or not set2:
            return 0.0
        intersection = len(set1.intersection(set2))
        union_len = math.sqrt(len(set1)) * math.sqrt(len(set2))
        return intersection / union_len if union_len > 0 else 0.0

    def extract_prompt_text(self, payload: Dict[str, Any]) -> str:
        messages = payload.get("messages", [])
        user_msgs = [m.get("content", "") for m in messages if m.get("role") == "user"]
        return " ".join(user_msgs).strip()

    async def get(self, payload: Dict[str, Any]) -> Optional[Tuple[str, float]]:
        prompt = self.extract_prompt_text(payload)
        if not prompt:
            return None
            
        tokens = self._tokenize(prompt)
        best_sim = 0.0
        best_resp = None

        for stored_prompt, stored_tokens, _, stored_resp in self._entries:
            sim = self._cosine_similarity(tokens, stored_tokens)
            if sim > best_sim:
                best_sim = sim
                best_resp = stored_resp

        if best_sim >= self.threshold and best_resp:
            return best_resp, best_sim
            
        return None

    async def set(self, payload: Dict[str, Any], response_text: str):
        prompt = self.extract_prompt_text(payload)
        if not prompt:
            return
        tokens = self._tokenize(prompt)
        self._entries.append((prompt, tokens, [], response_text))

semantic_cache = SemanticCache(threshold=settings.semantic_threshold)
