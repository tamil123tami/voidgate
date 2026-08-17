from typing import List, Optional, Literal
from pydantic import BaseModel, Field, validator

class Message(BaseModel):
    role: Literal["system", "user", "assistant"]
    content: str

class ChatCompletionRequest(BaseModel):
    model: str = Field(default="gpt-4o", description="Model identifier")
    messages: List[Message] = Field(..., min_items=1, description="List of messages")
    temperature: Optional[float] = Field(default=1.0, ge=0.0, le=2.0)
    max_tokens: Optional[int] = Field(default=None, ge=1)
    stream: Optional[bool] = Field(default=True)

    @validator("messages")
    def validate_messages(cls, v):
        if not v:
            raise ValueError("Messages list cannot be empty")
        for msg in v:
            if not msg.content.strip():
                raise ValueError("Message content cannot be empty")
        return v

class ChatCompletionResponse(BaseModel):
    id: str
    object: str = "chat.completion"
    choices: List[dict]

class StatsResponse(BaseModel):
    total_requests: int
    total_saved: float
    deflection_rate: float
    layer_breakdown: dict

class HealthResponse(BaseModel):
    status: str
    service: str
    port: int
