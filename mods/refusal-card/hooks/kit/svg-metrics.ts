// MODZ kit — text measuring for Svg layout. Advances were measured from the system UI font
// (SF Pro) in Chromium at 13 px, in thousandths of an em, for weights 400 and 700; other
// weights interpolate. SF tracks small sizes looser and large ones tighter, so a per-size
// tracking correction is added per character. Other system fonts land within a few percent;
// builders leave that much slack.

const CHARS =
  ' !"#$%&\'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~' +
  'çğıİöşüÇĞÖŞÜâîû·…—–≈−×’“”‘€₺°→←↑↓✓✕•'

const REGULAR = [
  275, 305, 472, 624, 624, 919, 706, 291, 376, 376, 466, 624, 291, 466, 291, 299, 624, 458, 598, 621,
  638, 612, 631, 563, 633, 631, 291, 291, 624, 624, 624, 507, 912, 668, 651, 710, 721, 590, 566, 741,
  736, 262, 532, 653, 562, 868, 736, 766, 629, 766, 647, 631, 628, 731, 668, 962, 673, 649, 656, 376,
  299, 376, 624, 578, 494, 546, 608, 554, 608, 565, 356, 604, 583, 241, 241, 537, 247, 864, 578, 585,
  604, 604, 375, 518, 357, 578, 536, 769, 519, 537, 533, 376, 253, 376, 624, 554, 604, 241, 262, 585,
  518, 578, 710, 741, 766, 631, 731, 546, 241, 578, 291, 799, 868, 578, 624, 624, 624, 291, 453, 453,
  291, 624, 624, 466, 900, 900, 775, 775, 860, 762, 466,
]

const BOLD = [
  252, 351, 563, 666, 666, 1030, 739, 342, 423, 423, 479, 666, 342, 479, 342, 329, 679, 506, 637, 663,
  681, 658, 678, 599, 688, 678, 342, 342, 666, 666, 666, 551, 921, 727, 688, 735, 742, 616, 592, 754,
  777, 313, 595, 704, 589, 901, 762, 781, 668, 781, 688, 669, 654, 754, 715, 1003, 724, 702, 670, 423,
  329, 423, 666, 622, 494, 584, 646, 582, 646, 595, 402, 640, 626, 281, 281, 596, 289, 926, 622, 614,
  641, 642, 429, 561, 407, 622, 577, 841, 575, 591, 561, 423, 293, 423, 666, 582, 640, 281, 313, 614,
  561, 622, 735, 754, 781, 669, 754, 584, 281, 622, 342, 948, 901, 622, 666, 666, 666, 342, 547, 547,
  342, 695, 666, 479, 938, 938, 810, 810, 905, 762, 479,
]

const PER_MILLE = 1000
const WEIGHT_LOW = 400
const WEIGHT_SPAN = 300
const UNKNOWN_EM = 0.6
const WIDE_EM = 1
const FIRST_WIDE = 0x2e80
export const MONO_EM = 0.6

// [size px, em added per character], relative to the 13 px the table was measured at.
const TRACKING: readonly (readonly [number, number])[] = [
  [10.5, 0.0146],
  [13, 0],
  [17, -0.0195],
  [24, -0.039],
]

const INDEX = new Map([...CHARS].map((char, i) => [char, i]))

function trackingAt(size: number): number {
  const first = TRACKING[0] ?? [size, 0]
  const last = TRACKING[TRACKING.length - 1] ?? first

  if (size <= first[0]) return first[1]
  if (size >= last[0]) return last[1]

  const upper = TRACKING.findIndex(([at]) => at >= size)
  const [x0, y0] = TRACKING[upper - 1] ?? first
  const [x1, y1] = TRACKING[upper] ?? last

  return y0 + ((y1 - y0) * (size - x0)) / (x1 - x0)
}

function charEm(char: string, boldness: number): number {
  const i = INDEX.get(char)

  if (i === undefined) return (char.codePointAt(0) ?? 0) >= FIRST_WIDE ? WIDE_EM : UNKNOWN_EM

  const regular = REGULAR[i] ?? UNKNOWN_EM * PER_MILLE
  const bold = BOLD[i] ?? regular

  return (regular + (bold - regular) * boldness) / PER_MILLE
}

// Width in px of sans text at `size` px and `weight` (100–900). Grows with every character
// added and with size.
export function textWidth(text: string, size: number, weight = WEIGHT_LOW): number {
  const boldness = Math.max(0, Math.min(1, (weight - WEIGHT_LOW) / WEIGHT_SPAN))
  const chars = [...text]
  const advance = chars.reduce((sum, char) => sum + charEm(char, boldness), 0)

  return Math.max(0, (advance + chars.length * trackingAt(size)) * size)
}

// Width in px of monospace text (SF Mono, Menlo: 0.6 em a character).
export const monoWidth = (text: string, size: number): number => [...text].length * size * MONO_EM

export type Measure = (text: string) => number

// `text` cut to `max` px with an ellipsis, or whole when it fits.
export function fitText(text: string, max: number, measure: Measure): string {
  if (measure(text) <= max) return text

  const chars = [...text]

  while (chars.length > 0 && measure(`${chars.join('').trimEnd()}…`) > max) chars.pop()

  return chars.length === 0 ? '' : `${chars.join('').trimEnd()}…`
}

export type WrapOpts = { max: number; maxLines: number; measure: Measure }

// Words laid into at most `maxLines` lines of `max` px; the last line ends in an ellipsis
// when text is left over. A word longer than a line is cut.
export function wrapText(text: string, o: WrapOpts): string[] {
  const { max, maxLines, measure } = o
  const words = text.split(/\s+/).filter(Boolean)
  const lines: string[] = []
  let line = ''

  for (const [i, word] of words.entries()) {
    const next = line ? `${line} ${word}` : word

    if (measure(next) <= max || !line) {
      line = next
      continue
    }
    if (lines.length === maxLines - 1) return [...lines, fitText(`${line} ${words.slice(i).join(' ')}`, max, measure)]
    lines.push(line)
    line = word
  }

  return line ? [...lines, fitText(line, max, measure)] : lines
}
