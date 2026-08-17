import hashlib
from typing import Dict, Any, Tuple

class ContextDeduplicator:
    def __init__(self):
        # Maps SHA-256 hash to original system prompt content
        self._seen_system_hashes = {}

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
                    self._seen_system_hashes[h] = content
                    new_messages.append(msg)
            else:
                new_messages.append(msg)
                
        opt_payload = dict(payload)
        opt_payload["messages"] = new_messages
        return opt_payload, tokens_saved

    def reconstruct_payload(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """
        Reconstructs the system prompt from the deduplicated fingerprint reference.
        """
        messages = payload.get("messages", [])
        new_messages = []
        for msg in messages:
            role = msg.get("role", "")
            content = msg.get("content", "")
            if role == "system" and content.startswith("[System Context Deduped - ID: "):
                fingerprint = content[30:-1]
                matched = False
                for h, orig_content in self._seen_system_hashes.items():
                    if h.startswith(fingerprint):
                        new_messages.append({"role": "system", "content": orig_content})
                        matched = True
                        break
                if not matched:
                    new_messages.append(msg)
            else:
                new_messages.append(msg)
        reconstructed = dict(payload)
        reconstructed["messages"] = new_messages
        return reconstructed

context_deduplicator = ContextDeduplicator()
