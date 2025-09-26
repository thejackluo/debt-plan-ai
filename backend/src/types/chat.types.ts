export type ChatRole = "system" | "user" | "assistant";

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export type ChatTranscript = ChatMessage[];

export interface ChatRequestBody {
  messages: ChatMessage[];
}

export interface ServiceResult<TPayload>
  extends Readonly<{
    ok: boolean;
    payload?: TPayload;
    error?: string;
  }> {}

export interface RetrySettings {
  maxAttempts: number;
  initialDelayMs: number;
}

export const defaultRetrySettings: RetrySettings = {
  maxAttempts: 3,
  initialDelayMs: 500,
};
