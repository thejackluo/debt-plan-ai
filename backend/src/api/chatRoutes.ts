import { randomUUID } from "node:crypto";

import type { Request, Response } from "express";
import { Router } from "express";

import { streamChatResponse } from "../services/chatService.js";
import { validateChatRequest } from "../validation/chatValidation.js";
import { logError, logInfo, logWarn } from "../utils/logger.js";

interface ChatRouteDependencies {
  streamChatResponse: typeof streamChatResponse;
}

const createDefaultDependencies = (): ChatRouteDependencies => ({
  streamChatResponse,
});

const createAbortController = (req: Request) => {
  const controller = new AbortController();
  req.on("close", () => controller.abort());
  return controller;
};

const extractRequestId = (req: Request): string => {
  const headerId = req.header("x-request-id");
  return headerId && headerId.trim().length > 0 ? headerId : randomUUID();
};

export const createChatRouter = (
  deps: ChatRouteDependencies = createDefaultDependencies()
) => {
  const router = Router();

  router.post("/chat", async (req: Request, res: Response) => {
    const requestId = extractRequestId(req);
    const validation = validateChatRequest(req.body);

    if (!validation.ok || !validation.payload) {
      const message = validation.error ?? "Invalid payload";
    logWarn("Rejected chat request due to validation error", {
      requestId,
      error: message,
    });

    res.status(400).json({ error: message, requestId });
    return;
  }

    const abortController = createAbortController(req);

    try {
      const streamResult = await deps.streamChatResponse({
        messages: validation.payload.messages,
        requestId,
        abortSignal: abortController.signal,
      });

    if (!streamResult.ok || !streamResult.payload) {
      const error = streamResult.error ?? "Unable to stream response";
      logError("Failed to obtain OpenAI stream", { requestId, error });
      res.status(502).json({ error, requestId });
      return;
    }

    logInfo("Streaming OpenAI response to client", { requestId });

      streamResult.payload.pipeTextStreamToResponse(res, {
        status: 200,
        headers: {
          "Cache-Control": "no-cache",
          "X-Request-Id": requestId,
        },
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unexpected server error";
      logError("Unexpected error while handling chat request", {
        requestId,
        error: message,
      });
      res.status(500).json({ error: message, requestId });
    }
  });

  return router;
};

export const chatRouter = createChatRouter();
