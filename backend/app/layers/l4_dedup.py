import hashlib
from typing import Dict, Any, Tuple

class ContextDeduplicator:
    def __init__(self):
        self._seen_system_hashes = set()

    def optimize_payload(self, payload: Dict[str, Any]) -> Tuple[Dict[str, Any], int]:
        """
        Fingerprints system prompts and repeated turn contexts.
        Returns (optimized_payload, estimated_tokens_saved).
        """
        messages = payload.get("messages", [])
        new_messages = []
        tokens_saved = 0
        
        for msg in messages:
            role = msg.get("role", "")
            content = msg.get("content", "")
            if role == "system":
                h = hashlib.sha256(content.encode("utf-8")).hexdigest()
                if h in self._seen_system_hashes:
                    # Strip long system prompt down to fingerprint reference
                    truncated_content = f"[System Context Deduped - ID: {h[:8]}]"
                    tokens_saved += max(0, len(content.split()) - 10)
                    new_messages.append({"role": "system", "content": truncated_content})
                else:
                    self._seen_system_hashes.add(h)
                    new_messages.append(msg)
            else:
                new_messages.append(msg)
                
        opt_payload = dict(payload)
        opt_payload["messages"] = new_messages
        return opt_payload, tokens_saved

context_deduplicator = ContextDeduplicator()
