/**
 * Standardized API Response Helpers
 *
 * These helpers provide a consistent response shape for all API endpoints:
 * - `ok(data)` or `ok(data, meta)` for success responses
 * - `fail(message, code, details)` for error responses
 *
 * No `any` types are used — everything is generic and strongly typed.
 * Overloads are used to preserve perfect type inference.
 */

/**
 * Creates a successful API response with optional metadata.
 *
 * @template T The type of the main data payload.
 * @template M The type of the optional metadata object.
 *
 * @param {T} data - The main response payload (e.g., list of users, single resource, etc.)
 * @param {M} [meta] - Optional metadata (e.g., pagination info, totals, etc.)
 * @returns {{ data: T } | { data: T; meta: M }} An object containing the data (and meta if provided).
 *
 * @example
 * // Simple data response
 * return ok({ id: 1, name: 'Alice' });
 * // → { data: { id: 1, name: 'Alice' } }
 *
 * @example
 * // Data with pagination metadata
 * return ok(users, { page: 1, pageSize: 10, total: 25 });
 * // → { data: [...], meta: { page: 1, pageSize: 10, total: 25 } }
 */

/* eslint-disable no-redeclare */
export function ok<T>(data: T): { data: T };
export function ok<T, M extends Record<string, unknown>>(data: T, meta: M): { data: T; meta: M };
export function ok<T, M extends Record<string, unknown>>(data: T, meta?: M) {
  return (meta === undefined ? { data } : { data, meta }) as { data: T } | { data: T; meta: M };
}

/**
 * Creates a standardized API error response.
 *
 * @template C The type of the error code (defaults to string literal 'INTERNAL').
 * @template D The type of the optional details object.
 *
 * @param {string} message - A human-readable error message.
 * @param {C} [code='INTERNAL'] - A machine-readable error code (e.g., 'VALIDATION', 'NOT_FOUND').
 * @param {D} [details] - Optional details or context about the error (e.g., validation errors, fields).
 * @returns {{ error: { message: string; code: C; details?: D } }} A standardized error response object.
 *
 * @example
 * // Simple internal error
 * return fail('Something went wrong');
 * // → { error: { message: 'Something went wrong', code: 'INTERNAL' } }
 *
 * @example
 * // Not found error
 * return fail('User not found', 'NOT_FOUND');
 * // → { error: { message: 'User not found', code: 'NOT_FOUND' } }
 *
 * @example
 * // Validation error with details
 * return fail('Invalid input', 'VALIDATION', { field: 'email' });
 * // → { error: { message: 'Invalid input', code: 'VALIDATION', details: { field: 'email' } } }
 */
export function fail<C extends string = 'INTERNAL', D = unknown>(
  message: string,
  code?: C,
  details?: D,
): {
  error: {
    message: string;
    code: C;
    details?: D;
  };
} {
  return {
    error: {
      message,
      code: (code ?? 'INTERNAL') as C,
      ...(details !== undefined ? { details } : {}),
    },
  };
}
