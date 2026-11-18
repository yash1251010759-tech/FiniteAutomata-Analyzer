interface StructuredError {
  code?: unknown;
  details?: unknown;
  hint?: unknown;
  message?: unknown;
}

export function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error) return error.message;
  if (!error || typeof error !== 'object') return fallback;

  const structuredError = error as StructuredError;
  const message =
    typeof structuredError.message === 'string' ? structuredError.message : '';
  if (!message) return fallback;

  const code = typeof structuredError.code === 'string' ? `[${structuredError.code}]` : '';
  const details =
    typeof structuredError.details === 'string' ? `Details: ${structuredError.details}` : '';
  const hint = typeof structuredError.hint === 'string' ? `Hint: ${structuredError.hint}` : '';
  return [code, message, details, hint].filter(Boolean).join(' ');
}
