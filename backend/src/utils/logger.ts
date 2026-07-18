import { createLogger, format, transports, Logger } from 'winston';
import fs from 'fs';
import path from 'path';
import { NODE_ENV } from '@/config/constants';

const logsDir = path.join(__dirname, '../logs');
try {
  fs.mkdirSync(logsDir, { recursive: true });
} catch {
  // ignore — console transport still works
}

// Custom level filter
const levelFilter = (level: string) =>
  format((info) => {
    return info.level === level ? info : false;
  })();

// Stack trace location helper
const extractLocation = (stack: string | undefined): string => {
  if (!stack) return 'unknown';
  const match = stack.split('\n')[1]?.match(/\((.*):(\d+):(\d+)\)/) ||
                stack.split('\n')[1]?.match(/at (.*):(\d+):(\d+)/);
  if (match) {
    const filePath = match[1];
    const line = match[2];
    return `[${path.relative(process.cwd(), filePath)}:${line}]`;
  }
  return '[unknown]';
};

const logFormat = format.printf((info) => {
  const base = `[${info.timestamp}] ${info.level.toUpperCase()} -`;

  const splatSymbol = Symbol.for('splat');
  const splat = info[splatSymbol];
  const splatData = splat ? ` ${JSON.stringify(splat)}` : '';

  if (info.stack && info.level === 'error') {
    const location = extractLocation(typeof info.stack === 'string' ? info.stack : undefined);
    return `${base} ${location} ${info.message}`;
  } else if (info.level === 'info') {
    return `${base} ${info.message}${splatData}`;
  }

  return `${base} ${info.message}`;
});

const logger: Logger = createLogger({
  format: format.combine(
    format.errors({ stack: true }),
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    logFormat
  ),
  transports: [
    // Always log to console so PM2 / nginx debugging can see startup failures
    new transports.Console({
      level: NODE_ENV === 'development' ? 'debug' : 'info',
    }),

    new transports.File({
      filename: path.join(logsDir, 'info.log'),
      format: format.combine(levelFilter('info')),
    }),

    new transports.File({
      filename: path.join(logsDir, 'warn.log'),
      format: format.combine(levelFilter('warn')),
    }),

    new transports.File({
      filename: path.join(logsDir, 'error.log'),
      format: format.combine(levelFilter('error')),
    }),
  ],
});

export default logger;
