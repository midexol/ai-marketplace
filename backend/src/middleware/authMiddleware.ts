import { Request, Response, NextFunction } from 'express';
import { AppError } from './errorHandler';

declare global {
  namespace Express {
    interface Request {
      userAddress?: string;
      userId?: string;
    }
  }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return next(new AppError('Missing authorization header', 401, 'AUTH_REQUIRED'));
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
    return next(new AppError('Invalid authorization header format', 401, 'INVALID_AUTH_FORMAT'));
  }

  const token = parts[1];

  try {
    // The frontend sends a plain base64-encoded JSON blob:
    //   btoa(JSON.stringify({ sub, wallet: { address } }))
    // Also tolerate a 3-part JWT by decoding its payload segment.
    const segment = token.includes('.') ? token.split('.')[1] : token;
    const decoded = JSON.parse(Buffer.from(segment, 'base64').toString('utf-8'));

    const address = decoded?.wallet?.address;
    if (!decoded?.sub || !address) {
      return next(new AppError('Invalid token format', 401, 'INVALID_TOKEN'));
    }

    req.userId = decoded.sub;
    req.userAddress = String(address).toLowerCase();

    next();
  } catch (error) {
    next(new AppError('Invalid authentication token', 401, 'AUTH_INVALID'));
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.userAddress || !req.userId) {
    return next(new AppError('Authentication required', 401, 'AUTH_REQUIRED'));
  }
  next();
}

export function authorizeUser(paramName: string = 'userAddress') {
  return (req: Request, res: Response, next: NextFunction) => {
    const paramValue = req.params[paramName]?.toLowerCase();

    if (!req.userAddress) {
      return next(new AppError('Authentication required', 401, 'AUTH_REQUIRED'));
    }

    if (paramValue && paramValue !== req.userAddress) {
      return next(new AppError('Unauthorized: cannot access other users data', 403, 'FORBIDDEN'));
    }

    next();
  };
}
