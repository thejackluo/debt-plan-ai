import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import type { Express } from "express";
import request from "supertest";

import type { ChatMessage } from "../src/types/chat.types.js";

const sampleTranscript: ChatMessage[] = [
  { role: "assistant", content: "Welcome" },
  { role: "user", content: "Hi" },
];

describe("/api/history", () => {
  const originalHistoryPath = process.env.HISTORY_FILE_PATH;
  let tempDir: string;
  let historyPath: string;
  let app: Express;

  beforeEach(async () => {
    jest.resetModules();
    tempDir = await mkdtemp(path.join(os.tmpdir(), "history-router-"));
    historyPath = path.join(tempDir, "history.json");
    process.env.HISTORY_FILE_PATH = historyPath;
    ({ default: app } = await import("../src/app.js"));
  });

  afterEach(async () => {
    if (originalHistoryPath) {
      process.env.HISTORY_FILE_PATH = originalHistoryPath;
    } else {
      delete process.env.HISTORY_FILE_PATH;
    }

    await rm(tempDir, { recursive: true, force: true });
  });

  it("returns the stored transcript", async () => {
    await request(app).post("/api/history").send({ messages: sampleTranscript }).expect(204);

    const response = await request(app).get("/api/history").expect(200);

    expect(response.body).toEqual({ messages: sampleTranscript });
  });

  it("validates the payload before persisting", async () => {
    await request(app)
      .post("/api/history")
      .send({ messages: [{ role: "assistant", content: "" }] })
      .expect(400);
  });

  it("clears the transcript on DELETE", async () => {
    await request(app).post("/api/history").send({ messages: sampleTranscript }).expect(204);

    await request(app).delete("/api/history").expect(204);

    const raw = await readFile(historyPath, "utf-8");
    expect(raw.trim()).toBe("[]");
  });
});
