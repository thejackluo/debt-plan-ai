import { describe, expect, it, jest } from "@jest/globals";
import type { LanguageModel } from "ai";

import {
  streamChatResponse,
  type ChatStream,
} from "../src/services/chatService.js";
import type { ChatMessage } from "../src/types/chat.types.js";

const baseMessages: ChatMessage[] = [
  { role: "system", content: "You are a helpful assistant." },
  { role: "user", content: "Hello" },
];

const createStreamMock = () =>
  ({
    pipeTextStreamToResponse: jest.fn(),
    textStream: {
      async *[Symbol.asyncIterator]() {
        // no-op iterator for tests
      },
    },
  }) as unknown as ChatStream;

const createDeps = ({
  streamResult,
  streamImplementation,
}: {
  streamResult?: ChatStream;
  streamImplementation?: () => Promise<ChatStream>;
} = {}) => {
  const streamMock = streamResult ?? createStreamMock();
  const streamFn = jest
    .fn()
    .mockImplementation(
      streamImplementation ?? (() => Promise.resolve(streamMock))
    ) as any;
  const model = {} as unknown as LanguageModel;

  return {
    createModel: jest.fn(() => model),
    streamFn,
    streamMock,
  };
};

describe("streamChatResponse", () => {
  it("returns a stream when OpenAI succeeds", async () => {
    const { createModel, streamFn, streamMock } = createDeps();

    const result = await streamChatResponse(
      {
        messages: baseMessages,
        requestId: "test-1",
        retry: { maxAttempts: 2, initialDelayMs: 1 },
      },
      { createModel, streamFn }
    );

    expect(result.ok).toBe(true);
    expect(result.payload).toBe(streamMock);
    expect(createModel).toHaveBeenCalledTimes(1);
    expect(streamFn).toHaveBeenCalledTimes(1);
  });

  it("retries transient failures before succeeding", async () => {
    const streamMock = createStreamMock();
    const transientError = { status: 500, message: "Server exploded" };
    const streamFn = jest.fn() as any;
    streamFn.mockRejectedValueOnce(transientError);
    streamFn.mockResolvedValue(streamMock);
    const { createModel } = createDeps({ streamResult: streamMock });

    const result = await streamChatResponse(
      {
        messages: baseMessages,
        requestId: "retry-1",
        retry: { maxAttempts: 3, initialDelayMs: 1 },
      },
      { createModel, streamFn }
    );

    expect(result.ok).toBe(true);
    expect(streamFn).toHaveBeenCalledTimes(2);
  });

  it("stops retrying for non-retryable errors", async () => {
    const nonRetryable = { status: 400, message: "Bad input" };
    const streamFn = jest.fn() as any;
    streamFn.mockRejectedValue(nonRetryable);
    const { createModel } = createDeps();

    const result = await streamChatResponse(
      {
        messages: baseMessages,
        requestId: "no-retry",
        retry: { maxAttempts: 2, initialDelayMs: 1 },
      },
      { createModel, streamFn }
    );

    expect(result.ok).toBe(false);
    expect(streamFn).toHaveBeenCalledTimes(1);
  });
});
