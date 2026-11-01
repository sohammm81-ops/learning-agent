import os
import time
from dotenv import load_dotenv
from google import genai
from google.genai import types

load_dotenv()

API_KEY = os.getenv("GEMINI_API_KEY")
MODEL = os.getenv("GEMINI_MODEL", "gemini-3.8-flash")
FALLBACK_MODEL = os.getenv("GEMINI_FALLBACK_MODEL")

SYSTEM_PROMPT = (
    "You are a helpful learning assistant. Give clear, accurate answers. "
    "If you are not sure about something, say so instead of guessing."
)

if not API_KEY:
    raise RuntimeError("GEMINI_API_KEY is missing. Add it to backend/.env")

client = genai.Client(
    api_key=API_KEY,
    http_options=types.HttpOptions(timeout=30000),  # milliseconds
)

RETRIES_PER_MODEL = 3


def _is_temporary(error: Exception) -> bool:
    text = str(error)
    return "503" in text or "UNAVAILABLE" in text or "overloaded" in text.lower()


def _call(model: str, user_message: str) -> str:
    response = client.models.generate_content(
        model=model,
        contents=user_message,
        config=types.GenerateContentConfig(
            system_instruction=SYSTEM_PROMPT,
            max_output_tokens=1024,
        ),
    )
    return response.text or "I could not generate an answer."


def generate_reply(user_message: str) -> str:
    models = [MODEL] + ([FALLBACK_MODEL] if FALLBACK_MODEL else [])
    last_error = None

    for model in models:
        for attempt in range(RETRIES_PER_MODEL):
            try:
                return _call(model, user_message)
            except Exception as e:
                last_error = e
                if not _is_temporary(e):
                    raise  # real error (bad key, 404, 429): do not retry
                print(f"{model} busy (attempt {attempt + 1}), retrying...")
                time.sleep(2 ** attempt)  # waits 1s, 2s, 4s

        print(f"Switching from {model} to the next model...")

    raise last_error