"use client";
import { useState } from "react";

export default function Home() {
  const [status, setStatus] = useState("not checked");

  async function checkBackend() {
    try {
      const res = await fetch("http://localhost:8000/health");
      const data = await res.json();
      setStatus(data.status);
    } catch {
      setStatus("backend unreachable");
    }
  }

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold">Learning Agent</h1>
      <button
        onClick={checkBackend}
        className="mt-4 rounded bg-blue-600 px-4 py-2 text-white"
      >
        Check backend
      </button>
      <p className="mt-2">Backend status: {status}</p>
    </main>
  );
}