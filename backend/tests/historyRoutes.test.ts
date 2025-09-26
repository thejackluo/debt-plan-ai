import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import type { RequestHandler, Response } from "express";

import { createHistoryRouter } from "../src/api/historyRoutes.js";
import { createHistoryRepository } from "../src/repositories/historyRepository.js";
import type { ChatMessage } from "../src/types/chat.types.js";

const sampleTranscript: ChatMessage[] = [
  { role: "assistant", content: "Welcome" },
  { role: "user", content: "Hi" },
];

interface MockResponse extends Response {
  statusCode: number;
  body: unknown;
}

const getRouteHandler = (router: ReturnType<typeof createHistoryRouter>, method: "get" | "post" | "delete") => {
  const layer = router.stack.find((candidate: any) => candidate.route?.path === "/" && candidate.route?.methods?.[method]);

  if (!layer?.route?.stack?.length) {
    throw new Error(`Route handler missing for ${method.toUpperCase()} /`);
  }

  return layer.route.stack[0].handle as RequestHandler;
};

const createMockResponse = (): MockResponse => {
  let status = 200;
  let payload: unknown;

  const res = {
    status(code: number) {
      status = code;
      return this;
    },
    json(data: unknown) {
      payload = data;
      return this;
    },
    send(data?: unknown) {
      payload = data;
      return this;
    },
  } as unknown as MockResponse;

  Object.defineProperty(res, "statusCode", {
    get: () => status,
  });

  Object.defineProperty(res, "body", {
    get: () => payload,
    set: (value) => {
      payload = value;
    },
  });

  return res;
};

const invokeHandler = async (
  handler: RequestHandler,
  options: { body?: unknown } = {}
) => {
  const req = { body: options.body ?? {} } as any;
  const res = createMockResponse();
  await handler(req, res, jest.fn());
  return res;
};

describe("/api/history", () => {
  let tempDir: string;
  let historyPath: string;
  let router: ReturnType<typeof createHistoryRouter>;
  let postHandler: RequestHandler;
  let getHandler: RequestHandler;
  let deleteHandler: RequestHandler;

  beforeEach(async () => {
    tempDir = await mkdtemp(path.join(os.tmpdir(), "history-router-"));
    historyPath = path.join(tempDir, "history.json");
    router = createHistoryRouter({ repository: createHistoryRepository(historyPath) });
    postHandler = getRouteHandler(router, "post");
    getHandler = getRouteHandler(router, "get");
    deleteHandler = getRouteHandler(router, "delete");
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  it("returns the stored transcript", async () => {
    await invokeHandler(postHandler, { body: { messages: sampleTranscript } });

    const response = await invokeHandler(getHandler);

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({ messages: sampleTranscript });
  });

  it("validates the payload before persisting", async () => {
    const response = await invokeHandler(postHandler, {
      body: { messages: [{ role: "assistant", content: "" }] },
    });

    expect(response.statusCode).toBe(400);
  });

  it("clears the transcript on DELETE", async () => {
    await invokeHandler(postHandler, { body: { messages: sampleTranscript } });

    const response = await invokeHandler(deleteHandler);

    expect(response.statusCode).toBe(204);

    const raw = await readFile(historyPath, "utf-8");
    expect(raw.trim()).toBe("[]");
  });
});
