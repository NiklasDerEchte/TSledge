import { Request, Response, NextFunction } from 'express';
import { getCurrentDateString } from '../utils';

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  res.on('finish', () => {
    const now = new Date().toISOString();
    let emoji = '';
    if (res.statusCode >= 100 && res.statusCode < 200) emoji = '💡';
    else if (res.statusCode >= 200 && res.statusCode < 300) emoji = '✅';
    else if (res.statusCode >= 300 && res.statusCode < 400) emoji = '🚦';
    else if (res.statusCode == 401) emoji = '🔁';
    else if (res.statusCode >= 400 && res.statusCode < 500) emoji = '⚠️';
    else if (res.statusCode >= 500) emoji = '🔥';

    console.log(`${emoji} [${now}] ${req.method} ${req.originalUrl} - ${res.statusCode}`);
  });
  next();
}

export function errorLogger(err: any, req: any, res: any, next: NextFunction) {
  console.error(`🛑 [${getCurrentDateString()}] Error in ${req.method} ${req.originalUrl}:`, err);
  res.status(500).json();
}