import type { AgentRun } from '../types'

// Each agent gets a look of its own: a shell colour, a pair of eyes and a name, handed out in order
// of arrival so agents working side by side never wear the same one. The costume still says the tier.

export type Eyes = 'dot' | 'tall' | 'wide' | 'wink'

export type Look = { shell: string; eyes: Eyes; name: string }

// Clay first (the brand body), then colours that stay readable under every costume's hat.
const SHELLS = ['#D97757', '#4FA3C7', '#6BB26F', '#B07CC6', '#E07A9A', '#7C93B8', '#4DB6A0', '#B8977A']
const EYES: Eyes[] = ['dot', 'tall', 'wide', 'wink']
const NAMES = ['Pip', 'Mako', 'Nori', 'Kiko', 'Sol', 'Fenn', 'Coral', 'Rio', 'Zuzu', 'Moss', 'Dune', 'Juno', 'Otto', 'Lumi', 'Skip', 'Nemo']

export const CLAY = SHELLS[0] ?? '#D97757'

const hashOf = (id: string): number => [...id].reduce((sum, ch) => (sum * 31 + ch.charCodeAt(0)) >>> 0, 7)

// Shells repeat every 8 agents, names every 16; the eyes change at each 8, so 32 looks are all different.
export const lookAt = (slot: number): Look => ({
  shell: SHELLS[slot % SHELLS.length] ?? CLAY,
  eyes: EYES[Math.floor(slot / SHELLS.length) % EYES.length] ?? 'dot',
  name: NAMES[slot % NAMES.length] ?? 'Pip',
})

export const lookOf = (a: Pick<AgentRun, 'id' | 'look'>): Look => lookAt(a.look ?? hashOf(a.id))

// The next free slot: one past the highest the list holds.
export const nextLook = (list: Pick<AgentRun, 'look'>[]): number =>
  list.reduce((top, a) => Math.max(top, (a.look ?? -1) + 1), 0)
