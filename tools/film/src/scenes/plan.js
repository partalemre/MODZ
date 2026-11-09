// plan-steps and filetree side by side: the agent hops down the plan like stairs, each step it leaves ticks itself,
// and the file it is on lights in the tree beside it.
import { FILES, PLAN, T } from '../layout.js'
import { EASE, presence, presenceStyle, seg } from '../motion.js'
import { $, $$, icon, place, setMeter, setText } from '../ui.js'

const STEPS = [
  { text: 'Read the old payment flow', took: '3m', file: 0 },
  { text: 'Add the payments API client', took: '6m', file: 1 },
  { text: 'Move checkout to the new client', file: 2 },
  { text: 'Write payment tests', file: 3 },
  { text: 'Handle declined cards', file: 2 },
  { text: 'Update the README', file: 4 },
]
export const STEP_DONE = [-1, -1, T.planStart + 0.95, T.planStart + 1.9, T.planStart + 2.85, T.planStart + 3.8]
const LIST_TOP = 120, STEP_H = 60

const FILE_ROWS = [
  { name: 'session.ts', dir: 'src/checkout', kind: 'read' },
  { name: 'client.ts', dir: 'src/api', diff: '+64' },
  { name: 'payment.ts', dir: 'src/checkout', diff: '+38 −12' },
  { name: 'payment.test.ts', dir: 'tests', diff: '+52' },
  { name: 'README.md', dir: '', diff: '+6 −2' },
]

const stepHtml = (s, i) => `<div class="step" style="position:absolute;left:20px;right:20px;top:${LIST_TOP + i * STEP_H}px;height:${STEP_H}px;display:flex;align-items:center">
  <span class="mk" style="width:64px;display:flex;justify-content:center;color:var(--ok)"><svg class="ic" width="18" height="18" viewBox="0 0 24 24"><path pathLength="1" d="M5 12.5l4.2 4.2L19 7"/></svg></span>
  <span class="tx" style="font-size:15px;color:var(--mid)">${s.text}</span><span class="meta tk" style="margin-left:auto">${s.took ?? ''}</span></div>`

const fileHtml = (f, i) => `<div class="frow" style="position:absolute;left:12px;right:12px;top:${150 + i * 50}px;height:42px;padding:0 10px;border-radius:8px;display:flex;align-items:center;gap:12px">
  <span class="mono" style="font:700 10px var(--mono);padding:3px 5px;border-radius:4px;background:var(--track);color:var(--lo)">${f.name.endsWith('.md') ? 'MD' : 'TS'}</span>
  <span class="row-t" style="font-size:14px">${f.name}</span><span class="meta">${f.dir}</span>
  <span class="st num" style="margin-left:auto;font-size:13px"></span></div>`

export function build() {
  const plan = place(`<div class="pane" style="width:${PLAN.w}px;height:${PLAN.h}px">
    <div style="display:flex;align-items:baseline"><span class="h2 head" style="font-size:20px">2 of 6 steps done</span><span class="meta eta" style="margin-left:auto;font-size:13px"></span></div>
    <div class="meta" style="margin-top:2px">Checkout migration · from the task list</div>
    <div class="segs" style="display:flex;gap:4px;margin-top:16px">${STEPS.map(() => '<div class="meter" style="flex:1;height:5px"><b style="width:100%;transform:scaleX(0);background:var(--hi)"></b></div>').join('')}</div>
    ${STEPS.map(stepHtml).join('')}</div>`, PLAN)
  const files = place(`<div class="pane" style="width:${FILES.w}px;height:${FILES.h}px">
    <div style="display:flex;align-items:center;gap:10px"><span class="dot"></span><span class="h2 now" style="font-size:16px"></span></div>
    <div class="meta" style="margin-top:8px;display:flex;gap:10px;align-items:center">${icon('branch', 14)} <span style="color:var(--mid)">main</span> · origin/main
      <span class="num" style="margin-left:auto"><span class="add tot-a"></span> <span class="del tot-d"></span></span></div>
    <div class="lbl" style="position:absolute;top:122px;left:22px">Touched this turn</div>
    ${FILE_ROWS.map(fileHtml).join('')}</div>`, FILES)
  const steps = $$(plan, '.step'), segs = $$(plan, '.segs .meter'), frows = $$(files, '.frow')

  function update(t) {
    const isShown = t > T.toPlan - 0.5 && t < T.toSecret
    plan.style.visibility = files.style.visibility = isShown ? 'visible' : 'hidden'
    presenceStyle(plan.firstElementChild, presence(t, T.toPlan + 0.2, Infinity, { rise: 24, blur: 8 }))
    presenceStyle(files.firstElementChild, presence(t, T.toPlan + 0.45, Infinity, { rise: 24, blur: 8 }))
    const done = STEP_DONE.filter(d => d < 0 || t >= d).length
    setText($(plan, '.head'), `${done} of 6 steps done`)
    setText($(plan, '.eta'), done === 6 ? 'finished' : `~${(6 - done) * 2} min left`)
    steps.forEach((el, i) => {
      const at = STEP_DONE[i] < 0 ? -10 : STEP_DONE[i]
      const draw = EASE.out(seg(t, at, at + 0.35))
      const path = el.querySelector('path')
      path.style.strokeDasharray = '1'
      path.style.strokeDashoffset = (1 - draw).toFixed(3)
      const isActive = i === done
      el.querySelector('.tx').style.color = isActive ? 'var(--hi)' : i < done ? 'var(--lo)' : 'var(--mid)'
      el.querySelector('.tx').style.fontWeight = isActive ? '600' : '400'
      if (i >= 2) setText(el.querySelector('.tk'), t >= at && at > 0 ? `${2 + (i % 3)}m` : isActive ? 'now' : '')
      setMeter(segs[i], draw)
    })
    const on = STEPS[Math.min(done, 5)].file
    const f = FILE_ROWS[on]
    setText($(files, '.now'), done === 6 ? 'Claude finished the plan' : `Claude is ${f.kind === 'read' ? 'reading' : 'editing'} ${f.name}`)
    frows.forEach((el, i) => {
      const isNow = i === on && done < 6
      const seen = i <= on || done === 6
      el.style.background = isNow ? 'var(--edit-tint)' : 'transparent'
      el.style.opacity = seen ? '1' : '0.35'
      const st = el.querySelector('.st')
      const diff = FILE_ROWS[i].diff
      st.innerHTML = isNow ? `<span style="color:var(--edit)">${f.kind === 'read' ? 'reading' : 'editing'}</span>` : diff && seen ? diff.split(' ').map(d => `<span class="${d[0] === '+' ? 'add' : 'del'}">${d}</span>`).join(' ') : FILE_ROWS[i].kind === 'read' ? 'read' : ''
    })
    const added = (done > 1 ? 64 : 0) + (done > 2 ? 38 : 0) + (done > 3 ? 52 : 0) + (done > 5 ? 6 : 0)
    setText($(files, '.tot-a'), `+${added}`)
    setText($(files, '.tot-d'), `−${done > 2 ? 14 : 0}`)
  }
  const stepAt = i => ({ x: PLAN.x + 20 + 32, y: PLAN.y + LIST_TOP + i * STEP_H + STEP_H / 2 + 20 })
  return { update, anchors: { stepAt } }
}
