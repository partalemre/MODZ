// MODZ kit — motion for interactive Svgs (DESIGN.md §5). On the desktop an interactive Svg is a frame the surface
// keeps while its source stays the same and rebuilds when it changes, and a pane remounts whole when it opens. So a
// drawing's source is fixed per what it shows (stable.ts): its first draw since the pane opened enters, a later
// change of what it shows sweeps once, and an unchanged drawing keeps its frame, its loops running on undisturbed.
// Classes carry an `m-` prefix so they never meet a drawing's own (the kit's `shimmer` skeleton is another loop).

// Where a drawing is in its life: first drawn since the pane opened, or redrawn because what it shows changed (an
// unchanged one is never redrawn: its source is reused). `still`: redrawn for a ticking clock alone, so no sweep.
export type Phase = 'enter' | 'change' | 'still'

// Its place in the opening cascade, top to bottom.
export type Cue = { phase: Phase; order: number }

const STAGGER_MS = 45
const EASE = 'cubic-bezier(.2,.8,.2,1)'
// A neutral sheen that reads on either scheme, for the sweep that marks a change.
const SHEEN = '#A39E93'
const SHEEN_PEAK = 0.24

// Each rule by the class it styles, so a drawing carries only the ones it uses.
const RULES: Record<string, string> = {
  'm-in': `.m-in{animation:m-in .42s ${EASE} both}@keyframes m-in{from{opacity:0;transform:translateY(8px)}}`,
  'm-fade': `.m-fade{animation:m-fade .5s ${EASE} both}@keyframes m-fade{from{opacity:0}}`,
  'm-grow': `.m-grow{transform-box:fill-box;transform-origin:left center;animation:m-grow .7s ${EASE} both}@keyframes m-grow{from{transform:scaleX(0)}}`,
  'm-px': `.m-px{transform-box:fill-box;transform-origin:center;animation:m-px .34s ${EASE} both}@keyframes m-px{from{opacity:0;transform:translateY(-10px) scale(.6)}}`,
  'm-sweep': `.m-sweep{pointer-events:none;animation:m-sweep 1.1s ${EASE} both}@keyframes m-sweep{from{transform:translateX(-120%)}to{transform:translateX(220%)}}`,
  'm-flash': '.m-flash{animation:m-flash 1.6s ease-out both}@keyframes m-flash{from{opacity:.9}to{opacity:0}}',
  'm-ripple': '.m-ripple{transform-box:fill-box;transform-origin:center;animation:m-ripple 1.8s ease-out infinite}@keyframes m-ripple{from{opacity:.55;transform:scale(1)}to{opacity:0;transform:scale(3.2)}}',
  'm-shine': '.m-shine{transform-box:fill-box;animation:m-shine 1.6s linear infinite}@keyframes m-shine{from{transform:translateX(-100%)}to{transform:translateX(250%)}}',
  // Hover inside the frame: a row's wash comes up and its tile lifts (a press stays on the native button).
  'm-wash': `.m-wash{fill:#8E8A80;opacity:0;transition:opacity .12s ${EASE}}svg:hover .m-wash{opacity:.12}`,
  'm-tile': `.m-tile{transform-box:fill-box;transform-origin:center;transition:transform .2s ${EASE}}svg:hover .m-tile{transform:translateY(-1px) scale(1.06)}`,
}

const REDUCED = '@media (prefers-reduced-motion: reduce){*{animation:none!important;transition:none!important}}'

// The motion rules `body` uses, with reduced motion last so it wins.
export function motionCss(body: string): string {
  const used = Object.keys(RULES).filter(name => new RegExp(`\\b${name}\\b`).test(body))

  return used.length === 0 ? '' : `${used.map(name => RULES[name]).join('')}${REDUCED}`
}

// Every motion rule, for a drawing that assembles its own style.
export const MOTION_CSS = Object.values(RULES).join('')

export const isEntering = (cue: Cue): boolean => cue.phase === 'enter'

// Wraps `body` in the entrance, delayed by its place in the cascade; drawn as is when it changed later.
export function entering(body: string, cue: Cue, kind: 'in' | 'fade' = 'in'): string {
  if (!isEntering(cue)) return body

  return `<g class="m-${kind}" style="animation-delay:${cue.order * STAGGER_MS}ms">${body}</g>`
}

// The delay of the n-th piece inside one drawing that is entering, after its own cascade place.
export const delayOf = (cue: Cue, step: number): string => `animation-delay:${cue.order * STAGGER_MS + step}ms`

// A beam of neutral light passing once over the whole drawing: what it shows just changed.
export const SWEEP = [
  `<defs><linearGradient id="m-sheen" x1="0" x2="1"><stop offset="0" stop-color="${SHEEN}" stop-opacity="0"/>`,
  `<stop offset=".5" stop-color="${SHEEN}" stop-opacity="${SHEEN_PEAK}"/><stop offset="1" stop-color="${SHEEN}" stop-opacity="0"/></linearGradient></defs>`,
  '<rect x="0" y="0" width="50%" height="100%" fill="url(#m-sheen)" class="m-sweep"/>',
].join('')

// The hover wash under a row's drawing.
export const WASH = '<rect x="0" y="0" width="100%" height="100%" rx="10" class="m-wash"/>'

type Dot = { cx: number; cy: number; r: number; className: string }

// Rings going out of a live dot, forever: drawn under the dot itself, in the dot's own paint class.
export const rings = (dot: Dot): string =>
  `<circle cx="${dot.cx}" cy="${dot.cy}" r="${dot.r}" class="${dot.className} m-ripple"/>`

type Bar = { id: string; x: number; y: number; width: number; height: number; rx?: number }

// A light running along a live bar, clipped to it; `id` is unique within the drawing.
export function shine(bar: Bar): string {
  const rx = bar.rx ?? bar.height / 2

  return [
    `<defs><clipPath id="${bar.id}-c"><rect x="${bar.x}" y="${bar.y}" width="${bar.width}" height="${bar.height}" rx="${rx}"/></clipPath>`,
    `<linearGradient id="${bar.id}-g" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".45"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient></defs>`,
    `<g clip-path="url(#${bar.id}-c)"><rect x="${bar.x}" y="${bar.y}" width="${Math.max(bar.width * 0.4, bar.height * 4)}" height="${bar.height}" fill="url(#${bar.id}-g)" class="m-shine"/></g>`,
  ].join('')
}
