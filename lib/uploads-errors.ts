type StatusError = Error & { status?: number };

export function withStatus(error: Error, status: number): StatusError {
  const next = error as StatusError;
  next.status = status;
  return next;
}

export function readStatus(error: unknown): number | null {
  if (!error || typeof error !== 'object') return null;
  const status = (error as { status?: unknown }).status;
  return typeof status === 'number' ? status : null;
}
