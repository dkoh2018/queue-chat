type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: string;
  data?: any;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  
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

  private log(level: LogLevel, message: string, context?: string, data?: any): void {
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

  debug(message: string, context?: string, data?: any): void {
    this.log('debug', message, context, data);
  }

  info(message: string, context?: string, data?: any): void {
    this.log('info', message, context, data);
  }

  warn(message: string, context?: string, data?: any): void {
    this.log('warn', message, context, data);
  }

  error(message: string, context?: string, data?: any): void {
    this.log('error', message, context, data);
  }

  // Specialized methods for common use cases
  api(message: string, data?: any): void {
    this.info(message, 'API', data);
  }

  db(message: string, data?: any): void {
    this.info(message, 'DATABASE', data);
  }

  ui(message: string, data?: any): void {
    this.info(message, 'UI', data);
  }

  conversation(message: string, data?: any): void {
    this.info(message, 'CONVERSATION', data);
  }
}

export const logger = new Logger();