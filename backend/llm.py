import os
from dotenv import load_dotenv
from google import genai
from google.genai import types

load_dotenv()

API_KEY = os.getenv("GEMINI_API_KEY")
MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")

SYSTEM_PROMPT = (
    "You are a helpful learning assistant. Give clear, accurate answers. "
    "If you are not sure about something, say so instead of guessing."
)

if not API_KEY:
    raise RuntimeError("GEMINI_API_KEY is missing. Add it to backend/.env")

# 30-second timeout (the SDK expects milliseconds)
client = genai.Client(
    api_key=API_KEY,
    http_options=types.HttpOptions(timeout=30000),
)


def generate_reply(user_message: str) -> str:
    response = client.models.generate_content(
        model=MODEL,
        contents=user_message,
        config=types.GenerateContentConfig(
            system_instruction=SYSTEM_PROMPT,
            max_output_tokens=1024,
        ),
    )
    return response.text or "I could not generate an answer."