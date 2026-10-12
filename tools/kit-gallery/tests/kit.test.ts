import { expect, test } from 'claude-code/testing'

import { ICON_NAMES } from '../hooks/kit/icons'
import { arc, fitText, meter, meterGeometry, meterTone, percentText, pill, textWidth, wrapText } from '../hooks/kit/svg'
import { badgeColors, fileType, palette, resolveLight, ROLES, svgStyle } from '../hooks/kit/tokens'
import type { FileKind } from '../hooks/kit/tokens'
import { meterGlyphs, planButtons } from '../hooks/kit/ui'

const AA = 4.5
const SCHEMES = [false, true] as const

// WCAG 2.x relative luminance and contrast ratio.
const channel = (value: number): number => (value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4)

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map(i => channel(parseInt(hex.slice(i, i + 2), 16) / 255))
  return 0.2126 * (r ?? 0) + 0.7152 * (g ?? 0) + 0.0722 * (b ?? 0)
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return ((hi ?? 0) + 0.05) / ((lo ?? 0) + 0.05)
}

test('every role fg reads at 4.5:1 on the card and on its own tint, in both themes', () => {
  for (const isLight of SCHEMES) {
    const p = palette(isLight)
    for (const role of ROLES) {
      expect(contrast(p.roles[role].fg, p.card)).toBeGreaterThanOrEqual(AA)
      expect(contrast(p.roles[role].fg, p.roles[role].tint)).toBeGreaterThanOrEqual(AA)
      // The number on a current step circle is drawn in the card colour on the role fill.
      expect(contrast(p.card, p.roles[role].fg)).toBeGreaterThanOrEqual(AA)
    }
    expect(contrast(p.lo, p.card)).toBeGreaterThanOrEqual(AA)
    expect(contrast(p.mid, p.card)).toBeGreaterThanOrEqual(AA)
  }
})

test('file badges read at 4.5:1 on their tint in both themes', () => {
  const kinds: FileKind[] = ['code', 'py', 'doc', 'data', 'pdf', 'img', 'misc']
  for (const isLight of SCHEMES) {
    for (const kind of kinds) {
      const c = badgeColors(kind, isLight)
      expect(contrast(c.fg, c.tint)).toBeGreaterThanOrEqual(AA)
    }
  }
})

test('textWidth grows with every character and with size', () => {
  const text = 'Mesajın bekletiliyor: 3 dosya değişti · %42 İŞÇĞÜÖ'
  let last = 0
  for (const i of [...text].keys()) {
    const width = textWidth(text.slice(0, i + 1), 13)
    expect(width).toBeGreaterThan(last)
    last = width
  }
  for (const size of [10.5, 11, 12, 13, 14, 17, 20, 24, 32]) {
    expect(textWidth(text, size + 1)).toBeGreaterThan(textWidth(text, size))
  }
  expect(textWidth('Başlık', 17, 700)).toBeGreaterThan(textWidth('Başlık', 17, 400))
})

test('fitting and wrapping stay inside the width', () => {
  const measure = (s: string) => textWidth(s, 17, 620)
  const long = 'Her Kling klibi yaklaşık $0,45 tutuyor ve uzun bir başlık iki satırı aşarsa üç nokta ile kesilir'
  const lines = wrapText(long, { max: 300, maxLines: 2, measure })
  expect(lines.length).toBe(2)
  expect(lines[1]?.endsWith('…')).toBe(true)
  for (const line of lines) expect(measure(line)).toBeLessThanOrEqual(300)
  expect(measure(fitText(long, 120, measure))).toBeLessThanOrEqual(120)
})

test('a meter never draws past 100 % and says "dolu" when full', () => {
  for (const value of [0, 0.3, 1, 1.5, 40, Number.POSITIVE_INFINITY, -2]) {
    const g = meterGeometry({ value, width: 200 })
    expect(g.fill).toBeLessThanOrEqual(g.track)
    expect(g.fill).toBeGreaterThanOrEqual(0)
    const widths = [...meter({ value, width: 200 }).source.matchAll(/width="([\d.]+)"/g)].map(m => Number(m[1]))
    for (const width of widths) expect(width).toBeLessThanOrEqual(200)
  }
  expect(percentText(1.4)).toBe('dolu')
  expect(percentText(0.42)).toBe('%42')
  expect(arc({ value: 3 }).alt).toBe('dolu')
})

test('meter tone: neutral on pace, Amber >10 points ahead, Flare from 95 %', () => {
  expect(meterTone(0.45, 0.4)).toBe('mid')
  expect(meterTone(0.55, 0.4)).toBe('warn')
  expect(meterTone(0.95, 0.94)).toBe('danger')
  expect(meterTone(0.5, undefined, 'ok')).toBe('ok')
})

test('terminal meter glyphs keep their width and mark the pace only ahead of the fill', () => {
  const g = meterGlyphs(0.4, 20, 0.7)
  expect([...g.fill, ...g.rest, ...g.pace, ...g.after].length).toBe(20)
  expect(g.pace).toBe('┊')
  expect(meterGlyphs(0.9, 20, 0.5).pace).toBe('')
  expect(meterGlyphs(1.7, 10).fill).toBe('━'.repeat(10))
})

const noop = (): void => undefined

test('a button row has one primary at most, primary first, plain last', () => {
  const planned = planButtons([
    { label: 'Şimdi değil', variant: 'plain', onPress: noop },
    { label: 'Geçmiş', onPress: noop },
    { label: 'Aç', variant: 'primary', onPress: noop },
    { label: 'Kaydet', variant: 'primary', onPress: noop },
  ])
  expect(planned.map(b => b.label)).toEqual(['Aç', 'Geçmiş', 'Kaydet', 'Şimdi değil'])
  expect(planned.filter(b => b.variant === 'primary').length).toBe(1)
  expect(planned.some(b => b.isFocused)).toBe(false)
})

test('on danger the safe button holds the focus and the destructive one gets a letter, never primary', () => {
  const planned = planButtons(
    [
      { label: '9 dosyayı sil', variant: 'primary', isDestructive: true, onPress: noop },
      { label: 'İptal', isSafe: true, onPress: noop },
    ],
    true,
  )
  const destroy = planned.find(b => b.isDestructive)
  expect(planned.find(b => b.isFocused)?.label).toBe('İptal')
  expect(destroy?.variant).toBe('secondary')
  expect(destroy?.hotkey).toBe('d')
})

test('file types, theme hints and the Svg style', () => {
  expect(fileType('src/api/client.ts')).toEqual({ kind: 'code', label: 'TS' })
  expect(fileType('data.json')).toEqual({ kind: 'data', label: '{}' })
  expect(fileType('.gitignore')).toEqual({ kind: 'misc', label: 'GIT' })
  expect(resolveLight({ override: 'light', theme: 'dark' })).toBe(true)
  expect(resolveLight({ theme: 'auto', colorfgbg: '0;15' })).toBe(true)
  expect(resolveLight({ systemDark: true })).toBe(false)
  const style = svgStyle()
  expect(style).toContain('prefers-color-scheme: light')
  expect(style.endsWith('@media (prefers-reduced-motion: reduce){*{animation:none!important;transition:none!important}}')).toBe(true)
  const small = pill({ text: 'Okunuyor', role: 'read' }).source
  expect(small).toContain('--read-tint')
  expect(small).not.toContain('--danger')
  expect(ICON_NAMES.length).toBeGreaterThanOrEqual(25)
})
