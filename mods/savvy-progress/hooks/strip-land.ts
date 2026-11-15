// The strip scene's world: rolling ground the crab stands on, far hills behind it, a sky that follows the hour
// (a soft day, a warm dawn and dusk, a night darker than the panel) and small things growing on the ground, some
// in front of the crab so it walks among them. Everything is placed by its x alone, so the same width always
// draws the same land and the frame's source stays stable.

import type { Phase, Sky } from './sun'
import type { Weather } from './weather'

export const SCENE_H = 84
const BASE = 60
const STEP = 8
const RADIUS = 12
// The ground and the sky have faded out this far above the scene's bottom edge: air between it and the chips.
const FADE_END = 8

/** The ground's height at `x`: two slow waves, a few pixels up and down. */
export const groundY = (x: number): number => BASE + 4 * Math.sin(x / 61 + 1.3) + 2.2 * Math.sin(x / 23 + 0.4)

const hillY = (x: number): number => BASE - 12 + 6 * Math.sin(x / 97 + 0.2) + 3 * Math.sin(x / 41 + 2)
const farY = (x: number): number => BASE - 24 + 9 * Math.sin(x / 151 + 2.4) + 3 * Math.sin(x / 67 + 0.9)

const curve = (y: (x: number) => number, from: number, to: number, lift = 0): string => {
  const xs = Array.from({ length: Math.max(1, Math.ceil((to - from) / STEP)) + 1 }, (_, i) => Math.min(to, from + i * STEP))

  return xs.map((x, i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${(y(x) + lift).toFixed(1)}`).join('')
}

/** The ground's line from `from` to `to`, `lift` px under the surface: the plan's path runs along it. */
export const groundLine = (from: number, to: number, lift: number): string => curve(groundY, from, to, lift)

// The sky per phase, on a light panel and on a dark one: its colour overhead, its colour at the horizon and how
// strongly it washes the panel. Day is a little lighter than the panel, night darker; dawn and dusk glow low.
type Wash = readonly [top: string, horizon: string, opacity: number]
const SKY: Record<Phase, { light: Wash; dark: Wash }> = {
  dawn: { light: ['#C9D4F2', '#FFD9C2', 0.95], dark: ['#3A4470', '#C9826A', 0.42] },
  day: { light: ['#BBDCFA', '#EAF6FF', 0.95], dark: ['#3F78B8', '#7FB2DC', 0.44] },
  dusk: { light: ['#B9B4E6', '#FFC9A6', 0.95], dark: ['#2E2A5C', '#D9774F', 0.46] },
  night: { light: ['#1E2A52', '#3B4A7A', 0.5], dark: ['#02040A', '#141C36', 0.78] },
}

const landCss = (phase: Phase): string => {
  const { light, dark } = SKY[phase]

  return `<style>
.s0{stop-color:${light[0]}}.s1{stop-color:${light[1]}}.sky{opacity:${light[2]}}.hill{fill:#5A6B7A;opacity:.1}.hill2{fill:#5A6B7A;opacity:.16}
.pine{fill:#52647A;opacity:.4}.sg{stop-color:#E6E0D2}.turf{stroke:#C4BCAA}.speck{fill:#000;opacity:.14}.bird{stroke:#5A6B7A;opacity:.6}
.tuft{fill:#5E9B5A}.rock{fill:#A8A294}.stem{fill:#D8D2C4}.cloud{fill:#fff;opacity:.95}.star{fill:#fff}
.veil{fill:#7F8A99;opacity:.3}.drop{stroke:#4F6F96}.flake{fill:#7C8FA6}.fg{stop-color:#B8C0CA}.fog{opacity:.6}
@media (prefers-color-scheme: dark){.s0{stop-color:${dark[0]}}.s1{stop-color:${dark[1]}}.sky{opacity:${dark[2]}}.hill{fill:#fff;opacity:.04}.hill2{fill:#0B0E14;opacity:.3}
.pine{fill:#0B0E14;opacity:.5}.sg{stop-color:#36342D}.turf{stroke:#5A564C}.speck{fill:#fff;opacity:.06}.bird{stroke:#fff;opacity:.45}
.tuft{fill:#5FA86A}.rock{fill:#6B675E}.stem{fill:#CFCABD}.cloud{opacity:.12}
.veil{fill:#3C434D;opacity:.5}.drop{stroke:#A9C2E0}.flake{fill:#fff}.fg{stop-color:#AEB6C0}.fog{opacity:.3}}
</style>`
}

// A steady number in [0, 1) for a place: the same land at every draw.
const rnd = (i: number, salt: number): number => {
  const v = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453

  return v - Math.floor(v)
}

const px = (cls: string, box: readonly [x: number, y: number, w: number, h: number]): string => `<rect class="${cls}" x="${box[0]}" y="${box[1]}" width="${box[2]}" height="${box[3]}"/>`

// What grows on the ground, each drawn from its foot at (0, 0). A tuft is short enough to stand in front of the crab.
const THINGS: readonly { isFront?: boolean; isSwaying?: boolean; draw: (i: number) => string }[] = [
  { isFront: true, isSwaying: true, draw: () => px('tuft', [-3, -4, 1.5, 4]) + px('tuft', [0, -6, 1.5, 6]) + px('tuft', [3, -3, 1.5, 3]) },
  { draw: () => px('rock', [-4, -3, 8, 3]) + px('rock', [-2, -5, 4, 2]) },
  { isSwaying: true, draw: i => px('tuft', [0, -7, 1.2, 7]) + px(i % 2 === 0 ? 'f-plan' : 'f-warn', [-1.4, -10, 4, 3.4]) },
  { draw: () => px('stem', [-1, -4, 2, 4]) + px('f-danger', [-3.5, -7, 7, 3]) + px('f-danger', [-2, -8.5, 4, 1.5]) },
  { isFront: true, isSwaying: true, draw: () => px('tuft', [-2, -3, 1.5, 3]) + px('tuft', [1, -5, 1.5, 5]) },
  { draw: () => px('tuft', [-6, -5, 12, 5]) + px('tuft', [-4, -8, 8, 3]) },
]
const SPACING = 54
const JITTER = 30

/** The things on the ground across `width`: those behind the crab and those in front of it. */
export function decorOf(width: number): { back: string; front: string } {
  const layers = { back: '', front: '' }
  for (let i = 0; 40 + i * SPACING < width - 24; i += 1) {
    const x = 40 + i * SPACING + rnd(i, 1) * JITTER
    // A stride through the list, nudged by the place: neighbours differ, and no kind crowds the land.
    const thing = THINGS[(i * 5 + Math.floor(rnd(i, 2) * 2)) % THINGS.length]
    if (thing === undefined) continue
    const inner = thing.isSwaying === true ? `<g class="sway" style="animation-delay:-${(rnd(i, 3) * 4).toFixed(1)}s">${thing.draw(i)}</g>` : thing.draw(i)
    layers[thing.isFront === true ? 'front' : 'back'] += `<g transform="translate(${x.toFixed(1)},${(groundY(x) + 0.5).toFixed(1)})" shape-rendering="crispEdges">${inner}</g>`
  }

  return layers
}

const STARS = 16
const stars = (width: number): string =>
  Array.from({ length: STARS }, (_, i) => {
    const size = rnd(i, 6) > 0.7 ? 1.8 : 1.2

    return `<rect class="star tw${i % 3}" x="${(16 + rnd(i, 4) * (width - 32)).toFixed(1)}" y="${(5 + rnd(i, 5) * 30).toFixed(1)}" width="${size}" height="${size}"/>`
  }).join('')

const cloud = (x: number, y: number, cls: string): string =>
  `<g class="${cls}"><g transform="translate(${x},${y})" shape-rendering="crispEdges">${px('cloud', [0, 4, 26, 5])}${px('cloud', [5, 0, 12, 5])}${px('cloud', [15, 2, 7, 3])}</g></g>`

const SUN = '#F5C542'
const LOW_SUN = '#F08A4B'
const MOON = '#E8E6DA'

// A soft glow around a sun or a moon; `#glow` is a radial gradient in the scene's defs, tinted by `color`.
const glow = (x: number, y: number, r: number, color: string): string => `<circle class="halo" cx="${x.toFixed(1)}" cy="${y}" r="${r}" fill="url(#glow)" color="${color}"/>`

const sun = (x: number, y: number, r: number, color: string): string => `${glow(x, y, r * 3.2, color)}<circle cx="${x.toFixed(1)}" cy="${y}" r="${r}" fill="${color}" opacity=".92"/>`

const bird = (x: number, y: number, cls: string): string =>
  `<g class="${cls}"><path class="bird" d="M${x} ${y}l3.5 2.2 3.5-2.2" fill="none" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></g>`

// The sun's way over the sky, and the moon's: up from the left horizon, highest halfway, down to the right one.
const ARC = { side: 56, low: BASE - 25, high: 16 }
const arcAt = (at: number, width: number): { x: number; y: number } => ({
  x: ARC.side + at * (width - 2 * ARC.side),
  y: Math.round(ARC.low - (ARC.low - ARC.high) * Math.sin(Math.PI * at)),
})

// Where the clouds hang, as a share of the width and a height: two on a fair day, a sky full when it is dull.
const CLOUDS = {
  day: [[0.3, 8], [0.62, 15]],
  low: [[0.45, 10], [0.8, 20]],
  dull: [[0.06, 7], [0.22, 14], [0.38, 5], [0.54, 13], [0.7, 6], [0.86, 15]],
} as const
const cloudsAt = (places: readonly (readonly [at: number, y: number])[], width: number): string =>
  places.map(([at, y], i) => cloud(width * at, y, i % 2 === 0 ? 'drift' : 'drift drift2')).join('')

// Weather that greys the whole sky: the sun or the moon only glimmers through, no stars, no birds.
const isDullOf = (weather: Weather | undefined): boolean => weather !== undefined && weather !== 'clear' && weather !== 'cloudy'

// What hangs in the sky: a sun, two slow clouds and two birds by day, a low sun at dawn and dusk, a moon, stars
// and now and then a falling star at night. The sun and the moon stand where the hour puts them (sun.ts); the
// weather takes the clouds away, or fills the sky with them.
function heavens(sky: Sky, width: number): string {
  const { x, y } = arcAt(sky.at, width)
  const isNight = sky.phase === 'night'
  const isDull = isDullOf(sky.weather)
  const moon = `${glow(x, y, 20, MOON)}<path fill="${MOON}" transform="translate(${x.toFixed(1)},${y})" d="M0-7a7 7 0 1 0 7 7 5.4 5.4 0 0 1-7-7z"/>`
  const light = isNight ? moon : sky.phase === 'day' ? sun(x, y, 6, SUN) : sun(x, y, 9, LOW_SUN)
  const fall = `<line class="shoot" x1="${(width * 0.62).toFixed(0)}" y1="8" x2="${(width * 0.62 + 16).toFixed(0)}" y2="2" stroke="#fff" stroke-width="1.2" stroke-linecap="round"/>`
  const fair = isNight ? [] : sky.phase === 'day' ? CLOUDS.day : CLOUDS.low
  const clouds = sky.weather === 'clear' ? '' : cloudsAt(isDull ? CLOUDS.dull : fair, width)
  if (isDull) return `<g opacity=".35">${light}</g><rect class="veil" width="${width}" height="${SCENE_H}"/>${clouds}`
  const birds = sky.phase === 'day' ? `${bird(width * 0.46, 22, 'drift drift2')}${bird(width * 0.46 + 12, 17, 'drift drift2')}` : ''

  return (isNight ? stars(width) + fall : '') + light + clouds + birds
}

// What falls through the air, in front of everything: one piece per `every` px of width, each on its own beat.
const FALLS: Partial<Record<Weather, { cls: string; every: number; seconds: number }>> = {
  rain: { cls: 'drop', every: 13, seconds: 0.7 },
  storm: { cls: 'drop', every: 9, seconds: 0.55 },
  snow: { cls: 'flake', every: 16, seconds: 4.5 },
}

const falling = (weather: Weather | undefined, width: number): string => {
  const fall = weather === undefined ? undefined : FALLS[weather]
  if (fall === undefined) return ''
  let out = ''
  for (let i = 0; i * fall.every < width; i += 1) {
    const x = ((i + rnd(i, 12)) * fall.every).toFixed(1)
    const y = (4 + rnd(i, 13) * (BASE - 12)).toFixed(1)
    const beat = `style="animation-duration:${(fall.seconds * (0.8 + rnd(i, 14) * 0.4)).toFixed(2)}s;animation-delay:-${(rnd(i, 15) * fall.seconds).toFixed(2)}s"`
    out += fall.cls === 'drop' ? `<path class="drop" d="M${x} ${y}l-1.6 5" fill="none" stroke-width="1" stroke-linecap="round" ${beat}/>` : `<rect class="flake" x="${x}" y="${y}" width="1.8" height="1.8" ${beat}/>`
  }
  // Lightning is a faint flash of the whole scene, twice in quick succession, a few times a minute.
  const bolt = weather === 'storm' ? `<rect class="bolt" width="${width}" height="${SCENE_H}" fill="#fff" opacity="0"/>` : ''

  return out + bolt
}

const FOG = { top: BASE - 42, h: 54 }
// Fog lies over the hills and the ground, thickest at the horizon; `#fogg` fades it out above and below.
const fog = (width: number): string => `<rect class="fog" y="${FOG.top}" width="${width}" height="${FOG.h}" fill="url(#fogg)"/>`

// Pines along the near hills: dark shapes against the sky, each its own size.
const PINE = [
  [-1, -2, 2, 2],
  [-4, -5, 8, 3],
  [-3, -8, 6, 3],
  [-2, -11, 4, 3],
  [-1, -13, 2, 2],
] as const
const PINE_STEP = 46

const pines = (width: number): string => {
  let out = ''
  for (let i = 0; 20 + i * PINE_STEP < width - 10; i += 1) {
    if (rnd(i, 7) < 0.42) continue
    const x = 20 + i * PINE_STEP + rnd(i, 8) * 24
    const size = 0.75 + rnd(i, 9) * 0.5
    out += `<g transform="translate(${x.toFixed(1)},${(hillY(x) + 1).toFixed(1)}) scale(${size.toFixed(2)})" shape-rendering="crispEdges">${PINE.map(box => px('pine', box)).join('')}</g>`
  }

  return out
}

const SPECKS = 26
const specks = (width: number): string =>
  Array.from({ length: SPECKS }, (_, i) => {
    const x = 10 + rnd(i, 10) * (width - 20)

    return `<rect class="speck" x="${x.toFixed(1)}" y="${(groundY(x) + 4 + rnd(i, 11) * 9).toFixed(1)}" width="1.6" height="1.6"/>`
  }).join('')

const fireflies = (width: number): string =>
  [0.24, 0.58, 0.83].map((at, i) => `<circle class="fly fly${i}" cx="${(width * at).toFixed(0)}" cy="${(groundY(width * at) - 12).toFixed(1)}" r="1.3" fill="#F5E07A"/>`).join('')

export type Land = { open: string; back: string; front: string; close: string }

/** The world at `width` under `sky`, in the layers the scene draws its crabs between. */
export function landOf(width: number, sky: Sky): Land {
  const { phase } = sky
  const under = (y: (x: number) => number): string => `${curve(y, 0, width)}L${width} ${SCENE_H}L0 ${SCENE_H}Z`
  const fadeOut = `<stop offset="0" stop-color="#fff"/><stop offset=".66" stop-color="#fff" stop-opacity=".6"/><stop offset=".9" stop-color="#fff" stop-opacity="0"/>`
  const defs = `<defs><clipPath id="win"><rect width="${width}" height="${SCENE_H}" rx="${RADIUS}"/></clipPath><linearGradient id="skf" x1="0" y1="0" x2="0" y2="1">${fadeOut}</linearGradient><mask id="skm"><rect width="${width}" height="${SCENE_H}" fill="url(#skf)"/></mask><linearGradient id="skc" x1="0" y1="0" x2="0" y2="1"><stop class="s0" offset="0"/><stop class="s1" offset=".72"/></linearGradient><radialGradient id="glow"><stop offset="0" stop-color="currentColor" stop-opacity=".5"/><stop offset="1" stop-color="currentColor" stop-opacity="0"/></radialGradient><linearGradient id="fogg" x1="0" y1="0" x2="0" y2="1"><stop class="fg" offset="0" stop-opacity="0"/><stop class="fg" offset=".55"/><stop class="fg" offset="1" stop-opacity="0"/></linearGradient><linearGradient id="sof" gradientUnits="userSpaceOnUse" x1="0" y1="${BASE - 6}" x2="0" y2="${SCENE_H - FADE_END}"><stop class="sg" offset="0"/><stop class="sg" offset="1" stop-opacity="0"/></linearGradient></defs>`
  const decor = decorOf(width)
  const air = `<g mask="url(#skm)"><rect class="sky" width="${width}" height="${SCENE_H}" fill="url(#skc)"/>${heavens(sky, width)}<path class="hill" d="${under(farY)}"/><path class="hill2" d="${under(hillY)}"/>${pines(width)}</g>`
  const ground = `<path d="${under(groundY)}" fill="url(#sof)"/>${specks(width)}<path class="turf" d="${curve(groundY, 0, width)}" fill="none" stroke-width="1.5" stroke-linecap="round"/>`

  return { open: `${landCss(phase)}${defs}<g clip-path="url(#win)">${air}${ground}`, back: decor.back, front: decor.front + (phase === 'night' && !isDullOf(sky.weather) ? fireflies(width) : '') + (sky.weather === 'fog' ? fog(width) : '') + falling(sky.weather, width), close: '</g>' }
}
