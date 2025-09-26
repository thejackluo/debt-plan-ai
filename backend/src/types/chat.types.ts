/**
 * Allowed OpenAI chat roles supported by the CollectWise backend.
 */
export type ChatRole = "system" | "user" | "assistant";

/**
 * Canonical chat message exchanged between the frontend, backend, and OpenAI.
 */
export interface ChatMessage {
  role: ChatRole;
  content: string;
}

/**
 * In-memory transcript of messages exchanged in a conversation.
 */
export type ChatTranscript = ChatMessage[];

/**
 * Request contract accepted by the `/api/chat` endpoint.
 */
export interface ChatRequestBody {
  messages: ChatMessage[];
}

/**
 * Consistent service-layer envelope for success/error results.
 */
export interface ServiceResult<TPayload>
  extends Readonly<{
    ok: boolean;
    payload?: TPayload;
    error?: string;
  }> {}

/**
 * Configuration for the exponential backoff used when calling OpenAI.
 */
export interface RetrySettings {
  maxAttempts: number;
  initialDelayMs: number;
}

/**
 * Project-wide default retry settings: three attempts with doubling delay.
 */
export const defaultRetrySettings: RetrySettings = {
  maxAttempts: 3,
  initialDelayMs: 500,
};
