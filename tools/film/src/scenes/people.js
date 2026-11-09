// For anyone, coder or not: every project on one board (projects), a handoff note carried to a fresh chat before the
// context fills (handoff), and the look switched live (skins).
import { HANDOFF, PROJ, SKINS, T } from '../layout.js'
import { EASE, clamp, count, lerp, presence, presenceStyle, seg, spring, SPRING } from '../motion.js'
import { $, $$, btn, icon, meter, place, setMeter, setText } from '../ui.js'

const PROJECTS = [
  ['thesis', '4 d ago', 0.24], ['wedding-site', '3 h ago', 0.62], ['shop', 'live', 0.88],
  ['mobile-app', '1 d ago', 0.95], ['budget-sheet', '31 d ago', 1], ['atlas-web', 'live', 0.71],
]
export const NEWCHAT = { x: 9300, y: 120, w: 620, h: 300 }
const SKIN_SET = [
  { name: 'tidemark', label: 'Tidemark', read: '#7FB6E8', write: '#E58A5F', run: '#E9B949', fg: '#F0EEE8', muted: '#8E8A80', surface: '#1F1F1C', hue: 0 },
  { name: 'tokyo-night', label: 'Tokyo Night', read: '#7dcfff', write: '#ff9e64', run: '#e0af68', fg: '#c0caf5', muted: '#737aa2', surface: '#1f2335', hue: 200 },
  { name: 'gruvbox', label: 'Gruvbox', read: '#83a598', write: '#fe8019', run: '#b8bb26', fg: '#ebdbb2', muted: '#928374', surface: '#32302f', hue: 55 },
]
const TOOLS = [['Read', 'read', 'docs/protocols.md', ''], ['Edit', 'write', 'apps/hub/src/server.ts', '+3 −1'], ['Bash', 'run', 'pnpm test', '2.1s']]

const projHtml = () => `<div class="pane" style="width:${PROJ.w}px;height:${PROJ.h}px">
  <div style="display:flex;align-items:baseline"><span class="h2" style="font-size:20px">Projects</span><span class="meta" style="margin-left:auto">6 projects · 2 live</span></div>
  <div class="meta" style="margin-top:2px">Where each one stopped, how far along, what it cost</div>
  ${PROJECTS.map(([n, when]) => `<div class="pj" style="display:flex;align-items:center;gap:12px;height:50px;border-bottom:1px solid var(--line)">
    <span class="dot" style="background:${when === 'live' ? 'var(--edit)' : 'transparent'}"></span><span class="row-t" style="font-size:15px;width:150px">${n}</span>
    <span class="meta" style="width:80px">${when}</span><div style="flex:1">${meter('pm', 'var(--mid)', 5)}</div><span class="pp num" style="width:48px;text-align:right;color:var(--hi)"></span></div>`).join('')}</div>`

const handoffHtml = () => `<div class="pane" style="width:${HANDOFF.w}px;height:${HANDOFF.h}px">
  <div style="display:flex;gap:12px;align-items:center"><span style="color:var(--hi)">${icon('flag', 18)}</span><span class="h2" style="font-size:20px">Context is <span class="cp num">74%</span> full</span></div>
  <div style="color:var(--mid);font-size:15px;margin:10px 0 0 30px">Write a note of where you are, then go on in a fresh chat without losing the thread.</div>
  <div style="margin:16px 0 0 30px">${meter('cm', 'var(--warn)', 6)}</div>
  <div style="display:flex;gap:10px;margin:22px 0 0 30px"><span class="wh" style="border-radius:10px">${btn('Write handoff', 'primary')}</span>${btn('Compact instead')}${btn('Not now', 'plain')}</div></div>`

const noteHtml = () => `<div class="card note" style="width:150px;padding:12px 14px;box-shadow:0 16px 30px -12px rgba(0,0,0,.7)">
  <div class="lbl" style="font-size:11px">Handoff note</div>${['92%', '70%', '84%', '55%'].map(w => `<div style="height:5px;width:${w};background:var(--track);border-radius:3px;margin-top:7px"></div>`).join('')}</div>`

const newChatHtml = () => `<div class="pane" style="width:${NEWCHAT.w}px;height:${NEWCHAT.h}px">
  <div class="meta">New chat</div>
  <div class="got" style="display:flex;gap:10px;align-items:center;margin-top:16px;padding:10px 14px;border-radius:10px;background:var(--card);border:1px solid var(--line);width:fit-content">
    ${icon('flag', 15)}<span style="color:var(--hi);font-size:14px">Handoff note</span><span class="meta">· read once, with a summary</span></div>
  <div class="pick" style="color:var(--hi);font-size:16px;margin-top:18px">Picking up where we stopped: the login form is done; next, wire the API call.</div>
  <div class="card" style="position:absolute;left:20px;right:20px;bottom:18px;height:48px;padding:14px 18px;color:var(--lo)">Reply to Claude…</div></div>`

const skinsHtml = () => `<div class="pane sk" style="width:${SKINS.w}px;height:${SKINS.h}px;transition:none">
  <div style="display:flex;align-items:center;gap:10px"><span class="cmd mono" style="font-size:15px;color:var(--hi)">/skin</span><span class="meta skn" style="margin-left:auto"></span></div>
  ${TOOLS.map(([a, , b, c]) => `<div class="tl" style="display:flex;gap:12px;align-items:center;margin-top:16px;padding:12px 14px;border-radius:9px;font:15px var(--mono)">
    <span class="dt" style="width:7px;height:7px;border-radius:50%"></span><b class="tn">${a}</b><span class="ta">${b}</span><span class="tc" style="margin-left:auto">${c}</span></div>`).join('')}
  <div class="spin mono" style="margin-top:20px;font-size:15px"></div>
  <div class="meta" style="position:absolute;bottom:18px;left:20px">Themes for the transcript, switched live, and scenes above the prompt.</div></div>`

export function build() {
  const proj = place(projHtml(), PROJ), hand = place(handoffHtml(), HANDOFF), chat = place(newChatHtml(), NEWCHAT)
  const skins = place(skinsHtml(), SKINS), note = place(noteHtml(), { x: 0, y: 0 })
  const rows = $$(proj, '.pj'), tools = $$(skins, '.tl')

  function update(t) {
    const isShown = t > T.toPeople - 0.8 && t < T.toWall + 1.2
    for (const el of [proj, hand, chat, skins]) el.style.visibility = isShown ? 'visible' : 'hidden'
    // Leaving for the skins shot, these step back so nothing bleeds into its frame.
    const away = T.toSkins + 0.1
    presenceStyle(proj.firstElementChild, presence(t, T.toPeople + 0.1, away, { rise: 30, blur: 10, out: 0.4 }))
    rows.forEach((r, i) => {
      const v = count([{ t: T.toPeople + 0.85 + i * 0.08, v: 0 }, { t: T.toPeople + 1.9 + i * 0.08, v: PROJECTS[i][2] }], t)
      setMeter($(r, '.pm'), v)
      $(r, '.pm b').style.background = PROJECTS[i][2] === 1 ? 'var(--ok)' : 'var(--mid)'
      setText($(r, '.pp'), `${PROJECTS[i][2] === 1 ? '' : '~'}${Math.round(v * 100)}%`)
    })
    presenceStyle(hand.firstElementChild, presence(t, T.handoff - 0.6, away, { rise: 30, blur: 10, out: 0.4 }))
    const c = count([{ t: T.handoff - 0.4, v: 0.74 }, { t: T.handoff + 0.6, v: 0.82 }], t)
    setText($(hand, '.cp'), `${Math.round(c * 100)}%`)
    setMeter($(hand, '.cm'), c)
    const press = spring(t, T.carry - 0.25, SPRING.snappy) * (1 - seg(t, T.carry - 0.15, T.carry))
    $(hand, '.wh').style.transform = `scale(${(1 - 0.05 * press).toFixed(4)})`
    presenceStyle(chat.firstElementChild, presence(t, T.carry + 0.2, away + 0.2, { rise: 30, blur: 10, out: 0.4 }))
    presenceStyle($(chat, '.got'), presence(t, T.carry + 1.75, Infinity, { rise: 10, spr: SPRING.pop }))
    presenceStyle($(chat, '.pick'), presence(t, T.carry + 2.1, Infinity, { rise: 8 }))

    // The note rides on the agent's back from the full chat to the fresh one, then drops in.
    const ride = t > T.carry && t < T.carry + 1.9
    note.style.display = ride ? '' : 'none'
    if (ride) {
      const p = window.FILM_CTX.path.at(t)
      const drop = EASE.in(seg(t, T.carry + 1.5, T.carry + 1.85))
      note.style.transform = `translate(${p.x - 75}px, ${p.y - 30 * p.s - 70 - p.lift + drop * 40}px) rotate(${lerp(-6, 0, drop)}deg)`
      note.style.opacity = (clamp(seg(t, T.carry, T.carry + 0.2)) * (1 - drop)).toFixed(3)
    }

    presenceStyle(skins.firstElementChild, presence(t, T.toSkins, Infinity, { rise: 30, blur: 10 }))
    const k = t < T.skin1 ? 0 : t < T.skin2 ? 1 : 2
    const s = SKIN_SET[k]
    const flash = 1 - seg(t, [0, T.skin1, T.skin2][k], [0, T.skin1, T.skin2][k] + 0.4)
    setText($(skins, '.cmd'), k ? `/skin ${s.name}` : '/skin')
    setText($(skins, '.skn'), s.label)
    tools.forEach((el, i) => {
      const key = TOOLS[i][1]
      el.style.background = s.surface
      el.style.boxShadow = k && flash > 0 ? `inset 0 0 0 1px rgba(255,255,255,${(0.12 * flash).toFixed(3)})` : 'none'
      $(el, '.dt').style.background = s[key]
      $(el, '.tn').style.color = s[key]
      $(el, '.ta').style.color = s.fg
      $(el, '.tc').style.color = s.muted
    })
    const spin = $(skins, '.spin')
    spin.style.color = s.write
    setText(spin, ['✻ Working…', '✻ Night-driving…', '✻ Brewing…'][k])
  }
  return {
    update,
    hueAt: t => (t < T.skin1 ? 0 : t < T.skin2 ? SKIN_SET[1].hue : t < T.toWall + 0.5 ? SKIN_SET[2].hue : 0),
    anchors: {
      projAt: { x: PROJ.x + PROJ.w + 40, y: PROJ.y + rows[2].offsetTop + rows[2].offsetHeight - 4 },
      handAt: { x: HANDOFF.x + HANDOFF.w - 70, y: HANDOFF.y + HANDOFF.h - 6 },
      chatAt: { x: NEWCHAT.x + 70, y: NEWCHAT.y + NEWCHAT.h + 2 },
      skinsAt: { x: SKINS.x + SKINS.w - 60, y: SKINS.y + SKINS.h - 4 },
    },
  }
}
