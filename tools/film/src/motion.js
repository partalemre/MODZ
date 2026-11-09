// Time is the only input: every value in the film is a pure function of t (seconds), so a frame renders the same
// every time and the capture can step at any rate. Springs use Framer Motion's model (stiffness, damping, mass).

export const clamp = (v, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v))
export const lerp = (a, b, p) => a + (b - a) * p
export const seg = (t, a, b) => clamp((t - a) / (b - a))
export const fmt = (v, digits = 0) => v.toFixed(digits)

// cubic-bezier(x1, y1, x2, y2) as a function of progress, solved by Newton steps with a bisection fallback.
export function bezier(x1, y1, x2, y2) {
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx
  const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by
  const x = s => ((ax * s + bx) * s + cx) * s
  const dx = s => (3 * ax * s + 2 * bx) * s + cx
  const y = s => ((ay * s + by) * s + cy) * s
  return p => {
    if (p <= 0) return 0
    if (p >= 1) return 1
    let s = p
    for (let i = 0; i < 6; i++) {
      const d = dx(s)
      if (Math.abs(d) < 1e-6) break
      s -= (x(s) - p) / d
    }
    if (s < 0 || s > 1 || Math.abs(x(s) - p) > 1e-4) {
      let lo = 0, hi = 1
      for (let i = 0; i < 30; i++) { s = (lo + hi) / 2; if (x(s) < p) lo = s; else hi = s }
    }
    return y(s)
  }
}

export const EASE = {
  out: bezier(0.2, 0.8, 0.2, 1), // DESIGN.md's path curve
  outExpo: bezier(0.16, 1, 0.3, 1),
  inOut: bezier(0.65, 0, 0.35, 1), // camera travels: a firm start, a long settle
  in: bezier(0.5, 0, 0.75, 0),
  linear: p => p,
}

// Progress 0→1 of a spring released at `start`; overshoots when underdamped, settles at 1.
export function spring(t, start, { stiffness = 300, damping = 30, mass = 1 } = {}) {
  const s = t - start
  if (s <= 0) return 0
  const w0 = Math.sqrt(stiffness / mass)
  const zeta = damping / (2 * Math.sqrt(stiffness * mass))
  if (zeta < 1) {
    const wd = w0 * Math.sqrt(1 - zeta * zeta)
    return 1 - Math.exp(-zeta * w0 * s) * (Math.cos(wd * s) + (zeta * w0 / wd) * Math.sin(wd * s))
  }
  if (zeta === 1) return 1 - Math.exp(-w0 * s) * (1 + w0 * s)
  const r1 = -w0 * (zeta - Math.sqrt(zeta * zeta - 1)), r2 = -w0 * (zeta + Math.sqrt(zeta * zeta - 1))
  const c2 = r1 / (r1 - r2), c1 = 1 - c2
  return 1 - (c1 * Math.exp(r1 * s) + c2 * Math.exp(r2 * s))
}

export const SPRING = {
  snappy: { stiffness: 520, damping: 34 },
  smooth: { stiffness: 260, damping: 30 },
  soft: { stiffness: 140, damping: 22 },
  pop: { stiffness: 420, damping: 20 }, // the crab's own moves: a little life, never a wobble
}

// Enter: opacity, a short rise and a blur that resolves (materialize). Exit is quieter: smaller, faster.
export function presence(t, enter, exit = Infinity, { rise = 14, blur = 8, spr = SPRING.smooth, out = 0.22 } = {}) {
  const pIn = spring(t, enter, spr)
  const pOut = exit === Infinity ? 0 : EASE.in(seg(t, exit, exit + out))
  const shown = clamp(pIn) * (1 - pOut)
  return {
    opacity: shown,
    y: (1 - pIn) * rise - pOut * rise * 0.5,
    blur: (1 - clamp(pIn)) * blur + pOut * blur * 0.6,
    p: pIn,
  }
}

export const presenceStyle = (el, s, extra = '') => {
  el.style.opacity = s.opacity.toFixed(4)
  el.style.transform = `translateY(${s.y.toFixed(2)}px) ${extra}`
  el.style.filter = s.blur > 0.05 ? `blur(${s.blur.toFixed(2)}px)` : 'none'
}

// Keyframed value: [{t, v}] with an ease per segment (the ease of the key the segment arrives at).
export function track(keys, t, ease = EASE.inOut) {
  if (t <= keys[0].t) return keys[0].v
  for (let i = 1; i < keys.length; i++) {
    const a = keys[i - 1], b = keys[i]
    if (t <= b.t) return lerp(a.v, b.v, (b.ease ?? ease)((t - a.t) / (b.t - a.t)))
  }
  return keys[keys.length - 1].v
}

// Smooth value noise for a hand-held drift: deterministic, so a frame is the same on every render.
const hash = n => { const s = Math.sin(n * 127.1) * 43758.5453; return s - Math.floor(s) }
export function noise(t, seed = 0) {
  const i = Math.floor(t), f = t - i
  const u = f * f * (3 - 2 * f)
  return lerp(hash(i + seed * 31.7), hash(i + 1 + seed * 31.7), u) * 2 - 1
}

// A count that eases between keyed values: live counters in panes.
export const count = (keys, t) => track(keys, t, EASE.out)
