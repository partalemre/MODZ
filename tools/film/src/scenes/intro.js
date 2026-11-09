// Cold open: scattered pixels fall into the agent, then it bolts, shedding tool calls faster than anyone could read.
import { CRABS } from '../assets.gen.js'
import { T } from '../layout.js'
import { clamp, EASE, presence, seg, spring, SPRING } from '../motion.js'
import { place } from '../ui.js'

export const INTRO = { x: 0, y: 90, s: 6 }

// The hero sprite as unit cells, so each pixel can arrive on its own.
function cellsOf(svg) {
  const doc = new DOMParser().parseFromString(`<svg xmlns="http://www.w3.org/2000/svg">${svg}</svg>`, 'image/svg+xml')
  return [...doc.querySelectorAll('rect')].flatMap(r => {
    const [x, y, w, h] = ['x', 'y', 'width', 'height'].map(k => Number(r.getAttribute(k)))
    const out = []
    for (let i = 0; i < w; i++) for (let j = 0; j < h; j++) out.push({ x: x + i, y: y + j, fill: r.getAttribute('fill') })
    return out
  })
}

const rand = n => { const s = Math.sin(n * 91.345) * 47453.5453; return s - Math.floor(s) }

const CHIPS = [
  { at: 4.05, html: '<b>Read</b> src/checkout/session.ts' },
  { at: 4.3, html: '<b>Grep</b> "chargeCard("' },
  { at: 4.55, html: '<b>Edit</b> payment.ts <span class="add">+38</span> <span class="del">−12</span>' },
  { at: 4.8, html: '<b>Read</b> src/api/client.ts' },
  { at: 5.05, html: '<b>Bash</b> npm test' },
  { at: 5.3, html: '<b>Edit</b> session.ts <span class="add">+4</span> <span class="del">−2</span>' },
  { at: 5.55, html: '<b>Task</b> 3 agents' },
]

export function build(ctx) {
  const cells = cellsOf(CRABS.hero)
  const { x, y, s } = INTRO
  const rects = cells.map((c, i) => `<rect data-i="${i}" x="${c.x}" y="${c.y}" width="1" height="1" fill="${c.fill}"/>`).join('')
  const swarm = place(`<svg width="${30 * s}" height="${28 * s}" viewBox="0 0 30 28" shape-rendering="crispEdges" style="overflow:visible">${rects}</svg>`,
    { x: x - 15 * s, y: y - 28 * s })
  const els = [...swarm.querySelectorAll('rect')]
  const from = cells.map((c, i) => ({ dx: (rand(i) - 0.5) * 120, dy: -40 - rand(i + 7) * 70, r: (rand(i + 3) - 0.5) * 180 }))
  const chips = CHIPS.map(c => ({ ...c, el: place(`<div class="chip">${c.html}</div>`, { x: 0, y: 0 }) }))

  function update(t) {
    // Pixels land bottom row first, so the crab is built up like a sprite drawn on the grid.
    const isSwarm = t < T.assemble + 1.6
    swarm.style.display = isSwarm ? '' : 'none'
    if (isSwarm) {
      els.forEach((el, i) => {
        const c = cells[i], f = from[i]
        const start = T.assemble + (27 - c.y) * 0.03 + rand(i + 11) * 0.25
        const p = spring(t, start, SPRING.smooth), q = clamp(p, 0, 1.2)
        el.setAttribute('x', (c.x + f.dx * (1 - q)).toFixed(3))
        el.setAttribute('y', (c.y + f.dy * (1 - q)).toFixed(3))
        el.setAttribute('opacity', clamp(seg(t, start, start + 0.15)).toFixed(3))
        el.setAttribute('transform', `rotate(${(f.r * (1 - clamp(p))).toFixed(2)} ${c.x + 0.5} ${c.y + 0.5})`)
      })
    }
    ctx.heroVisible = !isSwarm
    // Tool calls fly off the running agent: each pops from where it was, drifts back and fades out.
    for (const c of chips) {
      const isLive = t > c.at - 0.05 && t < c.at + 1.4
      c.el.style.display = isLive ? '' : 'none'
      if (!isLive) continue
      const at = ctx.path.at(c.at)
      const life = seg(t, c.at, c.at + 1.35)
      const s1 = presence(t, c.at, c.at + 0.85, { rise: 0, blur: 6, out: 0.45 })
      const drift = EASE.out(life)
      c.el.style.left = `${at.x - 60 - drift * 160}px`
      c.el.style.top = `${at.y - 150 - drift * 90 - (c.at * 37 % 3) * 40}px`
      c.el.style.opacity = s1.opacity.toFixed(3)
      c.el.style.transform = `scale(${(0.92 + 0.08 * clamp(s1.p)).toFixed(3)})`
      c.el.style.filter = s1.blur > 0.05 ? `blur(${s1.blur.toFixed(2)}px)` : 'none'
    }
  }
  return { update }
}
