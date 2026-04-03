"""
Smart Router — decides whether to use local Ollama or OpenAI
based on: privacy signals, complexity, token count, and API key availability.
"""
from enum import Enum
from app.core.config import settings


class LLMProvider(str, Enum):
    OLLAMA = "ollama"
    OPENAI = "openai"


SENSITIVE_KEYWORDS = [
    "password", "secret", "confidential", "private", "ssn",
    "social security", "credit card", "bank account", "passport",
]

COMPLEX_KEYWORDS = [
    "analyze", "compare", "synthesize", "evaluate", "critique",
    "write a report", "detailed", "comprehensive", "explain in depth",
]


def route_query(query: str, force_provider: str | None = None) -> tuple[LLMProvider, str]:
    """
    Returns (provider, reason) for a given query.
    """
    # Manual override
    if force_provider == "ollama":
        return LLMProvider.OLLAMA, "manual_override"
    if force_provider == "openai":
        if not settings.openai_api_key:
            return LLMProvider.OLLAMA, "openai_key_missing_fallback"
        return LLMProvider.OPENAI, "manual_override"

    query_lower = query.lower()

    # Rule 1: Sensitive data → always local
    if any(kw in query_lower for kw in SENSITIVE_KEYWORDS):
        return LLMProvider.OLLAMA, "sensitive_data_detected"

    # Rule 2: No OpenAI key → always local
    if not settings.openai_api_key:
        return LLMProvider.OLLAMA, "no_openai_key"

    # Rule 3: Complexity score
    complexity = _score_complexity(query)
    if complexity >= settings.complexity_threshold:
        return LLMProvider.OPENAI, f"high_complexity:{complexity:.2f}"

    # Rule 4: Long queries → OpenAI handles context better
    if len(query.split()) > 150:
        return LLMProvider.OPENAI, "long_query"

    # Default: local
    return LLMProvider.OLLAMA, f"default_local:complexity={complexity:.2f}"


def _score_complexity(query: str) -> float:
    """Simple heuristic complexity scorer (0.0 - 1.0)."""
    score = 0.0
    query_lower = query.lower()

    # Keyword signals
    matches = sum(1 for kw in COMPLEX_KEYWORDS if kw in query_lower)
    score += min(matches * 0.2, 0.6)

    # Length signal
    words = len(query.split())
    if words > 50:
        score += 0.2
    elif words > 20:
        score += 0.1

    # Question complexity (multiple questions)
    score += min(query.count("?") * 0.1, 0.2)

    return min(score, 1.0)
