import hashlib
import json
from typing import Dict, Any, Optional

class ExactHashCache:
    def __init__(self):
        self._memory_cache: Dict[str, str] = {}

    def normalize_request(self, payload: Dict[str, Any]) -> str:
        """Sort keys, strip non-semantic fields (IDs, timestamps, stream_options), normalize whitespace."""
        clean = {}
        for k, v in payload.items():
            if k in ["model", "messages", "temperature"]:
                clean[k] = v
        # Normalize prompt text inside messages
        if "messages" in clean:
            norm_messages = []
            for msg in clean["messages"]:
                norm_msg = {"role": msg.get("role", "")}
                content = msg.get("content", "")
                if isinstance(content, str):
                    norm_msg["content"] = " ".join(content.split())
                else:
                    norm_msg["content"] = content
                norm_messages.append(norm_msg)
            clean["messages"] = norm_messages
            
        json_str = json.dumps(clean, sort_keys=True)
        return hashlib.sha256(json_str.encode("utf-8")).hexdigest()

    async def get(self, payload: Dict[str, Any]) -> Optional[str]:
        h = self.normalize_request(payload)
        return self._memory_cache.get(h)

    async def set(self, payload: Dict[str, Any], response_text: str):
        h = self.normalize_request(payload)
        self._memory_cache[h] = response_text

exact_cache = ExactHashCache()
