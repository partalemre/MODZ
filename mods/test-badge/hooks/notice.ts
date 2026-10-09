// A notice whose timer was lost (a hot reload drops timers) must not hold the line forever.
export function isLive(notice: unknown, nowMs: number): boolean {
  if (notice === undefined || notice === null) return false
  const expiresAt = (notice as { expiresAt?: unknown }).expiresAt

  return typeof expiresAt !== 'number' || expiresAt <= 0 || expiresAt > nowMs
}
