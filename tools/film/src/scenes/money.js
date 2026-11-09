// hud-pro, session-budget and cache-tax: the limits and the cost in plain numbers, and a break that does not cost a cold
// cache. The agent naps on the cache card while it stays warm.
import { BUDGET, CACHE, HUD, T } from '../layout.js'
import { count, presence, presenceStyle, seg } from '../motion.js'
import { $, $$, icon, meter, place, setMeter, setText } from '../ui.js'

const COLS = [
  { k: '5 hours', from: 52, to: 64, note: 'resets in 1h 58m', notch: 0.58 },
  { k: '7 days', from: 38, to: 41, note: 'on pace: 44%', notch: 0.44 },
  { k: 'Context', from: 51, to: 64, note: '72k tokens free', notch: 0 },
]
const PARTS = [['Messages', 46, 'var(--mid)'], ['System tools', 18, 'var(--lo)'], ['MCP tools', 9, 'var(--line-strong)'], ['Memory files', 4, 'var(--track)']]

const hudHtml = () => `<div class="pane" style="width:${HUD.w}px;height:${HUD.h}px">
  <div style="display:flex;align-items:center;gap:10px"><span class="dot"></span><span class="h2" style="font-size:20px">Limits</span><span class="meta" style="margin-left:auto">hud-pro · one line in the terminal, this pane on desktop</span></div>
  <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:28px;margin-top:20px">
  ${COLS.map(c => `<div class="col"><div class="meta">${c.k}</div><div class="v num" style="font:650 32px var(--mono);color:var(--hi);margin:2px 0 10px">0%</div>
    <div style="position:relative">${meter('m', 'var(--mid)', 6)}${c.notch ? `<span style="position:absolute;left:${c.notch * 100}%;top:-3px;width:1.5px;height:12px;background:var(--mid)"></span>` : ''}</div>
    <div class="meta" style="margin-top:8px">${c.note}</div></div>`).join('')}</div>
  <div class="lbl" style="margin-top:24px">What fills the context</div>
  <div style="display:flex;gap:3px;margin-top:8px;height:8px">${PARTS.map(([, n, c]) => `<span style="flex:${n};background:${c};border-radius:2px"></span>`).join('')}<span style="flex:51"></span></div>
  <div class="meta" style="display:flex;gap:18px;margin-top:8px">${PARTS.map(([a, n]) => `<span>${a} ${n}k</span>`).join('')}<span style="margin-left:auto;color:var(--mid)">~6 turns left</span></div></div>`

const budgetHtml = () => `<div class="card" style="width:${BUDGET.w}px;padding:18px 22px;display:flex;align-items:center;gap:14px;box-shadow:0 24px 50px -20px rgba(0,0,0,.7)">
  <span style="color:var(--warn)">${icon('gauge', 20)}</span><span class="title" style="font-size:16px">Budget <span class="bp num">0%</span></span>
  <span class="num bv" style="color:var(--mid);font-size:14px"></span>
  <div style="flex:1;position:relative">${meter('bm', 'var(--warn)', 6)}<span style="position:absolute;left:80%;top:-3px;width:1.5px;height:12px;background:var(--mid)"></span></div>
  <span class="meta">asks before $5.00</span></div>`

const cacheHtml = () => `<div class="pane" style="width:${CACHE.w}px;height:${CACHE.h}px">
  <div style="display:flex;align-items:center;gap:10px"><span class="dot" style="background:var(--ok)"></span><span class="h2" style="font-size:20px">The cache stays warm</span>
    <span class="meta away num" style="margin-left:auto"></span></div>
  <div style="color:var(--mid);font-size:15px;margin-top:10px">A small refresh reads it every 4 minutes while you are away.</div>
  <div class="meta" style="margin-top:8px;font-size:13.5px">Without it, your next message would rewrite 182k tokens: about $0.52.</div>
  <div class="meta" style="margin-top:14px">keep warm: <span class="left num">1h 52m</span> left · /keepwarm off stops it</div></div>`

export function build() {
  const hud = place(hudHtml(), HUD), budget = place(budgetHtml(), BUDGET), cache = place(cacheHtml(), CACHE)
  const cols = $$(hud, '.col')

  function update(t) {
    const isShown = t > T.toMoney - 0.8 && t < T.toPeople + 1
    hud.style.visibility = budget.style.visibility = cache.style.visibility = isShown ? 'visible' : 'hidden'
    presenceStyle(hud.firstElementChild, presence(t, T.toMoney + 0.1, Infinity, { rise: 30, blur: 10 }))
    cols.forEach((el, i) => {
      const c = COLS[i]
      const v = count([{ t: T.toMoney + 0.85 + i * 0.12, v: 0 }, { t: T.toMoney + 1.8 + i * 0.12, v: c.from }, { t: T.budget + 1.5, v: c.to }], t)
      setText($(el, '.v'), `${Math.round(v)}%`)
      setMeter($(el, '.m'), v / 100)
      $(el, '.m b').style.background = c.notch && v / 100 > c.notch + 0.1 ? 'var(--warn)' : 'var(--mid)'
    })
    presenceStyle(budget.firstElementChild, presence(t, T.budget - 0.3, Infinity, { rise: 24, blur: 8 }))
    const b = count([{ t: T.budget - 0.2, v: 0.62 }, { t: T.budget + 0.9, v: 0.8 }], t)
    setText($(budget, '.bp'), `${Math.round(b * 100)}%`)
    setText($(budget, '.bv'), `$${(b * 5).toFixed(2)} / $5.00`)
    setMeter($(budget, '.bm'), b)
    presenceStyle(cache.firstElementChild, presence(t, T.nap - 0.6, Infinity, { rise: 24, blur: 8 }))
    const away = Math.max(0, (t - T.nap) * 70)
    setText($(cache, '.away'), `away ${Math.floor(away / 60)}m ${String(Math.floor(away % 60)).padStart(2, '0')}s`)
    setText($(cache, '.left'), `1h ${52 - Math.floor(seg(t, T.nap, T.wake) * 3)}m`)
  }
  return { update, anchors: { napAt: { x: CACHE.x + CACHE.w - 70, y: CACHE.y - 2 }, hudAt: { x: HUD.x + 210, y: HUD.y - 1 } } }
}
