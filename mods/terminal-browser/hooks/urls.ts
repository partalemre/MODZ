// What /browser and the agent's tool accept: a full URL, or an address as typed. A port after a host
// ("localhost:3000", "example.com:8080") is not a scheme, so only `scheme://` and a few schemes that
// take no slashes are kept as written.
const WITH_SLASHES = /^[a-z][a-z0-9+.-]*:\/\//i
const BARE_SCHEMES = /^(about|data|file|mailto|view-source|terminal-browser):/i
const LOCAL = /^(localhost|\d{1,3}(\.\d{1,3}){3}|\[[0-9a-f:]+\])(:\d+)?(\/|$)/i

export function normalizeUrl(raw: string): string {
  const text = raw.trim()
  if (LOCAL.test(text)) return `http://${text}`
  if (WITH_SLASHES.test(text) || BARE_SCHEMES.test(text)) return text
  return `https://${text}`
}
