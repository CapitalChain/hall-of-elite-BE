/**
 * MT5 module logger.
 * Created to centralize structured logs for MT5 operations.
 */

export enum MT5LogLevel {
  INFO = "INFO",
  WARN = "WARN",
  ERROR = "ERROR",
  DEBUG = "DEBUG",
}

export interface MT5LogEntry {
  timestamp: Date;
  level: MT5LogLevel;
  operation: string;
  message: string;
  metadata?: Record<string, unknown>;
  error?: Error;
}

export class MT5Logger {
  private static formatLogEntry(entry: MT5LogEntry): string {
    const { timestamp, level, operation, message, metadata, error } = entry;
    const timestampStr = timestamp.toISOString();
    const metadataStr = metadata ? ` | Metadata: ${JSON.stringify(metadata)}` : "";
    const errorStr = error ? ` | Error: ${error.message}${error.stack ? `\n${error.stack}` : ""}` : "";

    return `[${timestampStr}] [MT5:${level}] [${operation}] ${message}${metadataStr}${errorStr}`;
  }

  static info(operation: string, message: string, metadata?: Record<string, unknown>): void {
    const entry: MT5LogEntry = {
      timestamp: new Date(),
      level: MT5LogLevel.INFO,
      operation,
      message,
      metadata,
    };
    console.log(this.formatLogEntry(entry));
  }

  static warn(operation: string, message: string, metadata?: Record<string, unknown>): void {
    const entry: MT5LogEntry = {
      timestamp: new Date(),
      level: MT5LogLevel.WARN,
      operation,
      message,
      metadata,
    };
    console.warn(this.formatLogEntry(entry));
  }

  static error(
    operation: string,
    message: string,
    error?: Error,
    metadata?: Record<string, unknown>
  ): void {
    const entry: MT5LogEntry = {
      timestamp: new Date(),
      level: MT5LogLevel.ERROR,
      operation,
      message,
      error,
      metadata,
    };
    console.error(this.formatLogEntry(entry));
  }

  static debug(operation: string, message: string, metadata?: Record<string, unknown>): void {
    if (process.env.NODE_ENV === "development") {
      const entry: MT5LogEntry = {
        timestamp: new Date(),
        level: MT5LogLevel.DEBUG,
        operation,
        message,
        metadata,
      };
      console.debug(this.formatLogEntry(entry));
    }
  }
}
