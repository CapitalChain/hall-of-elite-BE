type LogLevel = "info" | "warn" | "error";

interface LogContext {
  [key: string]: unknown;
}

const toIso = (): string => new Date().toISOString();

const sanitizeContext = (context?: LogContext): LogContext | undefined => {
  if (!context) {
    return undefined;
  }
  const sanitized: LogContext = {};
  for (const [key, value] of Object.entries(context)) {
    if (value === undefined) {
      continue;
    }
    sanitized[key] = value;
  }
  return Object.keys(sanitized).length > 0 ? sanitized : undefined;
};

const log = (level: LogLevel, scope: string, message: string, context?: LogContext) => {
  const payload = {
    timestamp: toIso(),
    scope,
    message,
    ...sanitizeContext(context),
  };

  if (level === "error") {
    console.error(payload);
    return;
  }

  if (level === "warn") {
    console.warn(payload);
    return;
  }

  console.log(payload);
};

export const PersistenceLogger = {
  info: (scope: string, message: string, context?: LogContext) =>
    log("info", scope, message, context),
  warn: (scope: string, message: string, context?: LogContext) =>
    log("warn", scope, message, context),
  error: (scope: string, message: string, error?: Error, context?: LogContext) =>
    log("error", scope, message, {
      error: error ? { name: error.name, message: error.message } : undefined,
      ...context,
    }),
};
