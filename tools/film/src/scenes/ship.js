// test-badge and pr-card: tests run on their own after edits, and the PR's checks turn green while you look away.
import { PR, T, TESTS } from '../layout.js'
import { EASE, count, presence, presenceStyle, seg } from '../motion.js'
import { $, $$, icon, place, setText } from '../ui.js'

const CHECKS = ['lint', 'unit tests', 'e2e · chromium']
const CHECK_DONE = [T.prChecks + 0.6, T.prChecks + 1.3, T.prChecks + 2.1]
const PASSED_AT = T.tests + 1.8

const testsHtml = () => `<div class="pane" style="width:${TESTS.w}px;height:${TESTS.h}px">
  <div style="display:flex;align-items:baseline"><span class="h2" style="font-size:20px">Tests</span><span class="meta when" style="margin-left:auto"></span></div>
  <div style="display:flex;align-items:baseline;gap:12px;margin-top:14px"><span class="big num" style="font:650 46px var(--mono);color:var(--hi)">0/42</span><span class="meta word" style="font-size:15px"></span></div>
  <div style="display:flex;gap:3px;margin-top:14px">${Array.from({ length: 42 }, () => '<i style="flex:1;height:14px;border-radius:2px;background:var(--track)"></i>').join('')}</div>
  ${[['Tests', 'npm run --silent test'], ['Lint', 'npm run --silent lint']].map(([a, b]) => `<div class="tr" style="display:flex;gap:12px;align-items:center;margin-top:18px">
    <span class="mk" style="width:16px;display:flex"></span><span class="row-t" style="font-size:14px">${a}</span><span class="mono" style="color:var(--lo)">${b}</span><span class="meta rs" style="margin-left:auto"></span></div>`).join('')}
  <div class="meta" style="position:absolute;bottom:18px;left:20px">Runs on its own after Claude edits a source file.</div></div>`

const prHtml = () => `<div class="pane" style="width:${PR.w}px;height:${PR.h}px">
  <div class="meta">Pull request #48 · github</div>
  <div class="h2" style="font-size:19px;margin-top:4px">Move checkout to the new payments API</div>
  <div class="meta" style="margin-top:2px">6 files changed · <span class="add">+162</span> <span class="del">−14</span> · review requested</div>
  ${CHECKS.map(c => `<div class="ck" style="display:flex;gap:12px;align-items:center;margin-top:22px"><span class="mk" style="width:16px;display:flex;justify-content:center"></span>
    <span class="row-t" style="font-size:14px">${c}</span><span class="meta rs" style="margin-left:auto"></span></div>`).join('')}
  <div class="ready" style="position:absolute;left:20px;right:20px;bottom:18px;display:flex;gap:10px;align-items:center;font-size:15px;color:var(--ok)">${icon('check', 17)}<span style="color:var(--hi)">All checks passed · ready to merge</span></div></div>`

const mark = state => (state === 'ok' ? `<span style="color:var(--ok)">${icon('check', 16)}</span>`
  : '<span style="width:7px;height:7px;border-radius:50%;background:var(--warn)"></span>')

export function build() {
  const tests = place(testsHtml(), TESTS), pr = place(prHtml(), PR)
  const cells = $$(tests, 'i'), trs = $$(tests, '.tr'), cks = $$(pr, '.ck')

  function update(t) {
    tests.style.visibility = pr.style.visibility = t > T.toShip - 0.8 && t < T.toMoney + 1 ? 'visible' : 'hidden'
    presenceStyle(tests.firstElementChild, presence(t, T.toShip + 0.1, Infinity, { rise: 30, blur: 10 }))
    presenceStyle(pr.firstElementChild, presence(t, T.toShip + 0.35, Infinity, { rise: 30, blur: 10 }))
    const n = Math.round(count([{ t: T.tests, v: 0 }, { t: PASSED_AT, v: 42 }], t))
    const isPassed = t >= PASSED_AT
    setText($(tests, '.big'), `${n}/42`)
    $(tests, '.big').style.color = isPassed ? 'var(--ok)' : 'var(--hi)'
    setText($(tests, '.word'), isPassed ? 'passed' : t > T.tests ? 'running…' : '')
    setText($(tests, '.when'), isPassed ? 'just now · 8.4s' : 'after the last edit')
    cells.forEach((c, i) => { c.style.background = i < n ? 'var(--ok)' : 'var(--track)'; c.style.opacity = i < n ? String(0.55 + 0.45 * EASE.out(seg(t, T.tests + i * 0.04, T.tests + i * 0.04 + 0.2))) : '1' })
    trs.forEach((r, i) => {
      const isDone = t >= PASSED_AT + i * 0.3
      const html = t > T.tests ? mark(isDone ? 'ok' : 'run') : ''
      if ($(r, '.mk').innerHTML !== html) $(r, '.mk').innerHTML = html
      setText($(r, '.rs'), isDone ? (i ? 'clean' : '42 passed') : t > T.tests ? 'running' : '')
    })
    cks.forEach((r, i) => {
      const isDone = t >= CHECK_DONE[i]
      const html = t > T.prChecks - 0.4 ? mark(isDone ? 'ok' : 'run') : mark('run')
      if ($(r, '.mk').innerHTML !== html) $(r, '.mk').innerHTML = html
      setText($(r, '.rs'), isDone ? 'passed' : 'in progress')
    })
    presenceStyle($(pr, '.ready'), presence(t, CHECK_DONE[2] + 0.3, Infinity, { rise: 8 }))
  }
  // The agent taps each check from the card's edge as it turns green, and starts the run from the Tests card's top.
  const ckAt = i => ({ x: PR.x + PR.w + 40, y: PR.y + cks[i].offsetTop + cks[i].offsetHeight + 6 })
  return { update, anchors: { ckAt, testsAt: { x: TESTS.x + TESTS.w - 90, y: TESTS.y - 1 } } }
}
