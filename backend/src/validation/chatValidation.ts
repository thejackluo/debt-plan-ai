import { z } from "zod";

import type {
  ChatMessage,
  ChatRequestBody,
  ServiceResult,
} from "../types/chat.types.js";

/**
 * Runtime schema describing the subset of OpenAI chat messages accepted from the
 * frontend. Restricts roles and ensures content is non-empty after trimming.
 */
const chatMessageSchema = z.object({
  role: z.enum(["system", "user", "assistant"], {
    errorMap: () => ({ message: "role must be system, user, or assistant" }),
  }),
  content: z.string({ required_error: "content is required" }).trim(), // Allow empty content for streaming scenarios
});

/**
 * Schema for the `/api/chat` request payload. Ensures at least one message is sent
 * and delegates per-message validation to {@link chatMessageSchema}.
 */
const chatRequestSchema = z.object({
  messages: z
    .array(chatMessageSchema, {
      invalid_type_error: "messages must be an array",
    })
    .min(1, "messages must include at least one entry"),
});

export interface ValidatedChatPayload extends ChatRequestBody {}

/**
 * Validates and sanitises an incoming `/api/chat` payload, returning a typed result
 * that isolates caller-friendly error messages for HTTP responses.
 */
export const validateChatRequest = (
  payload: unknown
): ServiceResult<ValidatedChatPayload> => {
  const parsed = chatRequestSchema.safeParse(payload);

  if (!parsed.success) {
    const [firstIssue] = parsed.error.issues;
    return {
      ok: false,
      error: firstIssue?.message ?? "Invalid request payload",
    };
  }

  const sanitizedMessages: ChatMessage[] = parsed.data.messages.map(
    (message) => ({
      role: message.role,
      content: message.content,
    })
  );

  return {
    ok: true,
    payload: { messages: sanitizedMessages },
  };
};
