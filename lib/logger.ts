/**
 * Logger centralisé pour Kama-Délices
 * Logs les erreurs et événements importants
 */

enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  service: string;
  message: string;
  data?: any;
  error?: string;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';

  log(level: LogLevel, service: string, message: string, data?: any) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      service,
      message,
      data,
    };

    // Format de sortie
    const prefix = `[${entry.timestamp}] [${entry.level}] [${entry.service}]`;

    if (this.isDevelopment || level === LogLevel.ERROR) {
      switch (level) {
        case LogLevel.DEBUG:
          console.debug(prefix, message, data || '');
          break;
        case LogLevel.INFO:
          console.log(prefix, message, data || '');
          break;
        case LogLevel.WARN:
          console.warn(prefix, message, data || '');
          break;
        case LogLevel.ERROR:
          console.error(prefix, message, data || '');
          break;
      }
    }

    // TODO: Envoyer les logs ERROR à un service externe (Sentry, LogRocket, etc.)
  }

  debug(service: string, message: string, data?: any) {
    this.log(LogLevel.DEBUG, service, message, data);
  }

  info(service: string, message: string, data?: any) {
    this.log(LogLevel.INFO, service, message, data);
  }

  warn(service: string, message: string, data?: any) {
    this.log(LogLevel.WARN, service, message, data);
  }

  error(service: string, message: string, error?: any) {
    this.log(LogLevel.ERROR, service, message, {
      error: error?.message || String(error),
      stack: error?.stack,
    });
  }
}

export const logger = new Logger();
