type LogLevel = 'debug' | 'info' | 'warn' | 'error';

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  private logCounts = new Map<string, number>();
  private lastLogTimes = new Map<string, number>();
  private readonly THROTTLE_MS = 2000; // 2 seconds
  private readonly MAX_DUPLICATES = 3;
  
  private formatTimestamp(): string {
    return new Date().toISOString().split('T')[1].split('.')[0];
  }

  private getEmoji(level: LogLevel): string {
    const emojis = {
      debug: '🔍',
      info: '✅',
      warn: '⚠️',
      error: '❌'
    };
    return emojis[level];
  }

  private shouldLog(level: LogLevel, message: string, context?: string): boolean {
    // Always log errors and warnings
    if (level === 'error' || level === 'warn') return true;
    
    // Don't log debug messages unless explicitly enabled
    if (level === 'debug' && !process.env.DEBUG) return false;
    
    // Create a unique key for this log message
    const key = `${context || 'global'}:${message}`;
    const now = Date.now();
    const lastTime = this.lastLogTimes.get(key) || 0;
    const count = this.logCounts.get(key) || 0;
    
    // If it's been long enough since last log, reset counter
    if (now - lastTime > this.THROTTLE_MS) {
      this.logCounts.set(key, 1);
      this.lastLogTimes.set(key, now);
      return true;
    }
    
    // If we've logged this too many times recently, skip it
    if (count >= this.MAX_DUPLICATES) {
      return false;
    }
    
    // Increment counter and log
    this.logCounts.set(key, count + 1);
    this.lastLogTimes.set(key, now);
    return true;
  }

  private log(level: LogLevel, message: string, context?: string, data?: unknown): void {
    // Only log errors and warnings in development
    if (level !== 'error' && level !== 'warn') return;
    
    if (!this.isDevelopment) return;

    const timestamp = this.formatTimestamp();
    const emoji = this.getEmoji(level);
    const contextStr = context ? `[${context}]` : '';
    
    const logMessage = `${emoji} ${timestamp} ${contextStr} ${message}`;
    
    // Use appropriate console method
    const consoleMethods = {
      debug: console.debug,
      info: console.info,
      warn: console.warn,
      error: console.error
    };
    
    if (data) {
      consoleMethods[level](logMessage, data);
    } else {
      consoleMethods[level](logMessage);
    }
  }

  debug(message: string, context?: string, data?: unknown): void {
    this.log('debug', message, context, data);
  }

  info(message: string, context?: string, data?: unknown): void {
    this.log('info', message, context, data);
  }

  warn(message: string, context?: string, data?: unknown): void {
    this.log('warn', message, context, data);
  }

  error(message: string, context?: string, data?: unknown): void {
    this.log('error', message, context, data);
  }

  // Specialized methods for common use cases
  api(message: string, data?: unknown): void {
    this.info(message, 'API', data);
  }

  db(message: string, data?: unknown): void {
    this.info(message, 'DATABASE', data);
  }

  ui(message: string, data?: unknown): void {
    this.info(message, 'UI', data);
  }

  conversation(message: string, data?: unknown): void {
    this.info(message, 'CONVERSATION', data);
  }
}

export const logger = new Logger();