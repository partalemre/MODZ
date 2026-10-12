// Draws the MODZ hero (the film's pixel wordmark and its six crabs) from savvy-progress's own sprites:
// docs/img/hero-dark.svg and hero-light.svg for the README, and the scheme-aware intro the page inlines.
// Run: bun tools/site/hero.ts
import { CRAB_CSS, crab } from '../../mods/savvy-progress/hooks/crabs'

const LETTERS: Record<string, string[]> = {
  M: ['X...X', 'XX.XX', 'X.X.X', 'X.X.X', 'X...X', 'X...X', 'X...X'],
  O: ['.XXX.', 'X...X', 'X...X', 'X...X', 'X...X', 'X...X', '.XXX.'],
  D: ['XXXX.', 'X...X', 'X...X', 'X...X', 'X...X', 'X...X', 'XXXX.'],
  Z: ['XXXXX', '....X', '...X.', '..X..', '.X...', 'X....', 'XXXXX'],
}
const CELL = 22, PITCH = 26, GAP_LETTER = 44
const CREW = [
  { costume: 'heavy', shell: '#E07A9A', eyes: 'dot' }, { costume: 'careful', shell: '#D97757', eyes: 'dot' },
  { costume: 'light', shell: '#6BB26F', eyes: 'dot' }, { costume: 'medium', shell: '#4FA3C7', eyes: 'dot' },
  { costume: 'explore', shell: '#7C93B8', eyes: 'dot' }, { costume: 'fable', shell: '#B07CC6', eyes: 'dot' },
] as const

function hero(ink: string, isIntro = false): string {
  const word = 'MODZ'
  const letterW = 5 * PITCH - (PITCH - CELL)
  const wordW = word.length * letterW + (word.length - 1) * GAP_LETTER
  const width = 760, x0 = (width - wordW) / 2, y0 = 10
  const squares = [...word].flatMap((ch, i) => LETTERS[ch].flatMap((row, r) => [...row].map((c, col) => c === 'X'
    ? `<rect x="${x0 + i * (letterW + GAP_LETTER) + col * PITCH}" y="${y0 + r * PITCH}" width="${CELL}" height="${CELL}" rx="3" fill="${ink}"${isIntro ? ` class="px" style="animation-delay:${(i * 7 + r) * 28 + col * 9}ms"` : ''}/>` : '')))
  const crabScale = 2.2, crabW = 30 * crabScale, step = 92
  const crewX = (width - (CREW.length - 1) * step - crabW) / 2, crewY = y0 + 7 * PITCH + 34
  const crabs = CREW.map((c, i) => crab(crewX + i * step, crewY, { costume: c.costume, look: { shell: c.shell, eyes: c.eyes, name: '' }, isWalking: true, scale: crabScale }))
  const height = crewY + 28 * crabScale + 8
  const intro = isIntro ? '<style>.px{animation:px .32s cubic-bezier(.2,.8,.2,1) both}@keyframes px{from{opacity:0;transform:translateY(-14px)}}.crew{animation:crew .6s 1.1s cubic-bezier(.2,.8,.2,1) both}@keyframes crew{from{opacity:0;transform:translateX(-24px)}}@media (prefers-reduced-motion: reduce){.px,.crew{animation:none}}</style>' : ''
  const size = isIntro ? `viewBox="0 0 ${width} ${height}"` : `width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"`
  return `<svg xmlns="http://www.w3.org/2000/svg" ${size} role="img" aria-label="MODZ">${CRAB_CSS}${intro}${squares.join('')}<g class="crew">${crabs.join('')}</g></svg>\n`
}

const IMG = `${import.meta.dir}/../../docs/img`
await Bun.write(`${IMG}/hero-dark.svg`, hero('#F0EEE8'))
await Bun.write(`${IMG}/hero-light.svg`, hero('#1C1B19'))
// The page keeps this one inline (docs/index.html, the header's <svg class="mark">), so it follows the scheme.
console.log(hero('currentColor', true))
