import { describe, expect, it } from "@jest/globals";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { createHistoryRepository } from "../src/repositories/historyRepository.js";
import type { ChatMessage } from "../src/types/chat.types.js";

const createTempRepo = async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "history-test-"));
  const filePath = path.join(dir, "history.json");
  return { dir, filePath, repository: createHistoryRepository(filePath) } as const;
};

describe("historyRepository", () => {
  const sampleTranscript: ChatMessage[] = [
    { role: "assistant", content: "Hello" },
    { role: "user", content: "I need help" },
  ];

  it("returns an empty transcript when the file is missing", async () => {
    const { dir, filePath, repository } = await createTempRepo();

    try {
      const transcript = await repository.read();

      expect(transcript).toEqual([]);

      const raw = await readFile(filePath, "utf-8");
      expect(raw.trim()).toBe("[]");
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("persists a transcript to disk and reads it back", async () => {
    const { dir, repository } = await createTempRepo();

    try {
      await repository.write(sampleTranscript);

      const transcript = await repository.read();

      expect(transcript).toEqual(sampleTranscript);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("clears the transcript by writing an empty array", async () => {
    const { dir, repository } = await createTempRepo();

    try {
      await repository.write(sampleTranscript);
      await repository.clear();

      const transcript = await repository.read();

      expect(transcript).toEqual([]);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("throws when the history file contains invalid JSON", async () => {
    const { dir, filePath, repository } = await createTempRepo();

    try {
      await writeFile(filePath, "not json", "utf-8");

      await expect(repository.read()).rejects.toThrow("Failed to parse history file");
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});
