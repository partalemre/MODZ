import type { Place } from './sun'

// The weather over the strip's scene, asked of Open-Meteo (free, no key, no account). Only the place rounded to
// a tenth of a degree (about a town's width) leaves the machine; MODZ_WEATHER=off keeps even that at home.

/** What the sky is doing, as the scene draws it. */
export type Weather = 'clear' | 'cloudy' | 'overcast' | 'fog' | 'rain' | 'snow' | 'storm'

export const WEATHER_EVERY_MS = 30 * 60_000

export const weatherUrl = (place: Place): string =>
  `https://api.open-meteo.com/v1/forecast?latitude=${place.lat.toFixed(1)}&longitude=${place.lon.toFixed(1)}&current=weather_code`

// The WMO weather codes Open-Meteo answers with, by where each kind starts.
const KINDS: readonly [from: number, kind: Weather][] = [
  [0, 'clear'],
  [2, 'cloudy'],
  [3, 'overcast'],
  [45, 'fog'],
  [51, 'rain'],
  [71, 'snow'],
  [80, 'rain'],
  [85, 'snow'],
  [95, 'storm'],
]
const CODE_MAX = 99

/** The weather in Open-Meteo's answer `text`, or undefined when it is not one. */
export function weatherOfText(text: string): Weather | undefined {
  let code: unknown
  try {
    code = (JSON.parse(text) as { current?: { weather_code?: unknown } } | null)?.current?.weather_code
  } catch {
    return undefined
  }
  if (typeof code !== 'number' || !(code >= 0 && code <= CODE_MAX)) return undefined

  return KINDS.findLast(([from]) => code >= from)?.[1]
}
