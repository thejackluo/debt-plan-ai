import { describe, expect, it, jest } from "@jest/globals";
import express from "express";
import type { ServerResponse } from "node:http";
import request from "supertest";

import { createChatRouter } from "../src/api/chatRoutes.js";
import type { ChatStream } from "../src/services/chatService.js";
import type { ServiceResult } from "../src/types/chat.types.js";

interface PipeInit {
  status?: number;
  headers?: Record<string, string>;
}

const createStreamingPayload = (chunks: string[]): ChatStream =>
  ({
    pipeTextStreamToResponse: jest.fn(
      (res: ServerResponse, init?: PipeInit) => {
        if (init?.status) {
          res.statusCode = init.status;
        }

        if (init?.headers) {
          for (const [key, value] of Object.entries(init.headers)) {
            res.setHeader(key, value);
          }
        }

        chunks.forEach((chunk) => {
          res.write(chunk);
        });

        res.end();
      }
    ),
    textStream: {
      async *[Symbol.asyncIterator]() {
        // no-op iterator for tests
      },
    },
  }) as unknown as ChatStream;

describe("POST /api/chat", () => {
  it("streams content when the service succeeds", async () => {
    const streamMock = createStreamingPayload(["Hello", " ", "world"]);
    const streamChatResponse = jest.fn() as any;
    streamChatResponse.mockResolvedValue({
      ok: true,
      payload: streamMock,
    });

    const app = express();
    app.use(express.json());
    app.use(
      "/api",
      createChatRouter({ streamChatResponse: streamChatResponse as any })
    );

    const response = await request(app)
      .post("/api/chat")
      .send({
        messages: [
          { role: "system", content: "You are helpful" },
          { role: "user", content: "Hi" },
        ],
      })
      .expect(200);

    expect(response.text).toBe("Hello world");
    expect(response.headers["x-request-id"]).toBeDefined();
    expect(streamChatResponse).toHaveBeenCalledTimes(1);
  });

  it("returns 400 on validation failure", async () => {
    const streamChatResponse = jest.fn();
    const app = express();
    app.use(express.json());
    app.use(
      "/api",
      createChatRouter({ streamChatResponse: streamChatResponse as any })
    );

    const response = await request(app)
      .post("/api/chat")
      .send({ messages: [] })
      .expect(400);

    expect(response.body.error).toMatch(/at least one/i);
    expect(streamChatResponse).not.toHaveBeenCalled();
  });

  it("returns 502 when the service cannot stream", async () => {
    const streamChatResponse = jest.fn() as any;
    streamChatResponse.mockResolvedValue({
      ok: false,
      error: "OpenAI unavailable",
    });

    const app = express();
    app.use(express.json());
    app.use(
      "/api",
      createChatRouter({ streamChatResponse: streamChatResponse as any })
    );

    const response = await request(app)
      .post("/api/chat")
      .send({
        messages: [
          { role: "system", content: "You are helpful" },
          { role: "user", content: "Hi" },
        ],
      })
      .expect(502);

    expect(response.body.error).toBe("OpenAI unavailable");
  });
});
