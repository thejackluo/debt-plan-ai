import { z } from "zod";

import type { ChatMessage, ChatRequestBody, ServiceResult } from "../types/chat.types.js";

const chatMessageSchema = z.object({
  role: z.enum(["system", "user", "assistant"], {
    errorMap: () => ({ message: "role must be system, user, or assistant" }),
  }),
  content: z
    .string({ required_error: "content is required" })
    .trim()
    .min(1, "content cannot be empty"),
});

const chatRequestSchema = z.object({
  messages: z
    .array(chatMessageSchema, { invalid_type_error: "messages must be an array" })
    .min(1, "messages must include at least one entry"),
});

export interface ValidatedChatPayload extends ChatRequestBody {}

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

  const sanitizedMessages: ChatMessage[] = parsed.data.messages.map((message) => ({
    role: message.role,
    content: message.content,
  }));

  return {
    ok: true,
    payload: { messages: sanitizedMessages },
  };
};
