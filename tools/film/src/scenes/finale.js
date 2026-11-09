// The wall of all 22 mods lights up as the agent runs past, then folds into the MODZ wordmark; the crew walks in
// under it and the install line types itself.
import { END, T, WALL } from '../layout.js'
import { EASE, clamp, lerp, presence, presenceStyle, seg, spring, SPRING } from '../motion.js'
import { makeCrab } from '../crab.js'
import { $, $$, LETTERS, icon, place } from '../ui.js'

// Each mod with a few plain words of what it gives you, for people who never read a package name.
const MODS = [
  ['savvy-progress', 'sparkle', 'Agents, live'], ['savvy-flow', 'layers', 'Plans, then builds'], ['filetree', 'folder', 'Files it touched'],
  ['plan-steps', 'list', 'The plan, step by step'], ['projects', 'file', 'All your projects'], ['handoff', 'flag', 'Fresh chat, same thread'],
  ['transceiver', 'plug', 'Team chat'], ['blast-radius', 'shield', 'Holds risky commands'], ['secret-guard', 'key', 'Keeps keys safe'],
  ['checkpoint', 'bookmark', 'Undo a turn'], ['test-badge', 'check', 'Tests after edits'], ['pr-card', 'branch', 'Your PR, kept fresh'],
  ['replay-theater', 'rewind', 'Replay the edits'], ['session-budget', 'pause', 'A spend limit'], ['cache-tax', 'clock', 'Breaks cost less'],
  ['hud-pro', 'gauge', 'Limits at a glance'], ['effort-router', 'bolt', 'Effort per turn'], ['done-ping', 'bell', 'A ping when done'],
  ['reflect-mod', 'bulb', 'Learns from fixes'], ['skins', 'eye', 'Themes'], ['wrapped', 'star', 'Your year, as a story'],
  ['terminal-browser', 'terminal', 'A browser in the terminal'],
]
const TILE = { w: 196, h: 112, gap: 16 }
const RUN = { from: T.wall + 0.05, to: T.wall + 1.0, x0: 40, x1: 1280 } // the agent's sprint, in wall px
const tileCenter = i => tilePos(i).x + TILE.w / 2
// The moment the running agent passes a tile: it lights then, and the score pips then.
export const litAt = i => RUN.from + ((tileCenter(i) - RUN.x0) / (RUN.x1 - RUN.x0)) * (RUN.to - RUN.from)
const CREW = ['heavy', 'light', 'medium', 'explore', 'fable']
const CELL = 26, PITCH = 31, LETTER_GAP = 52
const COMMAND = '/plugin marketplace add partalemre/MODZ'

const tilePos = i => {
  const row = Math.floor(i / 6), col = i % 6, inRow = row < 3 ? 6 : 4
  const rowW = inRow * TILE.w + (inRow - 1) * TILE.gap
  return { x: (WALL.w - rowW) / 2 + col * (TILE.w + TILE.gap), y: 20 + row * (TILE.h + TILE.gap) }
}

function wordCells() {
  const letterW = 5 * PITCH - (PITCH - CELL)
  const total = 4 * letterW + 3 * LETTER_GAP
  return [...'MODZ'].flatMap((ch, i) => LETTERS[ch].flatMap((row, r) => [...row].map((c, k) => (c === 'X'
    ? { x: -total / 2 + i * (letterW + LETTER_GAP) + k * PITCH, y: -380 + r * PITCH, d: (i * 7 + r) * 0.022 + k * 0.007 } : null)))).filter(Boolean)
}

export function build() {
  const wall = place(MODS.map(([name, ic], i) => {
    const p = tilePos(i)
    return `<div class="tile card" style="position:absolute;left:${p.x}px;top:${p.y}px;width:${TILE.w}px;height:${TILE.h}px;padding:18px 18px">
      <span class="ti" style="color:var(--mid)">${icon(ic, 22)}</span><div class="mono" style="margin-top:10px;font-size:14px;color:var(--hi)">${name}</div>
      <div style="margin-top:3px;font-size:13px;color:var(--mid)">${MODS[i][2]}</div></div>`
  }).join(''), WALL)
  const tiles = $$(wall, '.tile')
  const cells = wordCells()
  const mark = place(`<svg width="1" height="1" style="overflow:visible">${cells.map(c => `<rect width="${CELL}" height="${CELL}" rx="${CELL * 0.22}" fill="#F0EEE8"/>`).join('')}</svg>`, END)
  const rects = $$(mark, 'rect')
  const crewEl = place('', { x: END.x, y: END.y })
  const crew = CREW.map(k => makeCrab(crewEl, k))
  const text = place(`<div style="width:1000px;text-align:center;font:600 46px/1.15 var(--serif);color:var(--hi);letter-spacing:-0.02em">22 mods for Claude Code. <span style="color:var(--lo)">One panel.</span></div>
    <div class="cmdbox card" style="margin:34px auto 0;width:fit-content;padding:16px 22px;font:20px var(--mono);color:var(--hi);display:flex;gap:14px;align-items:center">
      <span style="color:var(--lo)">›</span><span class="typed"></span><span class="caret" style="width:10px;height:24px;background:var(--edit)"></span></div>
    <div class="url" style="text-align:center;margin-top:20px;font-size:20px;color:var(--mid)">partalemre.github.io/MODZ</div>`, { x: END.x - 500, y: END.y + 70 })

  function update(t) {
    wall.style.visibility = t > T.toWall - 0.8 && t < T.word + 1.6 ? 'visible' : 'hidden'
    tiles.forEach((el, i) => {
      const p = tilePos(i)
      const enter = litAt(i) - 0.35
      const s = presence(t, enter, Infinity, { rise: 20, blur: 8, spr: SPRING.smooth })
      // Folding away: each tile shrinks toward the centre as the letters fall in.
      const fold = EASE.in(seg(t, T.word - 0.65 + (i % 6) * 0.025, T.word + 0.05 + (i % 6) * 0.025))
      const cx = WALL.w / 2 - p.x - TILE.w / 2, cy = WALL.h / 2 - 90 - p.y - TILE.h / 2
      el.style.opacity = (s.opacity * (1 - fold) ** 2).toFixed(3)
      const pulse = Math.max(0, 1 - Math.abs(t - litAt(i)) / 0.22)
      el.style.transform = `translate(${(cx * fold).toFixed(2)}px, ${(s.y + cy * fold - 6 * pulse).toFixed(2)}px) scale(${(1 - 0.7 * fold + 0.04 * pulse).toFixed(3)})`
      el.style.filter = s.blur + fold * 6 > 0.05 ? `blur(${(s.blur + fold * 6).toFixed(2)}px)` : 'none'
      const lit = clamp(1 - Math.abs(t - litAt(i)) / 0.6)
      el.querySelector('.ti').style.color = lit > 0.02 ? `color-mix(in srgb, var(--edit) ${Math.round(lit * 100)}%, var(--mid))` : 'var(--mid)'
    })
    const isEnd = t > T.word - 0.3
    mark.style.visibility = text.style.visibility = crewEl.style.visibility = isEnd ? 'visible' : 'hidden'
    rects.forEach((r, i) => {
      const c = cells[i], p = spring(t, T.word + c.d, SPRING.smooth)
      r.setAttribute('x', c.x)
      r.setAttribute('y', (c.y - (1 - p) * 40).toFixed(2))
      r.setAttribute('opacity', clamp(p * 1.6).toFixed(3))
    })
    crew.forEach((cr, i) => {
      // The crew walks in from both sides to stand in one line with the hero (who takes the second place).
      const slot = [-2.5, -0.5, 0.5, 1.5, 2.5][i] * 92
      const from = slot + (slot < 0 ? -700 : 700)
      const p = EASE.out(seg(t, T.crew + i * 0.12, T.crew + 1.3 + i * 0.12))
      const x = lerp(from, slot, p)
      // Enter lands: the whole crew hops once, a beat after one another.
      const hop = seg(t, T.type + 1.8 + i * 0.05, T.type + 2.2 + i * 0.05)
      cr.pose({ x: x + 4, y: 0, s: 2.4, walk: Math.abs(x - from) / 2.4, vx: p < 1 ? (slot - from) : 0, lift: 4 * 40 * hop * (1 - hop), idle: t + i * 0.3,
        mood: hop > 0 ? 'happy' : undefined, opacity: clamp(seg(t, T.crew + i * 0.12, T.crew + 0.3 + i * 0.12)) })
    })
    presenceStyle(text.firstElementChild, presence(t, T.crew + 0.5, Infinity, { rise: 16, blur: 8 }))
    presenceStyle($(text, '.cmdbox'), presence(t, T.type - 0.3, Infinity, { rise: 12, blur: 6 }))
    const n = Math.round(clamp(seg(t, T.type, T.type + 1.6)) * COMMAND.length)
    const typed = $(text, '.typed')
    if (typed.textContent.length !== n) typed.textContent = COMMAND.slice(0, n)
    $(text, '.caret').style.opacity = t > T.type + 1.7 && Math.floor((t - T.type) * 1.9) % 2 ? '0' : '1'
    presenceStyle($(text, '.url'), presence(t, T.type + 1.8, Infinity, { rise: 8 }))
  }
  return {
    update,
    anchors: {
      wallRun: [{ x: WALL.x + RUN.x0, y: WALL.y + WALL.h + 10 }, { x: WALL.x + RUN.x1, y: WALL.y + WALL.h + 10 }],
      heroEnd: { x: END.x - 1.5 * 92 + 4, y: END.y },
    },
  }
}
