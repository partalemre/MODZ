const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'
const BITS_PER_CHAR = 6
const BITS_PER_BYTE = 8
const BYTE_MASK = 255

// base64url to text, spelled out: the hooks environment has no atob or Buffer.
export function decodeBase64Url(text: string): string {
  let buffer = 0
  let bits = 0
  let out = ''
  for (const char of text.replace(/=+$/, '')) {
    const value = ALPHABET.indexOf(char === '+' ? '-' : char === '/' ? '_' : char)
    if (value < 0) return ''
    buffer = (buffer << BITS_PER_CHAR) | value
    bits += BITS_PER_CHAR
    if (bits >= BITS_PER_BYTE) {
      bits -= BITS_PER_BYTE
      out += String.fromCharCode((buffer >> bits) & BYTE_MASK)
    }
  }

  return out
}

export function isServiceRoleJwt(token: string): boolean {
  const payload = token.split('.')[1]
  if (payload === undefined) return false

  return /"role"\s*:\s*"service_role"/.test(decodeBase64Url(payload))
}
