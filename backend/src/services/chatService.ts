import { createOpenAI } from "@ai-sdk/openai";
import { streamText, type CoreMessage, type LanguageModel } from "ai";
import { Readable } from "node:stream";
import { HumanMessage, AIMessage } from "@langchain/core/messages";

import {
  defaultRetrySettings,
  type ChatMessage,
  type RetrySettings,
  type ServiceResult,
} from "../types/chat.types.js";
import { logError, logInfo, logWarn } from "../utils/logger.js";
import { negotiationGraph, type AgentState } from "../agent/graph.js";

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
const resolveModelName = (): string =>
  process.env.OPENAI_MODEL ?? "gpt-4o-mini";

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

/**
 * Creates a stream-compatible object from LangGraph agent output.
 * This allows the agent to integrate with the existing streaming infrastructure.
 */
const createAgentStream = (agentResponse: string): ChatStream => {
  let sentResponse = false;

  const readable = new Readable({
    read() {
      if (!sentResponse) {
        this.push(agentResponse);
        sentResponse = true;
      } else {
        this.push(null); // End the stream
      }
    },
  });

  // Create a proper StreamTextResult-compatible object
  return {
    textStream: readable,
    text: Promise.resolve(agentResponse),
    content: Promise.resolve(agentResponse),
    reasoning: Promise.resolve([]),
    reasoningText: Promise.resolve(""),
    usage: Promise.resolve({
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
    }),
    finishReason: Promise.resolve("stop" as const),
    experimental_providerMetadata: Promise.resolve({}),
    warnings: undefined,
    rawResponse: Promise.resolve({}),
    request: Promise.resolve({}),
    response: Promise.resolve({}),
    pipeTextStreamToResponse: (res: any, options?: any) => {
      if (options?.status) {
        res.status(options.status);
      }
      if (options?.headers) {
        for (const [key, value] of Object.entries(options.headers)) {
          res.setHeader(key, value);
        }
      }
      res.setHeader("Content-Type", "text/plain");
      res.write(agentResponse);
      res.end();
    },
  } as unknown as ChatStream;
};

/**
 * Processes a conversation through the LangGraph negotiation agent.
 * TODO: Story 1.5 will enhance this with full BAML integration and proper streaming
 */
const processWithAgent = async (
  messages: ChatMessage[],
  requestId: string
): Promise<ServiceResult<ChatStream>> => {
  try {
    logInfo("Processing conversation through LangGraph agent", {
      requestId,
      messageCount: messages.length,
    });

    // Initialize agent state
    const initialState: AgentState = {
      messages: messages.map((msg) =>
        msg.role === "user"
          ? new HumanMessage(msg.content)
          : new AIMessage(msg.content)
      ),
      negotiation_attempts: 0,
      conversation_ended: false,
    };

    logInfo("Agent processing status", {
      requestId,
      messageCount: messages.length,
      isFirstMessage: messages.length === 1,
      lastMessage: messages[messages.length - 1]?.content?.substring(0, 100),
    });

    // Always run through the agent for all messages
    let agentResponse =
      "Hello! Our records show that you currently owe $2400. Are you able to resolve this debt today?";

    try {
      // Run the LangGraph agent with the updated v0.4.9 API
      const result = await negotiationGraph.invoke(initialState);

      // Extract the final message from the agent result
      if (result.messages && result.messages.length > 0) {
        const lastMessage = result.messages[result.messages.length - 1];
        if (lastMessage && typeof lastMessage.content === "string") {
          agentResponse = lastMessage.content;
        }
      }

      logInfo("LangGraph agent processed conversation", {
        requestId,
        userIntent: result.user_intent,
        conversationEnded: result.conversation_ended,
        currentOffer: result.current_offer,
        finalAgreement: result.final_agreement,
      });
    } catch (error) {
      logWarn("Agent processing failed, using fallback response", {
        requestId,
        error: error instanceof Error ? error.message : "Unknown error",
        errorStack: error instanceof Error ? error.stack : undefined,
      });
      // For debugging: show what went wrong
      agentResponse = `I understand you're trying to communicate with me. Let me help you resolve your $2400 debt. Can you tell me about your current situation?`;
    }

    const stream = createAgentStream(agentResponse);
    return { ok: true, payload: stream };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Agent processing failed";
    logError("Failed to process with LangGraph agent", {
      requestId,
      error: message,
    });
    return { ok: false, error: message };
  }
};

interface ChatServiceDependencies {
  createModel: () => LanguageModel;
  streamFn: typeof streamText;
  useAgent?: boolean; // New option to enable LangGraph integration
}

const createDefaultDependencies = (): ChatServiceDependencies => ({
  createModel: () => {
    const client = createOpenAI({ apiKey: resolveOpenAIApiKey() });
    return client(resolveModelName());
  },
  streamFn: streamText,
  useAgent: true, // Enable LangGraph agent for Story 1.4
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
export const streamChatResponse = async (
  {
    messages,
    requestId,
    retry = defaultRetrySettings,
    abortSignal,
  }: StreamChatOptions,
  deps: ChatServiceDependencies = createDefaultDependencies()
): Promise<ServiceResult<ChatStream>> => {
  // Use LangGraph agent if enabled (default for Story 1.4)
  if (deps.useAgent) {
    logInfo("Using LangGraph negotiation agent", { requestId });
    return processWithAgent(messages, requestId);
  }

  // Fallback to direct OpenAI streaming for testing or when agent is disabled
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
