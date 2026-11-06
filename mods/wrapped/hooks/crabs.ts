// The Agents pane's crabs (mods/savvy-progress/hooks/crabs.ts): the same bodies, costumes, shells and names, so an
// agent in the film looks like the agent beside the chat. A mod ships alone, hence this copy. No CSS here: a film
// frame is one still picture, so `step` moves the legs and the bob by hand, and the costumes keep the tiers' colours.

export type Eyes = 'dot' | 'tall' | 'wide' | 'wink'
export type Look = { shell: string; eyes: Eyes; name: string }

const SHELLS = ['#D97757', '#4FA3C7', '#6BB26F', '#B07CC6', '#E07A9A', '#7C93B8', '#4DB6A0', '#B8977A']
const EYES: Eyes[] = ['dot', 'tall', 'wide', 'wink']
const NAMES = ['Pip', 'Mako', 'Nori', 'Kiko', 'Sol', 'Fenn', 'Coral', 'Rio', 'Zuzu', 'Moss', 'Dune', 'Juno', 'Otto', 'Lumi', 'Skip', 'Nemo']

const TIER_COLOR: Record<string, string> = { fable: '#7F77DD', heavy: '#D85A30', careful: '#BA7517', medium: '#378ADD', light: '#1D9E75', other: '#888780' }
const colorOf = (tier: string): string => TIER_COLOR[tier] ?? '#888780'

export const lookAt = (slot: number): Look => ({
  shell: SHELLS[slot % SHELLS.length] ?? '#D97757',
  eyes: EYES[Math.floor(slot / SHELLS.length) % EYES.length] ?? 'dot',
  name: NAMES[slot % NAMES.length] ?? 'Pip',
})

// A savvy tier and the Explore pirate wear their own costume; any other type wears one by its place in the ranking.
const BY_RANK = ['careful', 'medium', 'heavy', 'light', 'fable', 'other']
export function costumeFor(type: string, rank: number): string {
  const bare = type.replace(/^[^:]*:/, '')
  if (bare === 'Explore') return 'explore'
  const tier = bare.replace(/^savvy-/, '').toLowerCase()
  if (bare.startsWith('savvy-') && Object.hasOwn(COSTUMES, tier)) return tier

  return BY_RANK[rank % BY_RANK.length] ?? 'other'
}

const INK = '#1F1E1D'

type Box = [x: number, y: number, w: number, h: number]

// `cls` puts a pixel in a named group: `bd` (the default) is the body and its
// costume, `la`/`lb` the leg pairs, anything else a prop with its own motion.
type Fill = (box: Box, c: string, cls?: string) => void

type Sprite = { x: number; y: number; rows: string[]; map: Record<string, string>; cls?: string }

const stamp = (f: Fill, { x, y, rows, map, cls }: Sprite): void =>
  rows.forEach((row, dy) => [...row].forEach((ch, dx) => map[ch] && f([x + dx, y + dy, 1, 1], map[ch] ?? '', cls)))

// Four pairs of eyes tell agents of one tier apart; a wink keeps one eye and closes the other.
const eyesOf = (f: Fill, kind: Eyes): void => {
  const isWide = kind === 'wide'
  const isTall = kind === 'tall'
  const y = isTall ? 11 : 12
  const h = isTall ? 3 : 2
  f([isWide ? 8 : 9, y, 2, h], INK)
  if (kind === 'wink') f([19, 13, 3, 1], INK)
  else f([isWide ? 20 : 19, y, 2, h], INK)
}

// `front` lifts a claw and `cls` lets it travel with the prop it holds; `face` stands in for the eyes.
type Arm = { front?: number; cls?: string; face?: Box[] }

const crabBody = (f: Fill, arm: Arm, look: Look): void => {
  const c = look.shell
  f([7, 10, 16, 12], c)
  f([3, 14, 4, 4], c)
  f([23, 14 + (arm.front ?? 0), 4, 4], c, arm.cls)
  if (arm.face) arm.face.forEach(box => f(box, INK))
  else eyesOf(f, look.eyes)
  f([7, 22, 2, 4], c, 'la')
  f([17, 22, 2, 4], c, 'la')
  f([11, 22, 2, 4], c, 'lb')
  f([21, 22, 2, 4], c, 'lb')
}

const COSTUMES: Record<string, (f: Fill, t: string, look: Look) => void> = {
  // Fable: astronaut in a glass dome; floats instead of walking, the antenna and the star blink.
  fable: (f, t, look) => {
    crabBody(f, {}, look)
    f([6, 7, 18, 1], '#E6E8EE'); f([5, 8, 1, 14], '#E6E8EE'); f([24, 8, 1, 14], '#E6E8EE'); f([6, 22, 18, 1], '#C9CCD2')
    f([6, 8, 18, 14], 'rgba(169,214,245,.32)'); f([8, 9, 2, 1], '#fff'); f([8, 10, 1, 2], '#fff')
    f([14, 4, 2, 3], '#C9CCD2'); f([14, 2, 2, 2], t, 'ant'); f([13, 18, 4, 2], t)
    f([27, 3, 1, 3], '#F5C542', 'star'); f([26, 4, 3, 1], '#F5C542', 'star')
  },
  // Heavy: detective with a deerstalker; the magnifier sweeps and glints.
  heavy: (f, t, look) => {
    crabBody(f, { front: -4, cls: 'it' }, look)
    stamp(f, { x: 6, y: 3, rows: ['......bbbbbb......', '....bbcbbcbbbb....', '...bbbbbbbbbbbb...', '..bcbbcbbcbbcbbb..', '.bbbbbbbbbbbbbbbb.', 'dddddddddddddddddd'], map: { b: '#7A4A26', c: '#A0703F', d: '#5A3519' } })
    f([6, 9, 18, 1], t)
    stamp(f, { x: 23, y: 1, rows: ['.kkk.', 'k...k', 'k...k', 'k...k', '.kkk.'], map: { k: '#3A3A3C' }, cls: 'it' })
    f([24, 2, 3, 3], 'rgba(169,214,245,.7)', 'it'); f([25, 6, 1, 4], '#7A4A26', 'it'); f([24, 2, 1, 1], '#fff', 'gl')
  },
  // Careful: engineer in a hard hat; the wrench turns a bolt.
  careful: (f, t, look) => {
    crabBody(f, {}, look)
    stamp(f, { x: 6, y: 4, rows: ['.....yyyyyyyy.....', '...yyyyyhhyyyyy...', '..yyyyyyhhyyyyyy..', '..yyyyyyhhyyyyyy..', '.yyyyyyyhhyyyyyyy.', 'dddddddddddddddddd'], map: { y: '#F5C542', h: '#FBE08A', d: '#C99A1E' } })
    f([13, 5, 4, 2], t)
    stamp(f, { x: 0, y: 10, rows: ['.s.s', 'sss.', '.s..', '.s..'], map: { s: '#8E929A' }, cls: 'it' })
  },
  // Medium: chef, the toque traced from DockCrab's Sprites.chefHat; tosses the omelette.
  medium: (f, t, look) => {
    crabBody(f, { front: -4, cls: 'pan' }, look)
    stamp(f, { x: 6, y: 0, rows: ['........lll.......', '.......lllll......', '.wwwwgwwwwwwgwwwww', 'wwwwwwwwwwwwwwwwww', 'wwwwwwwwwwwwwwwwww', 'wwwwwgwwwwwggwwwww', '.wwwwgwwwwwggwwwww', '.dddbbbbbbbbbbbbb.', '.dddbbbbbbbbbbbbb.', '.dddbbbbbbbbbbbbb.'], map: { w: '#F4F3EE', l: '#F7F6F2', g: '#D2D1C8', b: t, d: '#B45F43' } })
    f([22, 8, 7, 2], '#4A4A48', 'pan'); f([26, 10, 1, 1], '#4A4A48', 'pan'); f([24, 7, 3, 1], '#F5B731', 'egg')
  },
  // Light: racer in a helmet; runs at double pace, the checkered flag flutters.
  light: (f, t, look) => {
    crabBody(f, { front: -4 }, look)
    stamp(f, { x: 6, y: 5, rows: ['....rrrrrrrrrr....', '..rrrrrrwwrrrrrr..', '.rrrrrrrwwrrrrrrr.', '.rrrrrrrwwrrrrrrr.', '.rrrrrrrwwrrrrrrr.', '.kkkkkkkkkkkkkkkkr'], map: { r: t, w: '#F8F6F1', k: INK } })
    f([25, 1, 1, 9], '#8E929A')
    stamp(f, { x: 26, y: 1, rows: ['wkwk', 'kwkw', 'wkwk'], map: { w: '#F8F6F1', k: INK }, cls: 'flag' })
  },
  // Explore: pirate scouting the code; the cutlass fences.
  explore: (f, _t, look) => {
    crabBody(f, {}, look)
    stamp(f, { x: 5, y: 3, rows: ['.kk..............kk.', '.kkk....kkkk....kkk.', '..kkkkkkkwwkkkkkkk..', '..kkkkkkkkkkkkkkkk..', '.gggggggggggggggggg.'], map: { k: '#55514C', w: '#F8F6F1', g: '#F5C542' } })
    f([7, 11, 11, 1], INK); f([18, 11, 4, 3], INK)
    f([27, 6, 1, 9], '#C9CCD2', 'it'); f([26, 15, 3, 1], '#7A4A26', 'it')
  },
  other: (f, _t, look) => crabBody(f, {}, look),
}

export type CrabOptions = { costume: string; look: Look; scale: number; step?: number }

const CELL_ROW = 'shape-rendering="crispEdges"'

// One still crab at (x, y); an odd `step` lifts the other pair of legs and drops the body a pixel.
export function crab(x: number, y: number, o: CrabOptions): string {
  const groups: Record<string, string[]> = { bd: [], la: [], lb: [] }
  const f: Fill = ([cx, cy, w, h], c, cls = 'bd') => {
    const name = cls === 'la' || cls === 'lb' ? cls : 'bd'
    groups[name]?.push(`<rect x="${cx}" y="${cy}" width="${w}" height="${h}" fill="${c}"/>`)
  }
  const draw = COSTUMES[o.costume] ?? COSTUMES.other
  draw?.(f, colorOf(o.costume), o.look)
  const isOdd = (o.step ?? 0) % 2 === 1
  const shift = (cls: string, by: number): string => `<g transform="translate(0 ${by})">${(groups[cls] ?? []).join('')}</g>`

  return `<g transform="translate(${x} ${y}) scale(${o.scale})" ${CELL_ROW}>${shift('bd', isOdd ? 1 : 0)}${shift('la', isOdd ? -1 : 0)}${shift('lb', isOdd ? 0 : -1)}</g>`
}
