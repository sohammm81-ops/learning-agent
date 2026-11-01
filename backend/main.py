from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from llm import generate_reply

app = FastAPI(title="Learning Agent API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=2000)


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/chat")
def chat(req: ChatRequest):
    message = req.message.strip()
    if not message:
        raise HTTPException(status_code=400, detail="Message is empty.")
    try:
        reply = generate_reply(message)
        return {"reply": reply}
    except Exception as e:
        print("LLM error:", repr(e))
        text = str(e).lower()
        if "429" in text or "quota" in text or "rate" in text:
            raise HTTPException(status_code=429, detail="Rate limit reached. Try again in a minute.")
        if "503" in text or "unavailable" in text:
            raise HTTPException(status_code=503, detail="The AI model is busy right now. Please try again in a moment.")
        raise HTTPException(status_code=502, detail="The AI service failed. Please try again.")