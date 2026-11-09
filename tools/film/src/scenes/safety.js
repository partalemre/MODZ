// Three guards in a row. blast-radius holds `git reset --hard` and shows what it would throw away; secret-guard
// stops a live key on its way into a file; checkpoint takes a whole turn back.
import { BLAST, CKPT, SECRET, T } from '../layout.js'
import { EASE, presence, presenceStyle, seg, spring, SPRING } from '../motion.js'
import { $, $$, btn, icon, place, windowFrame } from '../ui.js'

const LOST = [['src/checkout/payment.ts', '−96'], ['src/checkout/session.ts', '−41'], ['tests/payment.test.ts', '−120']]
const TURNS = [
  ['Turn 14', 'just now', 'Move checkout to the new payments API', '+6 files'],
  ['Turn 13', '9m ago', 'Add a test that rounds the cart total to cents', '+2 files'],
  ['Turn 12', '21m ago', 'Add a show-password button to the login form', '+4 files'],
  ['Turn 11', '48m ago', 'Update the README install steps', '+1 file'],
]

const blastBody = () => `
  <div class="card" style="position:absolute;right:40px;top:70px;padding:14px 20px;font:17px var(--sans);color:var(--hi);border-radius:14px">Clean up this branch and start over from main.</div>
  <div class="bash" style="position:absolute;left:112px;top:162px;font:17px var(--mono);color:var(--mid)"><b style="color:var(--hi)">Bash</b>&nbsp; git reset --hard origin/main</div>
  <div class="held card" style="position:absolute;left:40px;right:40px;top:212px;padding:22px 26px;border-color:var(--warn-line)">
    <div style="display:flex" class="lbl">Held · Blast Radius<span class="meta" style="margin-left:auto">Waiting for you</span></div>
    <div style="font:650 22px var(--mono);color:var(--hi);margin-top:10px">git reset --hard origin/main</div>
    <div style="display:flex;gap:8px;align-items:center;margin-top:8px;color:var(--danger);font-size:16px">${icon('trash', 17)} This would throw away 14 files and 312 lines you haven't committed.</div>
    <div style="background:var(--inset);border:1px solid var(--line);border-radius:8px;margin-top:16px;padding:10px 16px;font:15px/2 var(--mono)">
      ${LOST.map(([f, n]) => `<div style="display:flex"><span>${f}</span><span class="del" style="margin-left:auto">${n}</span></div>`).join('')}
      <div style="color:var(--lo)">+ 11 more files</div></div>
    <div style="display:flex;gap:10px;margin-top:20px;align-items:center">
      <span class="keep" style="position:relative;border-radius:10px">${btn('Keep my work', 'primary', 'k')}</span>${btn('Run anyway', '', 'r')}
      <span class="meta" style="margin-left:auto">Held by Blast Radius</span></div>
  </div>
  <div class="kept" style="position:absolute;left:112px;top:212px;display:flex;gap:10px;align-items:center;font-size:16px;color:var(--ok)">${icon('check', 18)}<span style="color:var(--hi)">Kept. Nothing was thrown away.</span></div>`

const secretHtml = () => `<div class="pane" style="width:${SECRET.w}px;height:${SECRET.h}px;border-color:var(--danger-line)">
  <div class="lbl" style="display:flex;gap:8px;align-items:center"><span style="color:var(--danger)">${icon('key', 15)}</span>Leak blocked</div>
  <div class="h2" style="font-size:20px;margin-top:8px">This write has 1 secret key</div>
  <div style="background:var(--inset);border:1px solid var(--line);border-radius:8px;margin-top:14px;padding:12px 16px;font:14px var(--mono)">
    <div class="meta" style="margin-bottom:6px">src/config.ts · line 12</div>
    <span style="color:var(--mid)">const stripeKey = </span><span style="background:var(--danger-tint);color:var(--danger);padding:1px 4px;border-radius:3px">"sk_live_••••••••••••3f9a"</span></div>
  <div class="meta" style="margin-top:16px">How do you want to go on?</div>
  ${[['Move key to .env', 'Recommended. The value goes into .env, which git ignores.'], ['Allow once', 'The call runs as it is; the key stays in the open.'], ['Cancel', 'The call is blocked and Claude is told why.']]
    .map(([a, b], i) => `<div class="opt" style="display:flex;gap:12px;align-items:baseline;padding:9px 12px;margin:6px -12px 0;border-radius:8px;${i === 0 ? 'background:var(--track)' : ''}">
      <span class="row-t" style="font-size:14px;min-width:150px">${a}</span><span class="meta">${b}</span></div>`).join('')}
  <div class="moved" style="position:absolute;left:20px;right:20px;bottom:18px;display:flex;gap:10px;align-items:center;color:var(--ok);font-size:14px">${icon('check', 16)}<span style="color:var(--hi)">Moved to .env. The code reads it from the environment.</span></div></div>`

const ckptHtml = () => `<div class="pane" style="width:${CKPT.w}px;height:${CKPT.h}px">
  <div style="display:flex;align-items:baseline"><span class="h2" style="font-size:20px">4 turns saved</span><span class="meta" style="margin-left:auto">a silent git snapshot before each turn</span></div>
  ${TURNS.map(([n, ago, what, files], i) => `<div class="turn" style="position:relative;display:flex;gap:14px;padding:10px 0 10px 26px;margin-top:${i ? 0 : 12}px">
    <span style="position:absolute;left:4px;top:16px;width:9px;height:9px;border-radius:50%;background:${i ? 'var(--line-strong)' : 'var(--edit)'}"></span>
    <div><div class="row-t" style="font-size:14px">${n} <span class="meta">${ago}</span></div><div class="wt" style="color:var(--mid);font-size:13.5px">${what}</div></div>
    <span class="meta" style="margin-left:auto">${files}</span></div>`).join('')}
  <div class="undo" style="position:absolute;right:20px;bottom:18px;display:flex;gap:12px;align-items:center"><span class="meta res"></span><span class="ub">${btn('Undo turn 14', 'secondary', 'u')}</span></div></div>`

export function build() {
  const blast = place(windowFrame('atlas-web — Claude Code', blastBody(), BLAST), BLAST)
  const secret = place(secretHtml(), SECRET)
  const ckpt = place(ckptHtml(), CKPT)
  const held = $(blast, '.held'), kept = $(blast, '.kept'), keep = $(blast, '.keep')
  const opts = $$(secret, '.opt'), turns = $$(ckpt, '.turn')

  function update(t) {
    blast.style.visibility = t > T.toBlast - 0.6 && t < T.toShip ? 'visible' : 'hidden'
    secret.style.visibility = ckpt.style.visibility = t > T.toSecret - 1.2 && t < T.toShip + 1 ? 'visible' : 'hidden'
    presenceStyle($(blast, '.bash'), presence(t, T.bash, Infinity, { rise: 8 }))
    // The card lands hard, in front of the command: a stop, not a suggestion. Leaving, it folds into one line.
    const land = spring(t, T.held, SPRING.pop)
    const gone = EASE.in(seg(t, T.keep + 0.15, T.keep + 0.45))
    held.style.opacity = (Math.min(1, land * 1.4) * (1 - gone)).toFixed(3)
    held.style.transform = `translateY(${((1 - land) * 60 - gone * 20).toFixed(2)}px) scale(${(0.96 + 0.04 * land - gone * 0.03).toFixed(4)})`
    held.style.filter = land < 0.98 ? `blur(${((1 - Math.min(1, land)) * 10).toFixed(2)}px)` : gone > 0 ? `blur(${(gone * 6).toFixed(2)}px)` : 'none'
    const focus = seg(t, T.held + 0.8, T.held + 1.1)
    const press = spring(t, T.keep, SPRING.snappy) * (1 - seg(t, T.keep + 0.1, T.keep + 0.25))
    keep.style.boxShadow = `0 0 0 ${(3 * focus).toFixed(2)}px rgba(240,238,232,${(0.35 * focus).toFixed(2)})`
    keep.style.transform = `scale(${(1 - 0.05 * press).toFixed(4)})`
    presenceStyle(kept, presence(t, T.keep + 0.4, Infinity, { rise: 10 }))

    presenceStyle(secret.firstElementChild, presence(t, T.secret, Infinity, { rise: 30, blur: 10, spr: SPRING.pop }))
    const sel = seg(t, T.moveKey - 0.1, T.moveKey + 0.1)
    opts[0].style.boxShadow = `inset 0 0 0 ${(1.5 * sel).toFixed(2)}px var(--line-strong)`
    opts.forEach((o, i) => { o.style.opacity = i && t > T.moveKey + 0.3 ? '0.45' : '1' })
    presenceStyle($(secret, '.moved'), presence(t, T.moveKey + 0.35, Infinity, { rise: 8 }))

    presenceStyle(ckpt.firstElementChild, presence(t, T.toCkpt, Infinity, { rise: 30, blur: 10 }))
    const undone = seg(t, T.undo + 0.3, T.undo + 0.9)
    const strike = $(turns[0], '.wt')
    strike.style.textDecoration = undone > 0.5 ? 'line-through' : 'none'
    turns[0].style.opacity = (1 - 0.5 * undone).toFixed(3)
    const ub = $(ckpt, '.ub')
    ub.style.transform = `scale(${(1 - 0.05 * spring(t, T.undo, SPRING.snappy) * (1 - seg(t, T.undo + 0.1, T.undo + 0.25))).toFixed(4)})`
    const res = $(ckpt, '.res')
    res.textContent = t > T.undo + 0.6 ? 'Turn 14 undone · files restored' : ''
  }
  return {
    update,
    anchors: {
      bashAt: { x: BLAST.x + 62, y: BLAST.y + 38 + 162 + 22 },
      secretAt: { x: SECRET.x + SECRET.w + 60, y: SECRET.y + 120 },
      ckptAt: { x: CKPT.x + CKPT.w - 190, y: CKPT.y + CKPT.h - 4 },
    },
  }
}
