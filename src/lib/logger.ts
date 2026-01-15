/**
 * Production-ready logging utility using Winston
 * Replaces console.log statements with proper log levels and sanitization
 */

import winston from "winston";

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define colors for each level
const colors = {
  error: "red",
  warn: "yellow",
  info: "green",
  http: "magenta",
  debug: "blue",
};

winston.addColors(colors);

// Define log format
const format = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss:ms" }),
  winston.format.colorize({ all: true }),
  winston.format.printf((info) => `${info.timestamp} ${info.level}: ${info.message}`)
);

// Check if we're in a serverless environment (Vercel, AWS Lambda, etc.)
// These environments have read-only filesystems
const isServerless =
  process.env.VERCEL === "1" ||
  process.env.AWS_LAMBDA_FUNCTION_NAME ||
  process.env.NETLIFY === "true";

// Define transports
const transports = [
  // Console transport for all environments
  new winston.transports.Console(),

  // File transports for production (but NOT on serverless platforms)
  ...(process.env.NODE_ENV === "production" && !isServerless
    ? [
        new winston.transports.File({
          filename: "logs/error.log",
          level: "error",
        }),
        new winston.transports.File({ filename: "logs/all.log" }),
      ]
    : []),
];

// Create the logger
const logger = winston.createLogger({
  level: process.env.NODE_ENV === "production" ? "info" : "debug",
  levels,
  format,
  transports,
});

// Helper function to sanitize sensitive data
function sanitize(data: unknown): unknown {
  if (!data) return data;

  const sensitiveKeys = ["password", "token", "secret", "apiKey", "authorization"];

  if (typeof data === "object" && data !== null) {
    const sanitized: Record<string, unknown> = { ...(data as Record<string, unknown>) };
    for (const key in sanitized) {
      if (sensitiveKeys.some((k) => key.toLowerCase().includes(k))) {
        sanitized[key] = "[REDACTED]";
      } else if (typeof sanitized[key] === "object") {
        sanitized[key] = sanitize(sanitized[key]);
      }
    }
    return sanitized;
  }

  return data;
}

// Export logger with sanitization
export const log = {
  error: (message: string, meta?: unknown) => {
    logger.error(message, sanitize(meta));
  },
  warn: (message: string, meta?: unknown) => {
    logger.warn(message, sanitize(meta));
  },
  info: (message: string, meta?: unknown) => {
    logger.info(message, sanitize(meta));
  },
  http: (message: string, meta?: unknown) => {
    logger.http(message, sanitize(meta));
  },
  debug: (message: string, meta?: unknown) => {
    logger.debug(message, sanitize(meta));
  },
};

export default log;
