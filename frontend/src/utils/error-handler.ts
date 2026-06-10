import { ApiError } from '@/types';

/**
 * Handle API errors and return user-friendly message
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    // Handle ApiError
    if ('code' in error && 'message' in error) {
      const apiError = error as unknown as ApiError;
      return getApiErrorMessage(apiError.code);
    }
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  return 'An unexpected error occurred. Please try again.';
}

/**
 * Get user-friendly message for API error codes
 */
function getApiErrorMessage(code: string): string {
  const messages: Record<string, string> = {
    // Auth errors
    UNAUTHORIZED: 'Please connect your wallet to continue',
    FORBIDDEN: 'You do not have permission to perform this action',

    // Validation errors
    INVALID_INPUT: 'Please check your input and try again',
    INVALID_ADDRESS: 'Invalid Ethereum address',
    INVALID_AMOUNT: 'Please enter a valid amount',

    // Agent errors
    AGENT_NOT_FOUND: 'Agent not found',
    AGENT_ALREADY_EXISTS: 'An agent with this name already exists',
    INSUFFICIENT_BALANCE: 'Insufficient balance for this transaction',

    // Trade errors
    TRADE_FAILED: 'Trade execution failed. Please try again',
    INSUFFICIENT_LIQUIDITY: 'Insufficient liquidity for this trade',
    SLIPPAGE_EXCEEDED: 'Price slippage exceeded tolerance',

    // Governance errors
    ALREADY_VOTED: 'You have already voted on this proposal',
    VOTING_CLOSED: 'Voting period has ended for this proposal',
    INSUFFICIENT_VOTING_POWER: 'Insufficient voting power',

    // Server errors
    INTERNAL_ERROR: 'Server error. Please try again later',
    SERVICE_UNAVAILABLE: 'Service is temporarily unavailable',

    // Network errors
    NETWORK_ERROR: 'Network error. Please check your connection',
    TIMEOUT: 'Request timeout. Please try again',

    // Default
    UNKNOWN_ERROR: 'An error occurred. Please try again',
  };

  return messages[code] || messages.UNKNOWN_ERROR;
}

/**
 * Retry logic for failed requests
 */
export async function retryAsync<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  delay = 1000
): Promise<T> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxRetries - 1) {
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, delay * Math.pow(2, attempt)));
    }
  }
  throw new Error('Max retries exceeded');
}

/**
 * Parse blockchain error messages
 */
export function parseBlockchainError(error: any): string {
  if (!error) return 'Unknown blockchain error';

  // Handle common Web3 errors
  if (error.code === 4001) {
    return 'Transaction was rejected by user';
  }

  if (error.code === -32603) {
    return 'Blockchain RPC error. Please try again';
  }

  if (error.message?.includes('insufficient funds')) {
    return 'Insufficient funds for gas fees';
  }

  if (error.message?.includes('nonce')) {
    return 'Transaction nonce error. Please refresh and try again';
  }

  return error.message || 'Blockchain transaction failed';
}

/**
 * Create error boundary compatible error object
 */
export class ClientError extends Error {
  code: string;
  statusCode: number;

  constructor(message: string, code = 'CLIENT_ERROR', statusCode = 400) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.name = 'ClientError';
  }
}

export class ValidationError extends ClientError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR', 422);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends ClientError {
  constructor(message = 'Resource not found') {
    super(message, 'NOT_FOUND', 404);
    this.name = 'NotFoundError';
  }
}

export class UnauthorizedError extends ClientError {
  constructor(message = 'Unauthorized') {
    super(message, 'UNAUTHORIZED', 401);
    this.name = 'UnauthorizedError';
  }
}

export class NetworkError extends ClientError {
  constructor(message = 'Network error') {
    super(message, 'NETWORK_ERROR', 503);
    this.name = 'NetworkError';
  }
}
