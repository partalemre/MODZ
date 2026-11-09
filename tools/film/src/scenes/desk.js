// Claude Code's desktop window: a prompt, tool calls landing one by one as the agent makes them, then the MODZ
// panel opening beside the chat with one live line per mod.
import { DESK, T } from '../layout.js'
import { EASE, count, presence, presenceStyle, seg, spring, SPRING } from '../motion.js'
import { $, $$, glyph, place, setText, word } from '../ui.js'

const COL = 66 // transcript left edge inside the window
const ROW0 = 214, ROW_GAP = 62 // first tool row baseline, spacing
const PANEL_W = 420
const ROWS = [
  { tool: 'Read', arg: 'src/checkout/session.ts', dot: 'var(--read)' },
  { tool: 'Edit', arg: 'src/checkout/payment.ts', dot: 'var(--edit)', diff: ['+38', '−12'] },
  { tool: 'Task', arg: '3 agents · checkout migration', dot: 'var(--run)' },
  { tool: 'Bash', arg: 'npm test -- payments', dot: 'var(--warn)' },
]
export const ROW_TIMES = [T.land + 0.2, T.land + 0.95, T.land + 1.7, T.land + 2.45]

const HUB = [
  { group: 'Work' },
  { name: 'Agents', glyph: 'sparkle', key: 'agents' },
  { name: 'Files', glyph: 'folder', key: 'files' },
  { name: 'Plan', glyph: 'list', key: 'plan' },
  { group: 'Safety' },
  { name: 'Tests', glyph: 'check', key: 'tests' },
  { name: 'Checkpoints', glyph: 'bookmark', key: 'ckpt' },
  { name: 'Replay', glyph: 'rewind', key: 'replay' },
  { group: 'Meters & settings' },
  { name: 'Usage', glyph: 'gauge', key: 'usage' },
  { name: 'Look', glyph: 'eye', key: 'look' },
  { name: 'Mods', glyph: 'cube', key: 'mods' },
]

const rowHtml = (r, i) => `<div class="trow" data-i="${i}" style="position:absolute;left:${COL + 44}px;top:${ROW0 + i * ROW_GAP - 24}px;display:flex;gap:12px;align-items:baseline;font:17px var(--mono);color:var(--mid)">
  <b style="font:650 17px var(--mono);color:var(--hi)">${r.tool}</b><span class="arg">${r.arg}</span>
  ${r.diff ? `<span style="margin-left:150px"><span class="add">${r.diff[0]}</span> <span class="del">${r.diff[1]}</span></span>` : ''}</div>`

const hubHtml = () => HUB.map(h => (h.group
  ? `<div class="lbl" style="margin:16px 0 6px">${h.group}</div>`
  : `<div class="hrow" data-k="${h.key}" style="position:relative;display:flex;align-items:center;gap:12px;height:44px;padding:0 10px;margin:0 -10px;border-radius:8px">
      <span class="g" style="width:22px;display:flex;justify-content:center;color:var(--mid)">${glyph(h.glyph, 2.6, 3.2)}</span>
      <span class="row-t" style="font-size:14px">${h.name}</span>
      <span class="st meta" style="margin-left:auto;display:flex;align-items:center;gap:8px;font-size:13px"></span>
      <span style="color:var(--lo);font-size:15px">›</span></div>`)).join('')

export function build() {
  const body = `
  <div class="bubble card" style="position:absolute;right:${PANEL_W + 70}px;top:80px;padding:14px 20px;font:17px var(--sans);color:var(--hi);border-radius:14px">Move checkout to the new payments API, with tests.</div>
  ${ROWS.map(rowHtml).join('')}
  <div class="spin" style="position:absolute;left:${COL}px;top:${ROW0 + 4 * ROW_GAP + 20}px;font:16px var(--mono);color:var(--edit)">✻ Working… <span style="color:var(--lo)">(<span class="sec">0s</span> · ↓ <span class="tok">0</span> tokens)</span></div>
  <div class="card" style="position:absolute;left:44px;right:${PANEL_W + 44}px;bottom:30px;height:56px;padding:17px 20px;color:var(--lo);font-size:16px;border-radius:12px">Reply to Claude…</div>
  <div class="hub" style="position:absolute;top:38px;right:0;bottom:0;width:${PANEL_W}px;background:var(--sheet);border-left:1px solid var(--line);padding:22px 26px">
    <div style="display:flex;align-items:center;color:var(--hi)">${word('MODZ', 2.6, 3.4, 7)}<span class="meta" style="margin-left:auto">22 mods</span></div>
    ${hubHtml()}
  </div>`
  const root = place(`<div class="win" style="width:${DESK.w}px;height:${DESK.h}px"><div class="bar"><i></i><i></i><i></i><span class="t">atlas-web — Claude Code</span></div>${body}</div>`, DESK)
  const rows = $$(root, '.trow'), hub = $(root, '.hub'), bubble = $(root, '.bubble'), spin = $(root, '.spin')
  const st = Object.fromEntries($$(root, '.hrow').map(r => [r.dataset.k, r]))

  const status = (k, html) => { const el = st[k].querySelector('.st'); if (el.innerHTML !== html) el.innerHTML = html }
  const live = text => `<span class="dot"></span><span style="color:var(--mid)">${text}</span>`

  function update(t) {
    root.style.visibility = t > T.dash - 1 && t < T.toShip ? 'visible' : 'hidden'
    presenceStyle(bubble, presence(t, T.land - 0.4, Infinity, { rise: 10 }))
    rows.forEach((r, i) => {
      const s = presence(t, ROW_TIMES[i], Infinity, { rise: 8, blur: 6 })
      presenceStyle(r, s)
      const reveal = EASE.out(seg(t, ROW_TIMES[i], ROW_TIMES[i] + 0.45))
      r.style.clipPath = `inset(-8px ${(1 - reveal) * 100}% -8px 0)`
    })
    presenceStyle(spin, presence(t, ROW_TIMES[0], Infinity, { rise: 6 }))
    setText($(spin, '.sec'), `${Math.floor(98 + Math.max(0, t - T.land) * 1.5)}s`.replace(/^(\d+)s$/, (_, s) => (s >= 60 ? `${Math.floor(s / 60)}m ${s % 60}s` : `${s}s`)))
    setText($(spin, '.tok'), `${count([{ t: T.land, v: 9.2 }, { t: T.toAgents, v: 18.4 }, { t: T.ping, v: 26.1 }], t).toFixed(1)}k`)

    // The panel slides in from the window's edge and its rows come up one after another.
    const open = spring(t, T.panelOpen, SPRING.smooth)
    hub.style.transform = `translateX(${(1 - open) * (PANEL_W + 10)}px)`
    $$(hub, '.hrow, .lbl').forEach((el, i) => presenceStyle(el, presence(t, T.panelOpen + 0.18 + i * 0.035, Infinity, { rise: 8, blur: 4 })))
    const files = Math.round(count([{ t: ROW_TIMES[1], v: 1 }, { t: T.toAgents, v: 4 }], t))
    status('agents', t > ROW_TIMES[2] ? live(t > T.agentsDone ? '3 done' : '3 running') : 'quiet')
    status('files', live(`${files} changed`))
    status('plan', `${Math.round(count([{ t: T.panelOpen, v: 2 }, { t: T.toAgents, v: 3 }], t))} of 6 steps`)
    status('tests', t > T.tests + 1.8 ? '<span style="color:var(--ok)">42/42 passed</span>' : 'last run 41m ago')
    status('ckpt', `${t > T.toAgents ? 13 : 12} saved · just now`)
    status('replay', '4 edits')
    status('usage', `5h ${Math.round(count([{ t: T.panelOpen, v: 41 }, { t: T.toAgents, v: 44 }], t))}% · 7d 12%`)
    status('look', 'tidemark')
    status('mods', '22 on')
    // The row the agent walks onto: a hover wash, then the press.
    const wash = seg(t, T.press - 0.6, T.press - 0.3) * (1 - seg(t, T.paneOpen + 0.5, T.paneOpen + 0.9))
    st.agents.style.background = `rgba(240,238,232,${(0.06 * wash).toFixed(3)})`
    const press = spring(t, T.press, SPRING.snappy) * (1 - seg(t, T.press + 0.12, T.press + 0.3))
    st.agents.style.transform = `scale(${1 - 0.02 * press})`
  }

  // World anchors for the crab and camera: computed from the layout, not from the camera-moved screen.
  const off = el => { let x = 0, y = 0; for (let e = el; e && e !== root; e = e.offsetParent) { x += e.offsetLeft; y += e.offsetTop } return { x: DESK.x + x, y: DESK.y + y } }
  const rowAt = i => ({ x: DESK.x + COL + 16, y: DESK.y + ROW0 + i * ROW_GAP + 4 })
  const a = off(st.agents)
  return { update, anchors: { rowAt, agentsRow: { ...a, w: st.agents.offsetWidth, h: st.agents.offsetHeight }, hub: off(hub) } }
}
