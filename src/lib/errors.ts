// Las Cloud Functions de HaNet ya responden en español; "internal" no trae
// mensaje útil. Igual que describeAuthError en la app.
export function describeError(error: unknown, fallback: string) {
  const code = typeof error === 'object' && error !== null && 'code' in error ? String(error.code) : ''
  if (code === 'functions/unavailable' || code === 'auth/network-request-failed') {
    return 'No pudimos conectarnos. Revisa tu conexión a internet.'
  }
  if (code.startsWith('functions/') && code !== 'functions/internal' && error instanceof Error && error.message) {
    return error.message
  }
  return fallback
}
