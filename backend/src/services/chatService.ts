import { createOpenAI } from "@ai-sdk/openai";
import { streamText, type CoreMessage, type LanguageModel } from "ai";

import {
  defaultRetrySettings,
  type ChatMessage,
  type RetrySettings,
  type ServiceResult,
} from "../types/chat.types.js";
import { logError, logInfo, logWarn } from "../utils/logger.js";

export type ChatStream = Awaited<ReturnType<typeof streamText>>;

/**
 * Resolves the OpenAI API key using production and local development fallbacks.
 * Throws when no key is configured so callers can surface a 500-level error.
 */
const resolveOpenAIApiKey = (): string => {
  const key = process.env.OPENAI_API_KEY ?? process.env.LOCAL_OPENAI_API_KEY;

  if (!key) {
    throw new Error(
      "Missing OpenAI API key. Set OPENAI_API_KEY or LOCAL_OPENAI_API_KEY."
    );
  }

  return key;
};

/**
 * Uses an environment override for the model and falls back to `gpt-4o-mini` to
 * balance latency and cost for negotiation flows.
 */
const resolveModelName = (): string => process.env.OPENAI_MODEL ?? "gpt-4o-mini";

/**
 * Translates CollectWise chat messages into the AI SDK structure.
 */
const mapMessages = (messages: ChatMessage[]): CoreMessage[] =>
  messages.map((message) => ({
    role: message.role,
    content: message.content,
  }));

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Flags OpenAI/Vercel AI SDK errors that are safe to retry (timeouts, rate limits,
 * or transient server failures). Non-network 4xx errors short-circuit retries.
 */
const isRetryableError = (error: unknown): boolean => {
  if (!error || typeof error !== "object") {
    return false;
  }

  const status = Reflect.get(error, "status");

  if (typeof status === "number") {
    return status === 429 || status === 408 || status >= 500;
  }

  const code = Reflect.get(error, "code");

  if (typeof code === "string") {
    return ["ETIMEDOUT", "ECONNRESET", "EAI_AGAIN"].includes(code);
  }

  return false;
};

interface ChatServiceDependencies {
  createModel: () => LanguageModel;
  streamFn: typeof streamText;
}

const createDefaultDependencies = (): ChatServiceDependencies => ({
  createModel: () => {
    const client = createOpenAI({ apiKey: resolveOpenAIApiKey() });
    return client(resolveModelName());
  },
  streamFn: streamText,
});

interface StreamChatOptions {
  messages: ChatMessage[];
  requestId: string;
  retry?: RetrySettings;
  abortSignal?: AbortSignal;
}

/**
 * Streams a response from OpenAI using the Vercel AI SDK. Includes structured
 * logging and exponential backoff to improve reliability when the upstream API
 * throttles or flakes. Returns a {@link ServiceResult} wrapping the stream.
 */
export const streamChatResponse = async ({
  messages,
  requestId,
  retry = defaultRetrySettings,
  abortSignal,
}: StreamChatOptions, deps: ChatServiceDependencies = createDefaultDependencies()): Promise<ServiceResult<ChatStream>> => {
  let attempt = 0;
  let delayMs = retry.initialDelayMs;

  while (attempt < retry.maxAttempts) {
    try {
      attempt += 1;
      logInfo("Proxying chat request to OpenAI", {
        requestId,
        attempt,
        messageCount: messages.length,
      });

      const model = deps.createModel();

      const stream = await deps.streamFn({
        model,
        messages: mapMessages(messages),
        temperature: 0.3,
        maxRetries: 0,
        abortSignal,
      });

      logInfo("OpenAI stream established", {
        requestId,
        attempt,
      });

      return { ok: true, payload: stream };
    } catch (error) {
      const baseContext = {
        requestId,
        attempt,
        error: error instanceof Error ? error.message : "Unknown error",
      };

      if (attempt >= retry.maxAttempts || !isRetryableError(error)) {
        logError("Streaming chat response failed", baseContext);
        return { ok: false, error: baseContext.error };
      }

      logWarn("Transient error streaming chat response; retrying", {
        ...baseContext,
        retryDelayMs: delayMs,
      });

      await delay(delayMs);
      delayMs *= 2;
    }
  }

  const message = "Exceeded retry attempts while contacting OpenAI.";
  logError(message, { requestId });
  return { ok: false, error: message };
};
