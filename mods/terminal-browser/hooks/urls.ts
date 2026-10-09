export function normalizeUrl(raw: string): string {
  const text = raw.trim()
  if (/^[a-z][a-z0-9+.-]*:/i.test(text)) return text
  if (/^localhost(:\d+)?(\/|$)/.test(text) || /^\d+\.\d+\.\d+\.\d+/.test(text)) return `http://${text}`
  return `https://${text}`
}
