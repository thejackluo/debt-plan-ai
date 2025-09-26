"use client";

import { useState } from "react";

interface Message {
  id: number;
  role: "user" | "agent";
  content: string;
}

export default function HomePage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      role: "agent",
      content:
        "Hello! Our records show that you currently owe $2400. Are you able to resolve this debt today?",
    },
  ]);
  const [draft, setDraft] = useState("");

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!draft.trim()) {
      return;
    }

    setMessages((existing) => [
      ...existing,
      { id: Date.now(), role: "user", content: draft.trim() },
      {
        id: Date.now() + 1,
        role: "agent",
        content: "This is a placeholder until the negotiation agent is wired up.",
      },
    ]);

    setDraft("");
  };

  return (
    <main className="flex min-h-screen w-full items-center justify-center px-4 py-10">
      <section className="w-full max-w-3xl rounded-3xl border border-white/10 bg-slate-900/60 p-6 shadow-2xl">
        <header className="mb-6 text-center">
          <h1 className="text-3xl font-semibold text-brand-300">
            CollectWise Negotiation Agent
          </h1>
          <p className="mt-2 text-sm text-slate-300">
            Baseline UI scaffold. Future stories connect this to the backend LangGraph
            agent to negotiate realistic payment plans.
          </p>
        </header>

        <div className="space-y-3 overflow-y-auto rounded-xl bg-slate-950/40 p-4">
          {messages.map((message) => (
            <article
              key={message.id}
              className={`flex w-full ${
                message.role === "agent" ? "justify-start" : "justify-end"
              }`}
            >
              <p
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6 shadow-lg ${
                  message.role === "agent"
                    ? "bg-brand-700 text-white"
                    : "bg-slate-800 text-slate-100"
                }`}
              >
                {message.content}
              </p>
            </article>
          ))}
        </div>

        <form
          onSubmit={handleSubmit}
          className="mt-6 flex items-center gap-3 rounded-full border border-white/5 bg-slate-950/80 p-2"
        >
          <input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Describe your situation and desired plan..."
            className="flex-1 rounded-full bg-transparent px-4 py-2 text-sm text-slate-100 outline-none placeholder:text-slate-500"
            aria-label="Chat message"
          />
          <button
            type="submit"
            className="rounded-full bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-400"
          >
            Send
          </button>
        </form>
      </section>
    </main>
  );
}
