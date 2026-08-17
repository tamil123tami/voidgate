import os
from pydantic import BaseModel
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class VoidGateConfig(BaseModel):
    redis_url: str = os.getenv("REDIS_URL", "redis://localhost:6379")
    semantic_threshold: float = float(os.getenv("SEMANTIC_THRESHOLD", "0.92"))
    ollama_url: str = os.getenv("OLLAMA_URL", "http://localhost:11434")
    ollama_model: str = os.getenv("OLLAMA_MODEL", "phi3:mini")
    groq_api_key: str = os.getenv("GROQ_API_KEY", "")
    gemini_api_key: str = os.getenv("GEMINI_API_KEY", "")
    openai_api_key: str = os.getenv("OPENAI_API_KEY", "")
    openai_base_url: str = os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1")
    anthropic_api_key: str = os.getenv("ANTHROPIC_API_KEY", "")
    db_path: str = os.getenv("DB_PATH", "voidgate_metrics.db")
    simulate_failover: bool = os.getenv("SIMULATE_FAILOVER", "false").lower() == "true"
    failover_trigger_token: int = int(os.getenv("FAILOVER_TRIGGER_TOKEN", "20"))
    primary_cloud_model: str = os.getenv("PRIMARY_CLOUD_MODEL", "llama-3.3-70b-versatile")
    failover_cloud_model: str = os.getenv("FAILOVER_CLOUD_MODEL", "gemini-1.5-pro")
    cors_allowed_origins: str = os.getenv("CORS_ALLOWED_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000")
    port: int = int(os.getenv("PORT", "8001"))

settings = VoidGateConfig()

