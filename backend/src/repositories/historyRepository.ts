import { constants } from "node:fs";
import { access, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import type { ChatMessage } from "../types/chat.types.js";

const DEFAULT_HISTORY_PATH = process.env.HISTORY_FILE_PATH
  ? path.resolve(process.env.HISTORY_FILE_PATH)
  : path.resolve(process.cwd(), "data/history.json");

const ensureHistoryFileExists = async (filePath: string) => {
  try {
    await access(filePath, constants.F_OK);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      await writeFile(filePath, "[]\n", "utf-8");
      return;
    }

    throw error;
  }
};

const validRoles = new Set<ChatMessage["role"]>(["assistant", "user", "system"]);

const isChatMessageArray = (value: unknown): value is ChatMessage[] =>
  Array.isArray(value) &&
  value.every((item) => {
    if (!item || typeof item !== "object") {
      return false;
    }

    const role = Reflect.get(item, "role");
    const content = Reflect.get(item, "content");

    return typeof role === "string" && validRoles.has(role as ChatMessage["role"]) && typeof content === "string";
  });

export interface HistoryRepository {
  read: () => Promise<ChatMessage[]>;
  write: (transcript: ChatMessage[]) => Promise<void>;
  clear: () => Promise<void>;
}

export const createHistoryRepository = (
  filePath: string = DEFAULT_HISTORY_PATH
): HistoryRepository => {
  const read = async (): Promise<ChatMessage[]> => {
    await ensureHistoryFileExists(filePath);

    const raw = await readFile(filePath, "utf-8");

    if (!raw.trim()) {
      return [];
    }

    try {
      const parsed = JSON.parse(raw);

      if (!isChatMessageArray(parsed)) {
        throw new Error("History file is not a valid chat transcript");
      }

      return parsed;
    } catch (error) {
      throw new Error("Failed to parse history file", { cause: error });
    }
  };

  const write = async (transcript: ChatMessage[]): Promise<void> => {
    await writeFile(filePath, `${JSON.stringify(transcript, null, 2)}\n`, "utf-8");
  };

  const clear = async (): Promise<void> => {
    await writeFile(filePath, "[]\n", "utf-8");
  };

  return { read, write, clear };
};

export const historyRepository = createHistoryRepository();
