import { Request, Response, NextFunction } from 'express';
import { logger } from '@/utils/logger';
import { ApiResponse } from '@/types';
import { env } from '@/config/env';

export class AppError extends Error {
  constructor(
    public message: string,
    public status: number,
    public code: string = 'INTERNAL_ERROR'
  ) {
    super(message);
    Error.captureStackTrace(this, this.constructor);
  }
}

export function errorHandler(
  err: Error | AppError,
  req: Request,
  res: Response<ApiResponse<null>>,
  next: NextFunction
) {
  const error = err instanceof AppError ? err : new AppError(err.message, 500);

  const isDev = env.NODE_ENV === 'development';

  logger.error(error.message, {
    status: error.status,
    code: error.code,
    ...(isDev && { stack: error.stack }),
    path: req.path,
    method: req.method,
  });

  res.status(error.status).json({
    success: false,
    error: error.message,
    code: error.code,
  });
}
