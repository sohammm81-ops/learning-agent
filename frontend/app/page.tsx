"use client";
import { useState, useRef, useEffect } from "react";

type Message = {
  id: number;
  role: "user" | "assistant";
  text: string;
  isError?: boolean;
};

const API_URL = "http://localhost:8000";
const MAX_LENGTH = 2000;

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Scroll to the newest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function sendMessage() {
    const text = input.trim();
    if (!text || loading) return; // ignore empty messages

    const userMsg: Message = { id: Date.now(), role: "user", text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, role: "assistant", text: data.reply },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: "assistant",
          text: "Sorry, I could not reach the server. Please try again.",
          isError: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    // Enter sends, Shift+Enter adds a new line
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <main className="mx-auto flex h-screen max-w-2xl flex-col p-4">
      <header className="flex items-center justify-between border-b pb-3">
        <h1 className="text-xl font-bold">Learning Agent</h1>
        <button
          onClick={() => setMessages([])}
          disabled={messages.length === 0}
          className="rounded border px-3 py-1 text-sm disabled:opacity-40"
        >
          Clear chat
        </button>
      </header>

      <div className="flex-1 space-y-3 overflow-y-auto py-4">
        {messages.length === 0 && (
          <p className="mt-10 text-center text-gray-500">
            Ask me anything to get started.
          </p>
        )}

        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] whitespace-pre-wrap break-words rounded-2xl px-4 py-2 ${
                m.role === "user"
                  ? "bg-blue-600 text-white"
                  : m.isError
                  ? "bg-red-100 text-red-700"
                  : "bg-gray-200 text-gray-900"
              }`}
            >
              {m.text}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="rounded-2xl bg-gray-200 px-4 py-2 text-gray-500">
              Thinking...
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="border-t pt-3">
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value.slice(0, MAX_LENGTH))}
            onKeyDown={handleKeyDown}
            rows={2}
            placeholder="Type your message..."
            className="flex-1 resize-none rounded border p-2 text-gray-900"
          />
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-40"
          >
            Send
          </button>
        </div>
        <p className="mt-1 text-right text-xs text-gray-400">
          {input.length}/{MAX_LENGTH}
        </p>
      </div>
    </main>
  );
}