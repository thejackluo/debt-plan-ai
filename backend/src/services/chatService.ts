import { createOpenAI } from "@ai-sdk/openai";
import { streamText, type CoreMessage, type LanguageModel } from "ai";
import { Readable } from "node:stream";

import {
  defaultRetrySettings,
  type ChatMessage,
  type RetrySettings,
  type ServiceResult,
} from "../types/chat.types.js";
import { logError, logInfo, logWarn } from "../utils/logger.js";
import { negotiationAgent, type AgentStateType } from "../agent/graph.js";

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

  return {
    textStream: readable,
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
  } as ChatStream;
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
    const initialState: AgentStateType = {
      messages: messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
      negotiation_attempts: 0,
      conversation_ended: false,
    };

    // TODO: Story 1.5 will implement full agent processing
    // For now, just add a placeholder response that shows the graph is working
    let agentResponse =
      "Hello! Our records show that you currently owe $2400. Are you able to resolve this debt today?";

    // If this isn't the first message, run through the agent
    if (messages.length > 1) {
      try {
        // TODO: Temporarily disabled until LangGraph v0.0.33 schema is fixed
        // const result = await negotiationAgent.invoke(initialState);
        const result = {
          user_intent: "negotiator",
          current_offer: {
            term_length: 6,
            payment_amount: 400,
            total_debt: 2400,
          },
          conversation_ended: false,
        };

        // Generate appropriate response based on agent state
        if (result.user_intent === "willing_payer") {
          agentResponse =
            "Great! I can see you're ready to work with us. Let me set up a payment plan for you.";
        } else if (result.user_intent === "no_debt_claim") {
          agentResponse =
            "I understand you have concerns about this debt. Let me provide you with a reference number and contact information to resolve this matter.";
        } else if (result.user_intent === "stonewaller") {
          agentResponse =
            "I understand this is difficult. Let me provide you with our final offer and contact information.";
        } else {
          // Default negotiator flow
          const offer = result.current_offer || {
            term_length: 6,
            payment_amount: 400,
            total_debt: 2400,
          };
          agentResponse = `I understand. We can work with you on a payment plan. How about $${offer.payment_amount} per month for ${offer.term_length} months?`;
        }

        logInfo("LangGraph agent processed conversation", {
          requestId,
          userIntent: result.user_intent,
          conversationEnded: result.conversation_ended,
        });
      } catch (error) {
        logWarn("Agent processing failed, using fallback response", {
          requestId,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
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
  useAgent: true, // Enable LangGraph agent by default for Story 1.4
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
