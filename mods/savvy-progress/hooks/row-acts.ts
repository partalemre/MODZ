import type { WorkKind } from '../types'
import { THOUGHT } from './strip-scene'

// How each kind of work looks on an agent's row (row-crab.ts): the picture in the crab's thought bubble, the
// work played on the line of words itself, and the crab's own small move. All CSS, each loop starting and
// ending at rest. The point is that the motion alone says what the agent is doing.

const stroke = (cls: string, d: string, width = 1.3): string => `<path class="${cls}" d="${d}" fill="none" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"/>`

// The bubble pictures the strip does not have, in its language.
const MORE: Record<Exclude<WorkKind, 'read' | 'edit' | 'run' | 'agent' | 'other'>, string> = {
  search: `<g class="swp"><circle class="i-read" cx="10.5" cy="6.8" r="3.2" fill="none" stroke-width="1.4"/>${stroke('i-read', 'M12.9 9.2l2.6 2.6', 1.6)}</g>`,
  test: [4.5, 9.5, 14.5].map((x, i) => stroke(`i-ok ty${i + 1}`, `M${x} 7.6l1.6 1.6 3-3.4`, 1.5)).join(''),
  save: '<path class="f-warn drop" d="M9 2.8h6v9.6l-3-2.4-3 2.4z"/>',
  web: `<circle class="i-read" cx="12" cy="7.5" r="4.6" fill="none" stroke-width="1.2"/>${stroke('i-read', 'M7.4 7.5h9.2', 1)}<ellipse class="i-read spin" cx="12" cy="7.5" rx="2.2" ry="4.6" fill="none" stroke-width="1"/>`,
  message: `${stroke('i-plan trail', 'M3.2 6h2M2.6 9h2.6', 1)}<g class="fly"><rect class="i-plan" x="7" y="4" width="10" height="7" rx="1" fill="none" stroke-width="1.2"/>${stroke('i-plan', 'M7.5 4.6l4.5 3.6 4.5-3.6', 1.2)}</g>`,
  wait: `<circle class="i-m" cx="12" cy="7.5" r="4.6" fill="none" stroke-width="1.2"/>${stroke('i-m hand', 'M12 7.5V4.4')}`,
}

/** The thought bubble's picture for a kind of work. */
export const thoughtOf = (kind: WorkKind): string => (kind === 'read' || kind === 'edit' || kind === 'run' || kind === 'agent' || kind === 'other' ? THOUGHT[kind] : MORE[kind])

export type Line = { x: number; y: number; width: number }

// A thing that travels the length of the words: `--d` is how far.
const along = (cls: string, line: Line, lead: number, body: string): string => `<g class="${cls}" style="--d:${Math.max(0, line.width - lead).toFixed(0)}px">${body}</g>`
const after = (line: Line, body: string): string => `<g transform="translate(${(line.x + line.width + 8).toFixed(1)},${line.y - 11})">${body}</g>`
const DOTS = [0, 6, 12].map((x, i) => `<circle class="s d${i + 1}" cx="${x + 2}" cy="7.5" r="1.6"/>`).join('')

/** The work played on its own line of words: a light reading along them, a caret after them, a letter leaving. */
export function lineAct(kind: WorkKind, line: Line): string {
  const band = (cls: string, w: number): string => `<rect class="${cls}" x="${line.x - 2}" y="${line.y - 12}" width="${w}" height="16" rx="4" opacity=".2"/>`
  switch (kind) {
    // A light passes along the words, as an eye does.
    case 'read':
      return along('go-read', line, 22, band('f-read', 26))
    // A glass darts over them, looking for something.
    case 'search':
      return along('go-search', line, 8, `<g transform="translate(${line.x},${line.y - 11})"><circle class="i-read" cx="4" cy="5" r="3.6" fill="none" stroke-width="1.5"/>${stroke('i-read', 'M6.8 7.8l3 3', 1.7)}</g>`)
    case 'web':
      return along('go-read', line, 22, band('f-plan', 26))
    // A caret waits after the last word.
    case 'edit':
      return `<rect class="f-edit car" x="${(line.x + line.width + 3).toFixed(1)}" y="${line.y - 11}" width="1.8" height="13" rx=".9"/>`
    // A command runs: a streak under the words, end to end.
    case 'run':
      return `<rect class="f-run" x="${line.x}" y="${line.y + 3.5}" width="${line.width.toFixed(0)}" height="1.6" rx=".8" opacity=".18"/>${along('go-run', line, 30, `<rect class="f-run" x="${line.x}" y="${line.y + 3.5}" width="30" height="1.6" rx=".8"/>`)}`
    // Checks land one after another.
    case 'test':
      return after(line, [0, 10, 20].map((x, i) => stroke(`i-ok ty${i + 1}`, `M${x} 6.4l2 2 3.6-4.2`, 1.6)).join(''))
    case 'save':
      return after(line, '<path class="f-warn drop" d="M1 1.5h7v11l-3.5-2.8L1 12.5z"/>')
    // A letter leaves for someone else.
    case 'message':
      return after(line, `<g class="post"><rect class="i-plan" x="1" y="2" width="13" height="9" rx="1.2" fill="none" stroke-width="1.3"/>${stroke('i-plan', 'M1.6 2.8l5.9 4.6 5.9-4.6')}</g>`)
    case 'wait':
      return after(line, `<circle class="i-m" cx="6" cy="7" r="5" fill="none" stroke-width="1.3"/>${stroke('i-m hand', 'M6 7V3.6')}`)
    default:
      return after(line, DOTS)
  }
}

export const ROW_CSS = `<style>
.swp{animation:swp 1.8s ease-in-out infinite}@keyframes swp{0%,100%{transform:translateX(-2.5px)}50%{transform:translateX(3px)}}
.drop{animation:drop 1.8s cubic-bezier(.3,1.4,.5,1) infinite}@keyframes drop{0%{transform:translateY(-5px);opacity:0}35%,100%{transform:translateY(0);opacity:1}}
.spin{transform-box:fill-box;transform-origin:center;animation:spin 2.2s ease-in-out infinite}@keyframes spin{50%{transform:scaleX(.15)}}
.fly{animation:fly 1.8s ease-in infinite}@keyframes fly{0%{transform:translateX(-3px);opacity:0}20%{opacity:1}70%{transform:translateX(2px);opacity:1}100%{transform:translateX(8px);opacity:0}}
.trail{animation:trail 1.8s ease-in infinite}@keyframes trail{0%,55%{opacity:0}75%{opacity:.9}100%{opacity:0}}
.hand{transform-box:fill-box;transform-origin:50% 100%;animation:hand 4s steps(12) infinite}@keyframes hand{to{transform:rotate(360deg)}}
.go-read{animation:go 3.4s ease-in-out infinite alternate}.go-search{animation:go 1.5s ease-in-out infinite alternate}.go-run{animation:go 1.1s ease-in-out infinite alternate}
@keyframes go{to{transform:translateX(var(--d))}}
.post{animation:post 2s ease-in infinite}@keyframes post{0%{transform:translateX(-4px);opacity:0}18%{opacity:1}60%{transform:translateX(10px);opacity:1}100%{transform:translateX(46px);opacity:0}}
.mv-read,.mv-web{animation:hops 3.4s ease-in-out infinite}.mv-search{animation:hops 1.7s ease-in-out infinite}
.mv-edit,.mv-run,.mv-test,.mv-save{animation:hops 1.3s ease-in-out infinite}.mv-agent,.mv-other{animation:hops 4.2s ease-in-out infinite}
@keyframes hops{0%,100%{transform:translate(0,0)}12%{transform:translate(2.5px,-5px)}25%{transform:translate(5px,0)}37%{transform:translate(7.5px,-5px)}50%{transform:translate(10px,0)}62%{transform:translate(7.5px,-5px)}75%{transform:translate(5px,0)}87%{transform:translate(2.5px,-5px)}}
.mv-message{animation:nod 2s ease-out infinite}@keyframes nod{0%,30%,100%{transform:translateY(0)}12%{transform:translateY(-5px)}}
.wig{transform-box:fill-box;transform-origin:50% 100%}.who:hover .wig{animation:wig .45s ease-in-out 2}
@keyframes wig{25%{transform:rotate(-7deg)}75%{transform:rotate(7deg)}}
.born{transform-box:fill-box;transform-origin:50% 100%;animation:born .5s cubic-bezier(.3,1.5,.5,1) both}
@keyframes born{from{transform:scale(0);opacity:0}}
.down{animation:down 1s ease-in-out both}
@keyframes down{0%{transform:translate(0,-19px)}22%{transform:translate(4px,-22px)}45%{transform:translate(6px,-9px)}68%{transform:translate(3px,-13px)}100%{transform:translate(0,0)}}
.fresh{animation:fresh .45s ease-out both}@keyframes fresh{from{opacity:0}}
</style>`
