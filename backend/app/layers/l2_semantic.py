import math
import re
from typing import Dict, Any, List, Optional, Tuple
from app.config import settings

STOP_WORDS = {
    'a', 'about', 'above', 'after', 'against', 'all', 'am', 'an', 'and', 'any', 'are', 'aren',
    'as', 'at', 'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by',
    'did', 'didn', 'do', 'does', 'doing', 'don', 'down', 'during', 'each', 'few', 'for', 'from',
    'further', 'had', 'hadn', 'has', 'hasn', 'have', 'haven', 'having', 'he', 'him', 'his', 'i',
    'if', 'in', 'into', 'is', 'isn', 'it', 'its', 'itself', 'just', 'll', 'm', 'ma', 'me', 'mightn',
    'more', 'most', 'mustn', 'my', 'myself', 'needn', 'o', 'of', 'off', 'on', 'once', 'only', 'or',
    'other', 'our', 'ours', 'ourselves', 'out', 'over', 'own', 're', 's', 'same', 'shan', 'she',
    'should', 'so', 'some', 'such', 't', 'than', 'that', 'the', 'their', 'theirs', 'them',
    'themselves', 'then', 'there', 'these', 'they', 'this', 'those', 'through', 'to', 'too',
    'under', 'until', 'up', 've', 'very', 'was', 'wasn', 'we', 'were', 'weren', 'with', 'won',
    'wouldn', 'y', 'you', 'your', 'yours', 'yourself', 'yourselves', 'please', 'thank', 'thanks'
}

GENERIC_VERBS = {
    'explain', 'work', 'how', 'what', 'why', 'who', 'where', 'when', 'describe', 'write',
    'code', 'create', 'do', 'does', 'get', 'use', 'using', 'make', 'run', 'happen',
    'difference', 'between'
}

NEGATION_WORDS = {'not', 'no', 'never', 'none', 'without', 'except'}

class SemanticCache:
    def __init__(self, threshold: float = 0.92):
        self.threshold = threshold
        # Store tuples of (normalized_prompt, tokens_dict, response_text)
        self._entries: List[Tuple[str, Dict[str, float], str]] = []

    def _normalize_text(self, text: str) -> str:
        text = text.lower()
        # Replace contractions to normalize negation words
        text = re.sub(r"\bwon't\b", "will not", text)
        text = re.sub(r"\bcan't\b", "can not", text)
        text = re.sub(r"\bn't\b", " not", text)
        text = re.sub(r"\bcant\b", "can not", text)
        text = re.sub(r"\bdont\b", "do not", text)
        text = re.sub(r"\bdoesnt\b", "does not", text)
        text = re.sub(r"\bdidnt\b", "did not", text)
        text = re.sub(r"\bisnt\b", "is not", text)
        text = re.sub(r"\barent\b", "are not", text)
        text = re.sub(r"\bwasnt\b", "was not", text)
        text = re.sub(r"\bwerent\b", "were not", text)
        text = re.sub(r"\bhasnt\b", "has not", text)
        text = re.sub(r"\bhavent\b", "have not", text)
        text = re.sub(r"\bhadnt\b", "had not", text)
        text = re.sub(r"\bwouldnt\b", "would not", text)
        text = re.sub(r"\bshouldnt\b", "should not", text)
        text = re.sub(r"\bcouldnt\b", "could not", text)
        return text

    def _stem(self, word: str) -> str:
        # Simple suffix stemming
        for suffix in ['ing', 'ly', 'es', 'ed', 's']:
            if len(word) > len(suffix) + 2 and word.endswith(suffix):
                return word[:-len(suffix)]
        return word

    def _tokenize_and_weight(self, text: str) -> Dict[str, float]:
        normalized = self._normalize_text(text)
        words = re.findall(r'\w+', normalized)
        
        weighted_tokens = {}
        for w in words:
            # Check raw word against stop words before stemming to avoid stemming errors (e.g. "does" -> "doe")
            if w in STOP_WORDS:
                continue
                
            stemmed = self._stem(w)
            if stemmed in STOP_WORDS:
                continue
            
            weight = 0.3 if (w in GENERIC_VERBS or stemmed in GENERIC_VERBS) else 1.0
            # Keep negations at full weight
            if w in NEGATION_WORDS or stemmed in NEGATION_WORDS:
                weight = 1.0
            
            weighted_tokens[stemmed] = max(weighted_tokens.get(stemmed, 0.0), weight)
            
        return weighted_tokens

    def _cosine_similarity(self, dict1: Dict[str, float], dict2: Dict[str, float]) -> float:
        if not dict1 or not dict2:
            return 0.0
            
        # Negation mismatch detection: if one contains negation and the other does not, reject
        has_neg1 = any(w in NEGATION_WORDS for w in dict1)
        has_neg2 = any(w in NEGATION_WORDS for w in dict2)
        if has_neg1 != has_neg2:
            return 0.0

        intersection_sum = 0.0
        for w, weight1 in dict1.items():
            if w in dict2:
                intersection_sum += weight1 * dict2[w]

        len1 = math.sqrt(sum(v**2 for v in dict1.values()))
        len2 = math.sqrt(sum(v**2 for v in dict2.values()))
        
        return intersection_sum / (len1 * len2) if (len1 > 0 and len2 > 0) else 0.0

    def extract_prompt_text(self, payload: Dict[str, Any]) -> str:
        messages = payload.get("messages", [])
        user_msgs = [m.get("content", "") for m in messages if m.get("role") == "user"]
        return user_msgs[-1].strip() if user_msgs else ""

    async def get(self, payload: Dict[str, Any]) -> Optional[Tuple[str, float]]:
        prompt = self.extract_prompt_text(payload)
        if not prompt:
            return None
            
        tokens = self._tokenize_and_weight(prompt)
        best_sim = 0.0
        best_resp = None

        for stored_prompt, stored_tokens, stored_resp in self._entries:
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
        tokens = self._tokenize_and_weight(prompt)
        # Avoid duplicates in cache
        for stored_prompt, _, _ in self._entries:
            if stored_prompt == prompt:
                return
        self._entries.append((prompt, tokens, response_text))

semantic_cache = SemanticCache(threshold=settings.semantic_threshold)
