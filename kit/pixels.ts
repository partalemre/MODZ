// MODZ kit — the pixel identity: the film's and the site's 5×7 letters (tools/site/hero.ts) and a set of glyphs
// drawn on the same grid, so a mod's mark reads as MODZ and nothing else. Each cell is a small rounded square; a
// glyph takes one paint class, so its colour can carry state (DESIGN.md §0.1).

// The film's letters, 5 wide and 7 tall.
const LETTERS: Record<string, readonly string[]> = {
  M: ['X...X', 'XX.XX', 'X.X.X', 'X.X.X', 'X...X', 'X...X', 'X...X'],
  O: ['.XXX.', 'X...X', 'X...X', 'X...X', 'X...X', 'X...X', '.XXX.'],
  D: ['XXXX.', 'X...X', 'X...X', 'X...X', 'X...X', 'X...X', 'XXXX.'],
  Z: ['XXXXX', '....X', '...X.', '..X..', '.X...', 'X....', 'XXXXX'],
}

// One glyph per kit icon name the hub uses, on a grid of at most 7×7; centred in their box when drawn.
export const PIXEL_GLYPHS: Record<string, readonly string[]> = {
  sparkle: ['X.....X', 'X.X.X.X', '.XXXXX.', 'XXXXXXX', '.X.X.X.'],
  folder: ['XXX....', 'XXXXXXX', 'X.....X', 'X.....X', 'XXXXXXX'],
  list: ['X.XXXXX', '.......', 'X.XXXXX', '.......', 'X.XXX..'],
  bell: ['X.....X', '.X...X.', '..X.X..', '...X...', '...X...', '..XXX..'],
  check: ['.....XX', '....XX.', 'XX.XX..', '.XXX...', '..X....'],
  bookmark: ['XXXXX', 'XXXXX', 'XXXXX', 'XX.XX', 'X...X'],
  rewind: ['..X..X', '.XX.XX', 'XXXXXX', '.XX.XX', '..X..X'],
  gauge: ['....X..', '..X.X..', '..X.X.X', 'X.X.X.X', 'X.X.X.X'],
  bolt: ['...XX', '..XX.', '.XXXX', '..XX.', '.XX..'],
  flag: ['...X...', '....X..', 'XXXXXX.', '....X..', '...X...'],
  eye: ['..XXX..', '.X...X.', 'X..X..X', '.X...X.', '..XXX..'],
  cube: ['XX.XX', 'XX.XX', '.....', 'XX.XX', 'XX.XX'],
}

const FALLBACK = PIXEL_GLYPHS.cube as readonly string[]
// A cell's corner as a share of the cell: soft, not round.
const ROUND = 0.22

// `cellAttrs`: extra attributes for one cell by its row, column and letter, for a cascade as a word drops in.
export type PixelOpts = { x: number; y: number; cell: number; pitch: number; className: string; cellAttrs?: (at: { row: number; col: number; index: number }) => string }

const num = (value: number): string => String(Math.round(value * 100) / 100)

// The cells of one grid as rects in one group.
function cells(grid: readonly string[], o: PixelOpts, index = 0): string {
  const rects = grid.flatMap((row, r) => [...row].map((c, col) => (c === 'X'
    ? `<rect x="${num(o.x + col * o.pitch)}" y="${num(o.y + r * o.pitch)}" width="${o.cell}" height="${o.cell}" rx="${num(o.cell * ROUND)}"${o.cellAttrs?.({ row: r, col, index }) ?? ''}/>`
    : '')))

  return `<g class="${o.className}">${rects.join('')}</g>`
}

const sizeOf = (grid: readonly string[], pitch: number, cell: number) => ({
  width: Math.max(...grid.map(row => row.length)) * pitch - (pitch - cell),
  height: grid.length * pitch - (pitch - cell),
})

// A glyph centred in a `box`-px square whose top-left is (x, y).
export function pixelGlyph(name: string, o: PixelOpts & { box: number }): string {
  const grid = PIXEL_GLYPHS[name] ?? FALLBACK
  const size = sizeOf(grid, o.pitch, o.cell)

  return cells(grid, { ...o, x: o.x + (o.box - size.width) / 2, y: o.y + (o.box - size.height) / 2 })
}

// A word in the film's letters from (x, y), `gap` px between letters; its width, to place what follows it.
export function pixelWord(word: string, o: PixelOpts & { gap: number }): { svg: string; width: number } {
  let x = o.x
  const parts = [...word.toUpperCase()].map((letter, index) => {
    const grid = LETTERS[letter] ?? LETTERS.M as readonly string[]
    const svg = cells(grid, { ...o, x }, index)
    x += sizeOf(grid, o.pitch, o.cell).width + o.gap

    return svg
  })

  return { svg: parts.join(''), width: x - o.gap - o.x }
}
