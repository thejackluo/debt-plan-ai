import { describe, expect, it } from "@jest/globals";

import { validateChatRequest } from "../src/validation/chatValidation.js";

describe("validateChatRequest", () => {
  it("accepts a valid chat payload", () => {
    const payload = {
      messages: [
        { role: "system", content: "You are a bot." },
        { role: "user", content: "Hi" },
      ],
    };

    const result = validateChatRequest(payload);

    expect(result.ok).toBe(true);
    expect(result.payload).toEqual(payload);
  });

  it("rejects requests without messages", () => {
    const result = validateChatRequest({ messages: [] });

    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/at least one/);
  });

  it("rejects invalid message roles", () => {
    const result = validateChatRequest({
      messages: [
        { role: "invalid" as any, content: "Nope" },
      ],
    });

    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/role must be system, user, or assistant/);
  });

  it("rejects empty content", () => {
    const result = validateChatRequest({
      messages: [{ role: "user", content: "   " }],
    });

    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/cannot be empty/);
  });
});
