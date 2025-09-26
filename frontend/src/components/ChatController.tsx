"use client";

import { useEffect, useMemo, useState } from "react";

import type { ChatMessage, ChatTranscript } from "../types/chat";

// Remove hardcoded intro message - let the backend agent generate the first response

const BACKEND_BASE_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:4000";

const mapToDisplayMessages = (messages: ChatTranscript) =>
  messages.map((message, index) => ({
    key: `${message.role}-${index}`,
    ...message,
  }));

const ensureTranscript = (
  messages: ChatTranscript | undefined
): ChatTranscript => (messages && messages.length > 0 ? messages : []);

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
  const [transcript, setTranscript] = useState<ChatTranscript>([]);
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

        const payload = (await response.json()) as {
          messages?: ChatTranscript;
        };

        if (!isCancelled) {
          const loadedTranscript = ensureTranscript(payload.messages);

          // If no history exists, start with the initial greeting message
          if (loadedTranscript.length === 0) {
            const initialMessage: ChatMessage = {
              role: "assistant",
              content:
                "Hello! Our records show that you currently owe $2400. Are you able to resolve this debt today?",
            };
            setTranscript([initialMessage]);
          } else {
            setTranscript(loadedTranscript);
          }

          setErrorMessage(null);
        }
      } catch (error) {
        if (!isCancelled) {
          // Even if we can't load history, start with the initial greeting message
          const initialMessage: ChatMessage = {
            role: "assistant",
            content:
              "Hello! Our records show that you currently owe $2400. Are you able to resolve this debt today?",
          };
          setTranscript([initialMessage]);
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

    if (!response.ok) {
      let errorDetail = `Unexpected status ${response.status}`;

      try {
        const payload = (await response.json()) as { error?: string };
        if (payload?.error) {
          errorDetail = payload.error;
        }
      } catch (parseError) {
        console.warn("Unable to parse chat error payload", parseError);
      }

      throw new Error(errorDetail);
    }

    if (!response.body) {
      throw new Error("Streaming is not supported in this environment");
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
    const resetTranscript: ChatTranscript = [];

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
    <section className="relative w-full max-w-4xl overflow-hidden rounded-2xl border border-gray-200 bg-white p-8 shadow-lg">
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-medium text-gray-900">
            CollectWise Negotiation Agent
          </h1>
          <p className="mt-3 text-sm text-gray-600 leading-relaxed">
            A minimal chat UI that stores transcripts in the backend history
            service. The negotiation flow will connect in a follow-up story.
          </p>
        </div>
        <button
          type="button"
          onClick={handleDeleteHistory}
          className="self-start rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 hover:border-gray-400 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={isBusy}
        >
          Delete History
        </button>
      </header>

      {errorMessage && (
        <div
          role="alert"
          className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800"
        >
          {errorMessage}
        </div>
      )}

      <div
        className="mb-6 max-h-96 space-y-4 overflow-y-auto rounded-lg bg-gray-50 p-6"
        aria-live="polite"
        aria-busy={isHydrating}
      >
        {isHydrating ? (
          <p className="text-sm text-gray-500">Loading history…</p>
        ) : (
          displayMessages.map((message) => (
            <article
              key={message.key}
              className={`flex w-full ${
                message.role === "assistant" ? "justify-start" : "justify-end"
              }`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-5 py-3 text-sm leading-relaxed shadow-sm ${
                  message.role === "assistant"
                    ? "bg-white border border-gray-200 text-gray-900"
                    : "bg-gray-900 text-white"
                }`}
              >
                {message.content}
              </div>
            </article>
          ))
        )}
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-3 rounded-lg border border-gray-300 bg-white p-3 shadow-sm focus-within:border-gray-400 focus-within:ring-1 focus-within:ring-gray-400"
      >
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Describe your situation and desired plan..."
          className="flex-1 bg-transparent px-3 py-2 text-sm text-gray-900 outline-none placeholder:text-gray-500"
          aria-label="Chat message"
          disabled={isBusy}
        />
        <button
          type="submit"
          className="rounded-lg bg-gray-900 px-6 py-2 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={isBusy}
        >
          {isStreaming ? "Sending…" : isPersisting ? "Saving…" : "Send"}
        </button>
      </form>

      <p className="mt-4 text-center text-xs text-gray-500">
        Conversation saves automatically whenever the backend is reachable.
      </p>
    </section>
  );
}
