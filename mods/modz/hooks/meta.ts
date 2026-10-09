// What a manifest does not say: each mod's group, the surfaces it draws on and, for a mod built on
// another project, where it came from. A mod missing here lands in "Diğer" with both surfaces.
export type Group = 'Görünüm' | 'Koruma' | 'Ölçüm' | 'Akış' | 'Diğer'

export type Surface = 'masaüstü' | 'terminal'

type Meta = { group: Group; surfaces?: Surface[]; upstream?: string }

export const GROUPS: Group[] = ['Görünüm', 'Koruma', 'Ölçüm', 'Akış', 'Diğer']
export const BOTH: Surface[] = ['masaüstü', 'terminal']

export const META: Record<string, Meta> = {
  skins: { group: 'Görünüm' },
  filetree: { group: 'Görünüm' },
  'replay-theater': { group: 'Görünüm', upstream: 'anthropics/claude-code-playground' },
  'terminal-browser': { group: 'Görünüm', surfaces: ['terminal'] },
  modz: { group: 'Görünüm' },
  'blast-radius': { group: 'Koruma', upstream: 'anthropics/claude-code-playground' },
  'secret-guard': { group: 'Koruma' },
  checkpoint: { group: 'Koruma' },
  'session-budget': { group: 'Koruma' },
  'cache-tax': { group: 'Koruma', upstream: 'karanb192/cache-tax' },
  'hud-pro': { group: 'Ölçüm' },
  'test-badge': { group: 'Ölçüm' },
  'savvy-progress': { group: 'Ölçüm' },
  'agent-deck-pro': { group: 'Akış' },
  'savvy-flow': { group: 'Akış' },
  'plan-steps': { group: 'Akış' },
  'reflect-mod': { group: 'Akış' },
  'done-ping': { group: 'Akış' },
}

const GITHUB = /github\.com\/([\w.-]+)(?:\/([\w.-]+))?/

// "owner/repo" from a GitHub address, or the owner alone from a profile address.
export function githubName(url: unknown): string | null {
  const match = typeof url === 'string' ? GITHUB.exec(url) : null
  if (match === null) return null

  return match[2] === undefined ? (match[1] ?? null) : `${match[1]}/${match[2].replace(/\.git$/, '')}`
}

// Two letters for the monogram tile: the initials of a two-part name, else its first two letters.
export function monogram(name: string): string {
  const parts = name.split('-').filter(part => part !== '')
  const letters = parts.length > 1 ? `${parts[0]?.[0] ?? ''}${parts[1]?.[0] ?? ''}` : name.slice(0, 2)

  // Mod names are English: a dotless I, never İ.
  return letters.toUpperCase()
}
