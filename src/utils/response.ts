export function ok<T>(data: T) {
  return { data, error: null as null };
}
export function fail(message: string, code?: string, details?: unknown) {
  return { data: null as null, error: { message, code, details } };
}
