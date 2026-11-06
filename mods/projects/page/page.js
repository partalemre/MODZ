// The board. Reads window.BOARD (data.js, re-read every 20 s), draws the list and one project. No framework: a page on disk.
const $ = id => document.getElementById(id)
const esc = text => String(text ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])
const say = () => window.BOARD_WORDS[window.BOARD?.language === 'tr' ? 'tr' : 'en']
const spent = t => t.input + t.cacheWrite + t.output
const DAY = 86400000
const MAX_RUNS = 16
const TIP_DELAY_MS = 180
const NARROW = '(max-width: 900px)'
const MARKS = {
  completed: '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M2.5 6.5 5 9l4.5-6" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  in_progress: '<svg viewBox="0 0 12 12" aria-hidden="true"><circle cx="6" cy="6" r="3" fill="currentColor"/></svg>',
  pending: '<svg viewBox="0 0 12 12" aria-hidden="true"><circle cx="6" cy="6" r="3" fill="none" stroke="currentColor" stroke-width="1.2"/></svg>',
}
const CHEVRON = '<svg class="chev" viewBox="0 0 12 12" aria-hidden="true"><path d="M4.5 2.5 8 6l-3.5 3.5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>'

function tok(n) {
  if (n >= 1e9) return `${+(n / 1e9).toFixed(1)}B`
  if (n >= 1e6) return `${n >= 1e8 ? Math.round(n / 1e6) : +(n / 1e6).toFixed(1)}M`
  if (n >= 1e3) return `${Math.round(n / 1e3)}k`
  return String(n)
}
function ago(ms) {
  const a = say().ago, gap = Date.now() - ms
  if (!ms) return '—'
  if (gap < 60000) return a.now
  if (gap < 3600000) return a.m(Math.floor(gap / 60000))
  if (gap < DAY) return a.h(Math.floor(gap / 3600000))
  return a.d(Math.floor(gap / DAY))
}
function span(ms) {
  const u = say().units
  if (ms < 60000) return `${Math.round(ms / 1000)} ${u.s}`
  return ms < 3600000 ? `${Math.round(ms / 60000)} ${u.m}` : `${+(ms / 3600000).toFixed(1)} ${u.h}`
}
const pct = p => (p.value === null ? '—' : `${p.kind === 'estimate' ? '~' : ''}${p.value}%`)
const stopped = p => p.leftOff?.recap || p.estimate?.next || p.leftOff?.title || p.leftOff?.reply || p.leftOff?.prompt || p.git?.subject || ''
const lastMs = p => Date.parse(p.lastAt) || 0
const whenOf = p => (p.isLive ? say().live : ago(lastMs(p)))
const barTone = p => (p.isLive ? ' is-live' : p.percent.value === 100 ? ' is-full' : '')
const barHtml = p => `<span class="bar${barTone(p)}"><i style="width:${p.percent.value ?? 0}%"></i></span>`
const basisShort = q => (q.kind === 'estimate' ? say().estimated : q.kind === 'ticks' ? say().steps(q.basis) : say().noNumber)
// The folder above tells two like-named projects apart; a `parent/name` name says it already.
const parentOf = p => (p.name.includes('/') ? '' : p.root.split('/').slice(-2, -1)[0] ?? '')

let selected = decodeURIComponent(location.hash.slice(1))
let drawnAt = null
const projects = () => window.BOARD?.projects ?? []
const current = () => projects().find(p => p.root === selected) ?? projects()[0]

function rowTip(p) {
  const s = say(), hasNumber = p.percent.value !== null
  const facts = [...(hasNumber ? [pct(p.percent)] : []), basisShort(p.percent), `${tok(spent(p.tokens))} ${s.tokens.toLowerCase()}`, whenOf(p)]
  return `<b>${esc(p.name)}</b><span class="n">${esc(facts.join(' · '))}</span><br>${esc(stopped(p))}`
}
function rowHtml(p) {
  const isOn = p.root === current()?.root
  return `<button class="row" type="button" data-root="${esc(p.root)}" data-tip="${esc(rowTip(p))}"${isOn ? ' aria-current="true"' : ''}>
    <span class="r-name">${p.isLive ? '<span class="live-dot"></span>' : ''}<span class="r-title">${esc(p.name)}</span><span class="r-parent">${esc(parentOf(p))}</span></span>
    <span class="r-text">${esc(stopped(p))}</span>
    <span class="r-prog">${p.percent.value === null ? '' : `<span class="pct">${pct(p.percent)}</span>${barHtml(p)}`}<span class="r-basis">${esc(basisShort(p.percent))}</span></span>
    <span class="r-tok">${tok(spent(p.tokens))}</span><span class="r-when">${esc(whenOf(p))}</span></button>`
}
function drawHeads() {
  const s = say()
  $('heads').innerHTML = `<span>${s.project}</span><span data-tip="${esc(s.progressTip)}" class="has-tip">${s.progress}</span><span data-tip="${esc(s.tokensTip)}" class="has-tip h-tok">${s.tokens}</span><span data-tip="${esc(s.lastTip)}" class="has-tip h-when">${s.last}</span>`
}
function drawList() {
  const s = say(), now = Date.now(), b = window.BOARD, all = projects()
  const within = (from, to) => all.filter(p => now - lastMs(p) >= from && now - lastMs(p) < to)
  const groups = [[s.week, within(-Infinity, 7 * DAY)], [s.month, within(7 * DAY, 30 * DAY)], [s.older, within(30 * DAY, Infinity)]]
  const focused = document.activeElement?.dataset?.root
  $('rows').innerHTML = groups.filter(([, rows]) => rows.length).map(([label, rows]) => `<h2 class="group">${label}</h2>${rows.map(rowHtml).join('')}`).join('')
  if (focused) [...document.querySelectorAll('.row')].find(r => r.dataset.root === focused)?.focus()
  drawHeads()
  const live = all.filter(p => p.isLive).length, missing = all.filter(p => p.percent.value === null).length
  $('title').textContent = document.title = s.title
  document.documentElement.lang = b.language
  $('summary').textContent = s.summary(all.length, live, tok(all.reduce((sum, p) => sum + p.week, 0)))
  $('updated').textContent = s.updated(ago(b.at))
  $('notice').hidden = missing === 0
  $('notice').textContent = s.notice(missing)
  $('other').textContent = b.other.folders ? s.other(b.other.folders, tok(b.other.tokens)) : ''
}
function basisOf(p) {
  const s = say(), q = p.percent
  if (q.kind === 'estimate') return s.est(ago(q.at), q.basis)
  const skipped = p.plans.filter(plan => plan.done === 0).length
  return `${s.ticks(q.basis)}${skipped ? s.skipped(skipped) : ''}`
}
function progressHtml(p) {
  const s = say(), q = p.percent
  if (q.value === null) return `<section class="sec"><h3>${s.none}</h3><p class="meta">${esc(s.noneHow)}</p></section>`
  return `<section class="sec d-progress"><p class="d-num">${pct(q)}</p>${barHtml(p)}<p class="meta">${esc(basisOf(p))}</p>
    ${q.isStale ? `<p class="stale">${s.stale}</p>` : ''}${p.estimate ? `<p class="meta">${s.done}: ${esc(p.estimate.done)}</p>` : ''}</section>`
}
const fact = (label, value) => (value ? `<dt>${label}</dt><dd>${esc(value)}</dd>` : '')
function tasksHtml(tasks) {
  if (!tasks.length) return ''
  const done = tasks.filter(x => x.status === 'completed').length
  const rows = tasks.map(x => `<li class="task is-${x.status}">${MARKS[x.status] ?? MARKS.pending}<span>${esc(x.subject)}</span></li>`).join('')
  return `<p class="sub">${say().tasks(done, tasks.length)}</p><ul>${rows}</ul>`
}
function stoppedHtml(p) {
  const s = say(), l = p.leftOff, head = l?.recap || l?.reply || ''
  const at = p.isLive ? s.live : ago(Date.parse(l?.at) || lastMs(p))
  const facts = [fact(s.when, at), fact(s.asked, l?.prompt), fact(s.branchLabel, p.git && s.branch(p.git.branch, p.git.dirty)), fact(s.commit, p.git && `${p.git.subject} · ${ago(p.git.commitAt)}`)]
  return `<section class="sec"><h3>${s.stopped}</h3>
    ${l?.title ? `<p class="topic">${esc(l.title)}</p>` : ''}
    <p class="body">${esc(head || (p.git ? '' : s.noStop))}</p>
    ${p.estimate ? `<p class="next"><b>${s.next}:</b> ${esc(p.estimate.next)}</p>` : ''}
    <dl class="pairs">${facts.join('')}</dl>${tasksHtml(l?.tasks ?? [])}</section>`
}
function planHtml(plan) {
  const s = say(), marked = plan.done > 0
  const steps = plan.steps.map(st => `<li class="task ${st.isDone ? 'is-completed' : 'is-pending'}">${st.isDone ? MARKS.completed : MARKS.pending}<span>${esc(st.title)}</span></li>`).join('')
  const count = marked ? `${plan.done}/${plan.total}` : s.unmarked(plan.total)
  return `<details><summary data-plan="${esc(plan.path)}" data-tip="${esc(esc(plan.path))}">${CHEVRON}<span class="p-title">${esc(plan.title)}</span><span class="count">${count}</span></summary><ul class="steps">${steps}</ul></details>`
}
function plansHtml(p) {
  const s = say()
  if (!p.plans.length) return `<section class="sec"><h3>${s.plans}</h3><p class="meta">${s.noPlans}</p></section>`
  return `<section class="sec"><h3>${s.plans} <span class="h-count">${p.plans.length}</span></h3>${p.plans.map(planHtml).join('')}</section>`
}
function tokensHtml(p) {
  const s = say(), t = p.tokens, all = spent(t)
  const parts = [[s.cacheW, t.cacheWrite], [s.output, t.output], [s.input, t.input]]
  const models = Object.entries(p.byModel).sort((a, b) => spent(b[1]) - spent(a[1]))
  const rows = list => list.map(([label, n]) => `<dt>${esc(label)}</dt><dd>${typeof n === 'number' ? tok(n) : esc(n)}</dd>`).join('')
  const stack = parts.map(([l, n], i) => `<i class="s${i + 1}" style="flex:${n / Math.max(1, all)}" data-tip="${esc(`<b>${esc(l)}</b><span class="n">${tok(n)}</span>`)}"></i>`).join('')
  const legend = parts.map(([l, n], i) => `<dt><i class="swatch s${i + 1}"></i>${esc(l)}</dt><dd>${tok(n)}</dd>`).join('')
  return `<section class="sec"><h3>${s.tokens}</h3>
    <p class="d-spent"><b>${tok(all)}</b> ${s.spentWord}</p><div class="stack">${stack}</div>
    <dl class="facts">${legend}</dl><p class="meta">${s.spentHow}</p>
    <dl class="facts gap">${rows([[s.cacheR, t.cacheRead], [s.weekSpent, p.week], [s.sessions, String(p.sessions)]])}</dl>
    <p class="sub">${s.models}</p><dl class="facts">${rows(models.map(([m, v]) => [m, spent(v)]))}</dl></section>`
}
function agentsHtml(p) {
  const s = say()
  if (!p.kinds.length) return `<section class="sec"><h3>${s.agents}</h3><p class="meta">${s.noAgents}</p></section>`
  const kinds = p.kinds.map(k => `<div class="grid4"><span>${esc(k.type)}</span><span>${k.runs}</span><span>${tok(k.tokens)}</span><span>${span(k.ms)}</span></div>`).join('')
  const lengthOf = r => Math.max(0, (Date.parse(r.last) || 0) - (Date.parse(r.first) || 0))
  const runs = p.runs.slice(0, MAX_RUNS).map(r => {
    const tip = `<b>${esc(r.description || r.type)}</b>${esc(r.type)} · ${tok(r.tokens)} · ${s.tools(r.tools)} · ${span(lengthOf(r))} · ${ago(Date.parse(r.last))}`
    return `<div class="run" data-tip="${esc(tip)}"><span class="run-name">${r.isLive ? '<span class="live-dot"></span>' : ''}${esc(r.description || r.type)}</span><span>${tok(r.tokens)}</span><span>${span(lengthOf(r))}</span></div>`
  }).join('')
  return `<section class="sec"><h3>${s.agents}</h3><div class="grid4 is-head"><span>${s.kind}</span><span>${s.runsHead}</span><span>${s.tokens}</span><span>${s.took}</span></div>${kinds}<p class="sub">${s.recent}</p>${runs}</section>`
}
function drawDetail() {
  const p = current(), box = $('detail')
  if (!p) { box.innerHTML = ''; return }
  const open = new Set([...box.querySelectorAll('details[open] summary')].map(x => x.dataset.plan)), top = box.scrollTop
  box.innerHTML = `<h2 class="d-name">${p.isLive ? '<span class="live-dot"></span>' : ''}${esc(p.name)}</h2><p class="d-path">${esc(p.root)}</p>
    ${progressHtml(p)}${stoppedHtml(p)}${plansHtml(p)}${tokensHtml(p)}${agentsHtml(p)}`
  for (const d of box.querySelectorAll('details')) if (open.has(d.querySelector('summary').dataset.plan)) d.open = true
  box.scrollTop = top
}
function select(root) {
  selected = root
  history.replaceState(null, '', `#${encodeURIComponent(root)}`)
  for (const r of document.querySelectorAll('.row')) {
    if (r.dataset.root === root) r.setAttribute('aria-current', 'true')
    else r.removeAttribute('aria-current')
  }
  $('detail').scrollTop = 0
  drawDetail()
  if (matchMedia(NARROW).matches) $('detail').scrollIntoView()
}
$('rows').addEventListener('click', e => { const r = e.target.closest('.row'); if (r) select(r.dataset.root) })

let tipTimer = null, tipFor = null
function placeTip(e) {
  const tip = $('tip'), below = e.clientY + 18
  tip.style.left = `${Math.max(8, Math.min(e.clientX + 14, innerWidth - tip.offsetWidth - 8))}px`
  tip.style.top = `${below + tip.offsetHeight > innerHeight ? Math.max(8, e.clientY - tip.offsetHeight - 10) : below}px`
}
document.addEventListener('mousemove', e => {
  const t = e.target.closest?.('[data-tip]') ?? null
  if (t === tipFor) { if (!$('tip').hidden) placeTip(e); return }
  tipFor = t
  clearTimeout(tipTimer)
  $('tip').hidden = true
  if (t) tipTimer = setTimeout(() => { $('tip').innerHTML = t.dataset.tip; $('tip').hidden = false; placeTip(e) }, TIP_DELAY_MS)
})

// data.js calls this on every re-read; a redraw only when the snapshot moved keeps focus and open plans still.
window.onBoard = () => {
  if (!window.BOARD_WORDS || window.BOARD?.at === drawnAt) return
  drawnAt = window.BOARD?.at
  drawList(); drawDetail()
}
window.onBoard()
setInterval(() => {
  const next = document.createElement('script')
  next.src = `data.js?t=${Date.now()}`
  next.onload = next.onerror = () => next.remove()
  document.body.append(next)
}, 20000)
