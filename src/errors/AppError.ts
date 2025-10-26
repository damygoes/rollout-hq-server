import { HTTP_STATUS, type ErrorCode } from './errorCodes';

export class AppError extends Error {
  code: ErrorCode;
  status: number;
  details?: unknown;

  constructor(code: ErrorCode, message: string, details?: unknown, status?: number) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.status = status ?? HTTP_STATUS[code];
    this.details = details;
    Error.captureStackTrace?.(this, AppError);
  }

  static validation(message: string, details?: unknown) {
    return new AppError('VALIDATION', message, details);
  }
  static unauth(message = 'Unauthorized') {
    return new AppError('UNAUTH', message);
  }
  static forbidden(message = 'Forbidden') {
    return new AppError('FORBIDDEN', message);
  }
  static notFound(message = 'Not found') {
    return new AppError('NOT_FOUND', message);
  }
  static conflict(message = 'Conflict', details?: unknown) {
    return new AppError('CONFLICT', message, details);
  }
  static rateLimited(message = 'Too many requests') {
    return new AppError('RATE_LIMITED', message);
  }
  static internal(message = 'Internal server error', details?: unknown) {
    return new AppError('INTERNAL', message, details);
  }
}
