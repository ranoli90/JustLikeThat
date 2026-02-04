interface LogEntry {
  timestamp: Date;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  data?: unknown;
}

const logs: LogEntry[] = [];

export const logger = {
  debug: (message: string, data?: unknown) => {
    console.debug(message, data);
    logs.push({ timestamp: new Date(), level: 'debug', message, data });
  },
  
  info: (message: string, data?: unknown) => {
    console.info(message, data);
    logs.push({ timestamp: new Date(), level: 'info', message, data });
  },
  
  warn: (message: string, data?: unknown) => {
    console.warn(message, data);
    logs.push({ timestamp: new Date(), level: 'warn', message, data });
  },
  
  error: (message: string, data?: unknown) => {
    console.error(message, data);
    logs.push({ timestamp: new Date(), level: 'error', message, data });
  },
  
  getLogs: (): LogEntry[] => logs.slice(-100),
};
