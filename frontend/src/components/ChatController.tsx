"use client";

import { useEffect, useMemo, useState } from "react";

import type { ChatMessage, ChatTranscript } from "../types/chat";

const INTRO_MESSAGE: ChatMessage = {
  role: "assistant",
  content:
    "Hello! Our records show that you currently owe $2400. Are you able to resolve this debt today?",
};

const BACKEND_BASE_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:4000";

const mapToDisplayMessages = (messages: ChatTranscript) =>
  messages.map((message, index) => ({
    key: `${message.role}-${index}`,
    ...message,
  }));

const ensureTranscript = (messages: ChatTranscript | undefined): ChatTranscript =>
  messages && messages.length > 0 ? messages : [INTRO_MESSAGE];

const buildUserMessage = (content: string): ChatMessage => ({
  role: "user",
  content,
});

const buildAssistantScaffold = (): ChatMessage => ({
  role: "assistant",
  content: "",
});

const createRequestId = (): string => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return Math.random().toString(36).slice(2);
};

export default function ChatController() {
  const [transcript, setTranscript] = useState<ChatTranscript>([INTRO_MESSAGE]);
  const [draft, setDraft] = useState("");
  const [isHydrating, setIsHydrating] = useState(true);
  const [isPersisting, setIsPersisting] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const displayMessages = useMemo(
    () => mapToDisplayMessages(transcript),
    [transcript]
  );

  const isBusy = isHydrating || isPersisting || isStreaming;

  useEffect(() => {
    let isCancelled = false;

    const loadHistory = async () => {
      try {
        const response = await fetch(`${BACKEND_BASE_URL}/api/history`, {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error(`Unexpected status ${response.status}`);
        }

        const payload = (await response.json()) as { messages?: ChatTranscript };

        if (!isCancelled) {
          setTranscript(ensureTranscript(payload.messages));
          setErrorMessage(null);
        }
      } catch (error) {
        if (!isCancelled) {
          setTranscript([INTRO_MESSAGE]);
          setErrorMessage(
            error instanceof Error
              ? `Unable to load history: ${error.message}`
              : "Unable to load history."
          );
        }
      } finally {
        if (!isCancelled) {
          setIsHydrating(false);
        }
      }
    };

    void loadHistory();

    return () => {
      isCancelled = true;
    };
  }, []);

  const persistTranscript = async (
    nextTranscript: ChatTranscript,
    fallback: ChatTranscript
  ) => {
    setIsPersisting(true);

    try {
      const response = await fetch(`${BACKEND_BASE_URL}/api/history`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ messages: nextTranscript }),
      });

      if (!response.ok) {
        throw new Error(`Unexpected status ${response.status}`);
      }

      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? `Unable to save conversation: ${error.message}`
          : "Unable to save conversation."
      );
      setTranscript(fallback);
    } finally {
      setIsPersisting(false);
    }
  };

  const streamAssistantReply = async (
    conversation: ChatTranscript,
    requestId: string,
    onChunk: (content: string) => void
  ): Promise<string> => {
    const response = await fetch(`${BACKEND_BASE_URL}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Request-Id": requestId,
      },
      body: JSON.stringify({ messages: conversation }),
    });

    if (!response.ok || !response.body) {
      throw new Error(
        response.body
          ? `Unexpected status ${response.status}`
          : "Streaming is not supported in this environment"
      );
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let aggregated = "";

    while (true) {
      const { value, done } = await reader.read();
      if (done) {
        break;
      }

      const chunk = decoder.decode(value, { stream: true });
      aggregated += chunk;
      onChunk(aggregated);
    }

    const finalChunk = decoder.decode();
    if (finalChunk) {
      aggregated += finalChunk;
      onChunk(aggregated);
    }
    return aggregated;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmed = draft.trim();
    if (!trimmed || isBusy) {
      return;
    }

    const requestId = createRequestId();
    setErrorMessage(null);
    const previousTranscript = transcript;
    const updatedTranscript: ChatTranscript = [
      ...transcript,
      buildUserMessage(trimmed),
      buildAssistantScaffold(),
    ];

    setTranscript(updatedTranscript);
    setDraft("");

    try {
      setIsStreaming(true);

      const assistantContent = await streamAssistantReply(
        updatedTranscript.slice(0, -1),
        requestId,
        (partialContent) => {
          setTranscript((current) => {
            const next = [...current];
            const lastIndex = next.length - 1;

            if (lastIndex >= 0 && next[lastIndex]?.role === "assistant") {
              next[lastIndex] = { ...next[lastIndex], content: partialContent };
            }

            return next;
          });
        }
      );

      const finalTranscript: ChatTranscript = [
        ...updatedTranscript.slice(0, -1),
        {
          role: "assistant",
          content: assistantContent,
        },
      ];

      await persistTranscript(finalTranscript, previousTranscript);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to contact assistant."
      );
      setTranscript(previousTranscript);
    } finally {
      setIsStreaming(false);
    }
  };

  const handleDeleteHistory = async () => {
    if (isBusy) {
      return;
    }

    const previousTranscript = transcript;
    const resetTranscript: ChatTranscript = [INTRO_MESSAGE];

    setTranscript(resetTranscript);
    setIsPersisting(true);

    try {
      const response = await fetch(`${BACKEND_BASE_URL}/api/history`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error(`Unexpected status ${response.status}`);
      }

      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? `Unable to delete history: ${error.message}`
          : "Unable to delete history."
      );
      setTranscript(previousTranscript);
    } finally {
      setIsPersisting(false);
    }
  };

  return (
    <section className="relative w-full max-w-3xl overflow-hidden rounded-3xl border border-white/10 bg-slate-900/60 p-6 shadow-2xl backdrop-blur-xl">
      <div className="pointer-events-none absolute inset-0 opacity-40">
        <div className="absolute -top-32 right-0 h-64 w-64 rounded-full bg-brand-600/60 blur-3xl" />
        <div className="absolute bottom-0 left-[-4rem] h-72 w-72 rounded-full bg-brand-300/30 blur-[120px]" />
      </div>
      <header className="relative z-10 mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-brand-300">
            CollectWise Negotiation Agent
          </h1>
          <p className="mt-2 text-sm text-slate-300">
            A minimal chat UI that stores transcripts in the backend history
            service. The negotiation flow will connect in a follow-up story.
          </p>
        </div>
        <button
          type="button"
          onClick={handleDeleteHistory}
          className="self-start rounded-full border border-red-500/40 bg-red-500/10 px-4 py-2 text-xs font-semibold text-red-200 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isBusy}
        >
          Delete History
        </button>
      </header>

      {errorMessage && (
        <div
          role="alert"
          className="relative z-10 mb-4 rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-xs text-red-200"
        >
          {errorMessage}
        </div>
      )}

      <div
        className="relative z-10 space-y-3 overflow-y-auto rounded-xl bg-slate-950/40 p-4"
        aria-live="polite"
        aria-busy={isHydrating}
      >
        {isHydrating ? (
          <p className="text-sm text-slate-400">Loading history…</p>
        ) : (
          displayMessages.map((message) => (
            <article
              key={message.key}
              className={`flex w-full ${
                message.role === "assistant" ? "justify-start" : "justify-end"
              }`}
            >
              <p
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6 shadow-lg ${
                  message.role === "assistant"
                    ? "bg-brand-700 text-white"
                    : "bg-slate-800 text-slate-100"
                }`}
              >
                {message.content}
              </p>
            </article>
          ))
        )}
      </div>

      <form
        onSubmit={handleSubmit}
        className="relative z-10 mt-6 flex items-center gap-3 rounded-full border border-white/5 bg-slate-950/80 p-2 shadow-lg"
      >
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Describe your situation and desired plan..."
          className="flex-1 rounded-full bg-transparent px-4 py-2 text-sm text-slate-100 outline-none placeholder:text-slate-500"
          aria-label="Chat message"
          disabled={isBusy}
        />
        <button
          type="submit"
          className="rounded-full bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-400 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isBusy}
        >
          {isStreaming ? "Sending…" : isPersisting ? "Saving…" : "Send"}
        </button>
      </form>

      <p className="relative z-10 mt-3 text-center text-xs text-slate-400">
        Conversation saves automatically whenever the backend is reachable.
      </p>
    </section>
  );
}
