import { findSecrets } from './detect'
import type { Secret } from './detect'

// The secrets the person pasted into a prompt, each behind a placeholder the model sees in its place.
// Held in this module's memory alone: never `$.store`, `$.state`, a file or a log line. A reload forgets them.
export type Kept = { token: string; value: string; label: string; envName: string }
export type Vault = { byValue: Map<string, Kept>; byToken: Map<string, Kept> }

export const TOKEN = /⟦secret:\d+⟧/g
// A whole PEM block, so the key's body leaves the prompt with its header.
const PEM = /-----BEGIN (?:[A-Z]+ )*PRIVATE KEY-----[\s\S]*?-----END (?:[A-Z]+ )*PRIVATE KEY-----/g

export const createVault = (): Vault => ({ byValue: new Map(), byToken: new Map() })

export const sessionVault: Vault = createVault()

export function clearVault(vault: Vault): void {
  vault.byValue.clear()
  vault.byToken.clear()
}

function keep(vault: Vault, secret: Pick<Secret, 'value' | 'label' | 'envName'>): Kept {
  const known = vault.byValue.get(secret.value)
  if (known !== undefined) return known
  const kept = { token: `⟦secret:${vault.byValue.size + 1}⟧`, value: secret.value, label: secret.label, envName: secret.envName }
  vault.byValue.set(kept.value, kept)
  vault.byToken.set(kept.token, kept)

  return kept
}

// Longest first, so a value that holds another is replaced whole.
function replaceAll(text: string, pairs: [string, string][]): string {
  return [...pairs].sort((a, b) => b[0].length - a[0].length).reduce((out, [from, to]) => out.split(from).join(to), text)
}

// The prompt with every detected secret behind its placeholder; the same value always gets the same one.
export function hide(vault: Vault, text: string): string {
  const pems = [...text.matchAll(PEM)].map(match => ({ value: match[0], label: 'private key', envName: 'PRIVATE_KEY' }))
  const found = findSecrets(text).filter(secret => secret.kind !== 'private-key')
  const kept = [...pems, ...found].map(secret => keep(vault, secret))

  return replaceAll(text, kept.map(entry => [entry.value, entry.token]))
}

// Real values back in place of the placeholders; `missing` names the ones this session no longer holds.
export function reveal(vault: Vault, text: string): { text: string; missing: string[] } {
  const missing: string[] = []
  const out = text.replace(TOKEN, token => {
    const kept = vault.byToken.get(token)
    if (kept === undefined) missing.push(token)

    return kept?.value ?? token
  })

  return { text: out, missing: [...new Set(missing)] }
}

// Any real value echoed back (a command's output) becomes its placeholder again.
export function scrub(vault: Vault, text: string): string {
  if (vault.byValue.size === 0) return text

  return replaceAll(text, [...vault.byValue.values()].map(entry => [entry.value, entry.token]))
}

export const hasTokens = (text: string): boolean => text.match(TOKEN) !== null

// The placeholders a file write holds, as findings the card shows: the line, and the real value kept for a move.
export function tokenHits(vault: Vault, text: string): (Secret & { token: string })[] {
  const hits: (Secret & { token: string })[] = []
  text.split('\n').forEach((row, index) => {
    for (const match of row.matchAll(TOKEN)) {
      const kept = vault.byToken.get(match[0])
      if (kept === undefined) continue
      hits.push({ kind: 'placeholder', label: kept.label, value: kept.value, envName: kept.envName, line: index + 1, isMovable: kept.envName !== 'PRIVATE_KEY', token: kept.token })
    }
  })

  return hits
}
