import { Router } from "express";
import { z } from "zod";

import { historyRepository } from "../repositories/historyRepository.js";
import type { ChatTranscript } from "../types/chat.types.js";
import { logError } from "../utils/logger.js";

const messageSchema = z.object({
  role: z.enum(["assistant", "user", "system"]),
  content: z.string().min(1),
});

const transcriptSchema = z.object({
  messages: z.array(messageSchema),
});

const router = Router();

router.get("/", async (_req, res) => {
  try {
    const history = await historyRepository.read();
    res.status(200).json({ messages: history });
  } catch (error) {
    logError("Failed to read chat history", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    res.status(500).json({ message: "Unable to load chat history" });
  }
});

router.post("/", async (req, res) => {
  const parseResult = transcriptSchema.safeParse(req.body);

  if (!parseResult.success) {
    res.status(400).json({
      message: "Invalid chat transcript",
      issues: parseResult.error.issues,
    });
    return;
  }

  try {
    await historyRepository.write(parseResult.data.messages as ChatTranscript);
    res.status(204).send();
  } catch (error) {
    logError("Failed to persist chat history", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    res.status(500).json({ message: "Unable to save chat history" });
  }
});

router.delete("/", async (_req, res) => {
  try {
    await historyRepository.clear();
    res.status(204).send();
  } catch (error) {
    logError("Failed to clear chat history", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    res.status(500).json({ message: "Unable to delete chat history" });
  }
});

export default router;
