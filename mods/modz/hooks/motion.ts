// The hub's motion (DESIGN.md §5). On the desktop each interactive Svg is a frame the surface keeps while its
// source stays the same and rebuilds when it changes, and a pane remounts whole when it opens. So a drawing's
// source is fixed per what it shows (stable.ts): its first draw since the pane opened enters, a later change of
// what it shows lights it once, and an unchanged drawing keeps its frame, its loops running on undisturbed.

// Where a drawing is in its life: first drawn since the pane opened, redrawn because what it shows changed, or the
// same as before (never redrawn: its source is reused).
export type Phase = 'enter' | 'change'

// Its place in the opening cascade, top to bottom.
export type Cue = { phase: Phase; order: number }

const STAGGER_MS = 45
const EASE = 'cubic-bezier(.2,.8,.2,1)'

export const MOTION_CSS = [
  `.in{animation:in .42s ${EASE} both}@keyframes in{from{opacity:0;transform:translateY(8px)}}`,
  `.fade{animation:fade .5s ${EASE} both}@keyframes fade{from{opacity:0}}`,
  `.grow{transform-box:fill-box;transform-origin:left center;animation:grow .7s ${EASE} both}@keyframes grow{from{transform:scaleX(0)}}`,
  `.px{transform-box:fill-box;transform-origin:center;animation:px .34s ${EASE} both}@keyframes px{from{opacity:0;transform:translateY(-10px) scale(.6)}}`,
  `.sweep{animation:sweep 1.1s ${EASE} both}@keyframes sweep{from{transform:translateX(-120%)}to{transform:translateX(220%)}}`,
  '.flash{animation:flash 1.6s ease-out both}@keyframes flash{from{opacity:.9}to{opacity:0}}',
  '.ripple{transform-box:fill-box;transform-origin:center;animation:ripple 1.8s ease-out infinite}@keyframes ripple{from{opacity:.55;transform:scale(1)}to{opacity:0;transform:scale(3.2)}}',
  '.shimmer{animation:shimmer 1.6s linear infinite}@keyframes shimmer{from{transform:translateX(-100%)}to{transform:translateX(250%)}}',
].join('')

// Hover inside the frame: the row's wash comes up and its tile lifts (the press stays on the native button).
export const HOVER_CSS = [
  `.wash{fill:var(--track);opacity:0;transition:opacity .12s ${EASE}}svg:hover .wash{opacity:.55}`,
  `.tile{transform-box:fill-box;transform-origin:center;transition:transform .2s ${EASE}}svg:hover .tile{transform:translateY(-1px) scale(1.06)}`,
].join('')

export const isEntering = (cue: Cue): boolean => cue.phase === 'enter'

// Wraps `body` in the entrance, delayed by its place in the cascade; drawn as is when it changed later.
export function entering(body: string, cue: Cue, kind: 'in' | 'fade' = 'in'): string {
  if (!isEntering(cue)) return body

  return `<g class="${kind}" style="animation-delay:${cue.order * STAGGER_MS}ms">${body}</g>`
}

// The delay of the n-th piece inside one drawing that is entering, after its own cascade place.
export const delayOf = (cue: Cue, step: number): string => `animation-delay:${cue.order * STAGGER_MS + step}ms`
