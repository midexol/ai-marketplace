import { Request, Response, NextFunction } from 'express';
import { AppError } from './errorHandler';

interface RateLimitStore {
  [key: string]: { count: number; resetTime: number };
}

const store: RateLimitStore = {};

export function rateLimiter(windowMs: number = 60000, maxRequests: number = 100) {
  return (req: Request, res: Response, next: NextFunction) => {
    const key = req.ip || 'unknown';
    const now = Date.now();

    if (!store[key]) {
      store[key] = { count: 1, resetTime: now + windowMs };
      return next();
    }

    const record = store[key];

    if (now > record.resetTime) {
      record.count = 1;
      record.resetTime = now + windowMs;
      return next();
    }

    record.count++;

    if (record.count > maxRequests) {
      res.set('Retry-After', String(Math.ceil((record.resetTime - now) / 1000)));
      return next(new AppError('Too many requests, please try again later', 429, 'RATE_LIMIT_EXCEEDED'));
    }

    next();
  };
}

export function createRateLimiter(name: string, windowMs: number = 60000, maxRequests: number = 100) {
  const limitStore: RateLimitStore = {};

  return (req: Request, res: Response, next: NextFunction) => {
    const key = `${name}:${req.ip || 'unknown'}`;
    const now = Date.now();

    if (!limitStore[key]) {
      limitStore[key] = { count: 1, resetTime: now + windowMs };
      return next();
    }

    const record = limitStore[key];

    if (now > record.resetTime) {
      record.count = 1;
      record.resetTime = now + windowMs;
      return next();
    }

    record.count++;

    if (record.count > maxRequests) {
      res.set('Retry-After', String(Math.ceil((record.resetTime - now) / 1000)));
      return next(new AppError(`Rate limit exceeded for ${name}`, 429, 'RATE_LIMIT_EXCEEDED'));
    }

    next();
  };
}
