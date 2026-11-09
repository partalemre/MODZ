// The agent: savvy-progress's own crab, walked through the whole film. Its legs step by the distance it covers, not by
// the clock, so its feet never slide; a hop is a parabola with a squash on take-off and landing.
import { CRABS } from './assets.gen.js'
import { EASE, clamp, lerp, spring, SPRING } from './motion.js'

const W = 30, H = 28

// Keys: { t, x, y, s?, hop? }. Position eases between keys; `hop` lifts the segment arriving at that key.
export function path(keys) {
  // Which way it faces, from the keys alone: the way it last moved, unless a key says otherwise.
  const faces = keys.map(() => 1)
  for (let i = 1; i < keys.length; i++) faces[i] = keys[i].face ?? (Math.sign(keys[i].x - keys[i - 1].x) || faces[i - 1])
  const at = t => {
    if (t <= keys[0].t) return { ...keys[0], s: keys[0].s ?? 3, lift: 0, k: 0, face: faces[0] }
    for (let i = 1; i < keys.length; i++) {
      const a = keys[i - 1], b = keys[i]
      if (t > b.t) continue
      const raw = (t - a.t) / (b.t - a.t)
      const p = (b.ease ?? EASE.inOut)(raw)
      const sa = a.s ?? 3, sb = b.s ?? sa
      return { x: lerp(a.x, b.x, p), y: lerp(a.y, b.y, p), s: lerp(sa, sb, p), lift: b.hop ? 4 * b.hop * raw * (1 - raw) : 0, k: i, raw, hop: b.hop, face: faces[i] }
    }
    const last = keys[keys.length - 1]
    return { ...last, s: last.s ?? 3, lift: 0, k: keys.length, face: faces[keys.length - 1] }
  }
  // Distance walked by t, on the ground only (hops do not move the legs): a table at 240 Hz.
  const end = keys[keys.length - 1].t + 1, step = 1 / 240, table = [0]
  let prev = at(0)
  for (let t = step; t <= end; t += step) {
    const cur = at(t)
    const ground = cur.lift > 0 ? 0 : Math.hypot(cur.x - prev.x, cur.y - prev.y) / cur.s
    table.push(table[table.length - 1] + ground)
    prev = cur
  }
  const dist = t => table[clamp(Math.round(t / step), 0, table.length - 1)]
  return { at, dist, keys }
}

export function makeCrab(parent, key = 'hero') {
  const el = document.createElement('div')
  el.className = 'crab'
  el.innerHTML = `<div class="shadow"></div><div class="body"></div>`
  parent.appendChild(el)
  const body = el.querySelector('.body'), shade = el.querySelector('.shadow')
  let sprite = '', facing = 1, legs = null

  const setSprite = k => {
    if (k === sprite) return
    sprite = k
    body.innerHTML = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" shape-rendering="crispEdges">${CRABS[k]}</svg>`
    legs = { a: body.querySelector('.la'), b: body.querySelector('.lb'), bd: body.querySelector('.bd') }
  }
  setSprite(key)

  // x, y: the point between its feet in world px; s: px per sprite pixel; walk: distance in sprite px.
  function pose({ x, y, s = 3, walk = 0, lift = 0, squash = 0, mood, vx = 0, opacity = 1, tilt = 0, face, hue = 0, idle }) {
    setSprite(mood && CRABS[`${key}-${mood}`] ? `${key}-${mood}` : key)
    if (face) facing = face
    else if (vx > 0.5) facing = 1
    else if (vx < -0.5) facing = -1
    const phase = Math.floor(walk / 3)
    const isMoving = Math.abs(vx) > 0.5
    legs.a.style.transform = isMoving && phase % 2 === 0 ? 'translateY(-1px)' : ''
    legs.b.style.transform = isMoving && phase % 2 === 1 ? 'translateY(-1px)' : ''
    // Standing, it breathes: the body dips a pixel on a slow beat, the sprite's own step motion.
    const isDip = isMoving ? Math.floor(walk / 1.5) % 2 === 1 : idle !== undefined && Math.floor(idle * 1.4) % 2 === 1
    legs.bd.style.transform = isDip ? 'translateY(1px)' : ''
    const sx = 1 + squash, sy = 1 - squash
    body.style.transform = `translate(${-W / 2}px, ${-H - lift / s}px) scale(${facing * sx}, ${sy}) rotate(${tilt}deg)`
    body.style.transformOrigin = `${W / 2}px ${H}px`
    el.style.transform = `translate(${x}px, ${y}px) scale(${s})`
    el.style.opacity = opacity
    body.style.filter = hue ? `hue-rotate(${hue}deg)` : ''
    const shadowScale = 1 - clamp(lift / (s * 60)) * 0.5
    Object.assign(shade.style, { left: `${-11 * shadowScale}px`, top: '-2.5px', width: `${22 * shadowScale}px`, height: '4px', opacity: 0.8 * shadowScale })
  }
  return { el, pose }
}

// Squash and stretch around a hop segment: stretch going up, squash on landing, settled by a spring.
export function hopSquash(seg, t, landT) {
  if (seg.hop && seg.raw < 1) return seg.raw < 0.5 ? -0.08 : 0.04
  const since = t - landT
  if (since < 0 || since > 0.6) return 0
  return 0.16 * (1 - spring(t, landT, SPRING.pop)) * Math.exp(-since * 4)
}
