export type Rgb = [number, number, number]

const PERCENT = 100
const RED_SHIFT = 16
const GREEN_SHIFT = 8
const HEX_BASE = 16
const HEX_DIGITS = 2

export const HOT_PERCENT = 85
export const WARM_PERCENT = 60

const STOPS: { at: number; color: Rgb }[] = [
  { at: 0, color: [52, 211, 153] },
  { at: 0.55, color: [250, 204, 21] },
  { at: 1, color: [248, 113, 113] },
]

export const MUTED_DARK: Rgb = [148, 163, 184]
export const MUTED_LIGHT: Rgb = [100, 116, 139]
export const TRACK: Rgb = [71, 85, 105]
export const WHITE: Rgb = [255, 255, 255]

export function mix(from: Rgb, to: Rgb, amount: number): Rgb {
  const t = Math.min(1, Math.max(0, amount))

  return [
    Math.round(from[0] + (to[0] - from[0]) * t),
    Math.round(from[1] + (to[1] - from[1]) * t),
    Math.round(from[2] + (to[2] - from[2]) * t),
  ]
}

export function gradientAt(position: number): Rgb {
  const t = Math.min(1, Math.max(0, position))
  const upper = STOPS.findIndex(stop => stop.at >= t)
  if (upper <= 0) return STOPS[0].color

  const low = STOPS[upper - 1]
  const high = STOPS[upper]

  return mix(low.color, high.color, (t - low.at) / (high.at - low.at))
}

export function severityColor(percent: number): Rgb {
  return gradientAt(percent / PERCENT)
}

export function toInt(color: Rgb): number {
  return (color[0] << RED_SHIFT) | (color[1] << GREEN_SHIFT) | color[2]
}

export function toHex(color: Rgb): string {
  const part = (value: number) => value.toString(HEX_BASE).padStart(HEX_DIGITS, '0')

  return `#${part(color[0])}${part(color[1])}${part(color[2])}`
}
