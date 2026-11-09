// savvy-progress's Agents pane, opened from the hub row: the job, its cost and time, and each agent's own progress.
// The hero crab walks into its own row; when all three finish, done-ping's band says so.
import { AGENTS as A, T } from '../layout.js'
import { clamp, count, EASE, lerp, presence, presenceStyle, seg, spring, SPRING } from '../motion.js'
import { makeCrab } from '../crab.js'
import { $, $$, clock, icon, kTokens, meter, money, place, setMeter, setText } from '../ui.js'

const RUN = { from: T.paneOpen + 0.4, to: T.agentsDone }
const AGENT_ROWS = [
  { name: 'Pip', task: 'Build the checkout page', model: 'Opus 5.5', crab: 'hero', end: T.agentsDone - 0.1, tools: 14 },
  { name: 'Mako', task: 'Write payment tests', model: 'Sonnet 5.5', crab: 'light', end: T.agentsDone - 1.3, tools: 9 },
  { name: 'Juno', task: 'Review the payments module', model: 'Haiku 5.5', crab: 'medium', end: T.agentsDone - 2.4, tools: 6 },
]
const ROW_TOP = 236, ROW_H = 104

const rowHtml = (r, i) => `<div class="arow" style="position:absolute;left:20px;right:20px;top:${ROW_TOP + i * ROW_H}px;height:${ROW_H - 12}px">
  <div class="slot" style="position:absolute;left:0;top:6px;width:54px;height:50px"></div>
  <div style="position:absolute;left:66px;right:0;top:6px;display:flex;align-items:baseline;gap:10px">
    <span class="title">${r.name}</span><span style="color:var(--mid);font-size:14px">${r.task}</span>
    <span class="pill num" style="margin-left:auto;font:600 12px var(--sans);padding:3px 9px;border-radius:10px;background:var(--track)"></span></div>
  <div style="position:absolute;left:66px;right:0;top:40px">${meter('m', 'var(--run)', 5)}</div>
  <div class="meta det" style="position:absolute;left:66px;top:56px"></div></div>`

export function build(ctx) {
  const html = `<div class="pane" style="width:${A.w}px;height:${A.h}px;padding:0"><div class="in" style="position:absolute;inset:0">
    <div class="card" style="position:absolute;left:20px;right:20px;top:20px;height:180px;padding:18px 20px">
      <div class="lbl" style="display:flex;gap:8px">Agents <span style="color:var(--lo);font-weight:500">· 3 at work</span></div>
      <div style="display:flex;align-items:baseline;margin-top:6px"><span class="h1">Checkout migration</span>
        <span class="pct num" style="margin-left:auto;font:650 34px var(--mono);color:var(--hi)">0%</span></div>
      <div style="margin-top:12px">${meter('job', 'var(--hi)', 6)}</div>
      <div style="display:flex;gap:56px;margin-top:16px">
        ${['Cost', 'Tokens', 'Time'].map(k => `<div><div class="meta">${k}</div><div class="v-${k} num" style="font:600 18px var(--mono);color:var(--hi)">—</div></div>`).join('')}
      </div></div>
    ${AGENT_ROWS.map(rowHtml).join('')}
  </div></div>`
  const root = place(html, A)
  const pane = root.firstElementChild, inner = $(root, '.in')
  const rows = $$(root, '.arow').map((el, i) => ({ el, ...AGENT_ROWS[i], m: $(el, '.m'), pill: $(el, '.pill'), det: $(el, '.det') }))
  // The other two crabs live in their rows; the hero arrives along the film's own path.
  for (const r of rows.slice(1)) r.rig = makeCrab($(r.el, '.slot'), r.crab)
  const band = place(`<div class="card" style="display:flex;align-items:center;gap:12px;padding:12px 16px;width:${A.w - 40}px;font-size:14px;box-shadow:0 18px 40px -16px rgba(0,0,0,.7)">
    <span style="color:var(--hi)">${icon('bell', 18)}</span><b style="color:var(--hi)">Turn done</b>
    <span style="color:var(--mid)">tests passed · 3 files changed · 2m 21s</span></div>`, { x: A.x + 20, y: A.y - 26 })

  function update(t) {
    root.style.visibility = t > T.paneOpen - 0.1 && t < T.toBlast + 1 ? 'visible' : 'hidden'
    band.style.visibility = root.style.visibility
    // Opens out of the hub row: the pane starts as that row's box and grows to its own.
    const r = ctx.anchors.agentsRow
    const p = spring(t, T.paneOpen, SPRING.smooth), q = clamp(p, 0, 1.05)
    const sx = lerp(r.w / A.w, 1, q), sy = lerp(r.h / A.h, 1, q)
    pane.style.transformOrigin = '0 0'
    pane.style.transform = `translate(${lerp(r.x - A.x, 0, q)}px, ${lerp(r.y - A.y, 0, q)}px) scale(${sx}, ${sy})`
    inner.style.opacity = EASE.out(seg(t, T.paneOpen + 0.18, T.paneOpen + 0.5)).toFixed(3)

    const job = count([{ t: RUN.from, v: 0.08 }, { t: RUN.from + 2, v: 0.45 }, { t: RUN.to - 1, v: 0.86 }, { t: RUN.to, v: 1 }], t)
    setText($(root, '.pct'), `${Math.round(job * 100)}%`)
    setMeter($(root, '.job'), job)
    setText($(root, '.v-Cost'), `≈${money(count([{ t: RUN.from, v: 1.12 }, { t: RUN.to, v: 1.77 }], t))}`)
    setText($(root, '.v-Tokens'), kTokens(count([{ t: RUN.from, v: 288000 }, { t: RUN.to, v: 430000 }], t)))
    setText($(root, '.v-Time'), clock(lerp(98, 141, seg(t, RUN.from, RUN.to))))

    rows.forEach((row, i) => {
      presenceStyle(row.el, presence(t, T.paneOpen + 0.35 + i * 0.07, Infinity, { rise: 10, blur: 5 }))
      const pr = count([{ t: RUN.from, v: 0.1 + i * 0.05 }, { t: row.end, v: 1 }], t)
      const isDone = t >= row.end
      setMeter(row.m, pr)
      row.m.querySelector('b').style.background = isDone ? 'var(--ok)' : 'var(--run)'
      row.pill.style.color = isDone ? 'var(--ok)' : 'var(--run)'
      setText(row.pill, isDone ? 'done' : `${Math.round(pr * 100)}%`)
      const tools = Math.round(lerp(2, row.tools, seg(t, RUN.from, row.end)))
      setText(row.det, `${tools} tools · ${clock(lerp(20, 140 - i * 30, seg(t, RUN.from, row.end)))} · ≈${money(lerp(0.05, 0.62 - i * 0.18, seg(t, RUN.from, row.end)))} · ${row.model}`)
      // Working crabs walk in place; a finished one stops and lifts a claw.
      row.rig?.pose({ x: 27, y: 46, s: 1.6, walk: isDone ? 0 : (t - RUN.from) * 18, vx: isDone ? 0 : 1, mood: isDone ? 'happy' : undefined })
    })
    const b = presence(t, T.ping, T.toPlan + 0.4, { rise: -18, blur: 6 })
    presenceStyle(band, b)
  }

  const slot = { x: A.x + 20 + 27, y: A.y + ROW_TOP + 6 + 46 }
  return { update, anchors: { pipSlot: slot } }
}
