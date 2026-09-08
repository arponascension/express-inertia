export interface Logger {
  warn(message: string, meta?: Record<string, any>): void;
  error(message: string, meta?: Record<string, any>): void;
  info(message: string, meta?: Record<string, any>): void;
  debug(message: string, meta?: Record<string, any>): void;
}

export interface LoggerOptions {
  prefix?: string;
  logger?: Logger;
}

const DEFAULT_PREFIX = 'express-inertia';

function createConsoleLogger(prefix: string): Logger {
  const pad = (str: string) => str.padEnd(2, ' ');

  return {
    warn(message: string, meta?: Record<string, any>) {
      const payload = meta ? { ...meta } : undefined;
      if (payload && Object.keys(payload).length > 0) {
        console.warn(`[${prefix}] ${message}`, JSON.stringify(payload));
      } else {
        console.warn(`[${prefix}] ${message}`);
      }
    },

    error(message: string, meta?: Record<string, any>) {
      const payload = meta ? { ...meta } : undefined;
      if (payload && Object.keys(payload).length > 0) {
        console.error(`[${prefix}] ${message}`, JSON.stringify(payload));
      } else {
        console.error(`[${prefix}] ${message}`);
      }
    },

    info(message: string, meta?: Record<string, any>) {
      const payload = meta ? { ...meta } : undefined;
      if (payload && Object.keys(payload).length > 0) {
        console.info(`[${prefix}] ${message}`, JSON.stringify(payload));
      } else {
        console.info(`[${prefix}] ${message}`);
      }
    },

    debug(message: string, meta?: Record<string, any>) {
      const payload = meta ? { ...meta } : undefined;
      if (payload && Object.keys(payload).length > 0) {
        console.debug(`[${prefix}] ${message}`, JSON.stringify(payload));
      } else {
        console.debug(`[${prefix}] ${message}`);
      }
    },
  };
}

let globalLogger: Logger = createConsoleLogger(DEFAULT_PREFIX);

export function setGlobalLogger(logger: Logger): void {
  globalLogger = logger;
}

export function getGlobalLogger(): Logger {
  return globalLogger;
}

export function createLogger(options: LoggerOptions = {}): Logger {
  const prefix = options.prefix || DEFAULT_PREFIX;
  if (options.logger) {
    return options.logger;
  }
  return createConsoleLogger(prefix);
}
