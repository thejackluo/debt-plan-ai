type LogLevel = "info" | "warn" | "error";

interface LogOptions {
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
}

const serialize = ({ level, message, context }: LogOptions): string =>
  JSON.stringify({
    level,
    message,
    timestamp: new Date().toISOString(),
    ...(context ?? {}),
  });

export const logInfo = (message: string, context?: Record<string, unknown>) => {
  console.log(serialize({ level: "info", message, context }));
};

export const logWarn = (message: string, context?: Record<string, unknown>) => {
  console.warn(serialize({ level: "warn", message, context }));
};

export const logError = (message: string, context?: Record<string, unknown>) => {
  console.error(serialize({ level: "error", message, context }));
};
