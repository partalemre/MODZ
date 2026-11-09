// One camera for the whole film: it never cuts. Keys hold where it looks (x, y), how close (z) and a tilt; between
// keys it travels on a firm ease, leans into its own motion like a hand-held rig, and drifts a little when it rests.
import { EASE, lerp, noise, clamp } from './motion.js'

const SIZE = { w: 1920, h: 1080 }

function sample(keys, t) {
  if (t <= keys[0].t) return { ...keys[0] }
  for (let i = 1; i < keys.length; i++) {
    const a = keys[i - 1], b = keys[i]
    if (t > b.t) continue
    const p = (b.ease ?? EASE.inOut)((t - a.t) / (b.t - a.t))
    // Zoom travels in log space, so a dive in or out keeps a steady feel of speed.
    const z = Math.exp(lerp(Math.log(a.z), Math.log(b.z), p))
    return { x: lerp(a.x, b.x, p), y: lerp(a.y, b.y, p), z, rx: lerp(a.rx ?? 0, b.rx ?? 0, p), ry: lerp(a.ry ?? 0, b.ry ?? 0, p), rz: lerp(a.rz ?? 0, b.rz ?? 0, p) }
  }
  return { ...keys[keys.length - 1] }
}

export function makeCamera(keys, follow) {
  const at = t => {
    const c = sample(keys, t)
    const f = follow?.(t)
    if (f) { c.x = lerp(c.x, f.x, f.w); c.y = lerp(c.y, f.y, f.w) }
    return c
  }
  return {
    at,
    apply(t, worldEl) {
      const c = at(t), dt = 1 / 60
      const n = at(t + dt), p = at(t - dt)
      // Screen-space speed: world px per second times zoom.
      const vx = (n.x - p.x) / (2 * dt) * c.z, vy = (n.y - p.y) / (2 * dt) * c.z
      const lean = { y: clamp(-vx / 260, -7, 7), x: clamp(vy / 260, -6, 6) }
      const still = 1 - clamp((Math.abs(vx) + Math.abs(vy)) / 400)
      const drift = { x: noise(t * 0.35, 1) * 5 * still, y: noise(t * 0.3, 2) * 4 * still, r: noise(t * 0.25, 3) * 0.25 * still }
      const rx = (c.rx ?? 0) + lean.x, ry = (c.ry ?? 0) + lean.y, rz = (c.rz ?? 0) + drift.r
      worldEl.style.transform =
        `translate(${SIZE.w / 2 + drift.x}px, ${SIZE.h / 2 + drift.y}px) rotateX(${rx.toFixed(3)}deg) rotateY(${ry.toFixed(3)}deg) ` +
        `rotateZ(${rz.toFixed(3)}deg) scale(${c.z.toFixed(5)}) translate(${(-c.x).toFixed(3)}px, ${(-c.y).toFixed(3)}px)`
      return c
    },
  }
}
