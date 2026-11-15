import { expect } from 'claude-code/testing'

import { sceneSvg } from '../hooks/strip-scene'
import { placeFromText, placeOfZone, skyOf, sunTimes } from '../hooks/sun'
import { weatherOfText, weatherUrl } from '../hooks/weather'
import type { Weather } from '../hooks/weather'
import { test } from './fixtures'

const MINUTE = 60_000
const ISTANBUL = { lat: 41.0167, lon: 28.9667 }
const at = (iso: string): number => Date.parse(iso)
const isNear = (value: number | undefined, want: number): boolean => value !== undefined && Math.abs(value - want) < 0.001

test('sun: at the equator on the equinox the day runs about six to six', async () => {
  const times = sunTimes(at('2026-03-20T12:00:00Z'), { lat: 0, lon: 0 })
  if (typeof times === 'string') throw new Error('the equator has a sunrise')
  expect(Math.abs(times.rise - at('2026-03-20T06:00:00Z'))).toBeLessThan(15 * MINUTE)
  expect(Math.abs(times.set - at('2026-03-20T18:00:00Z'))).toBeLessThan(15 * MINUTE)
})

test('sun: Istanbul has a longer day in June than in December; the far north has none in December', async () => {
  const span = (iso: string): number => {
    const times = sunTimes(at(iso), ISTANBUL)

    return typeof times === 'string' ? 0 : times.set - times.rise
  }
  expect(span('2026-06-21T09:00:00Z')).toBeGreaterThan(span('2026-12-21T09:00:00Z') + 5 * 60 * MINUTE)
  expect(sunTimes(at('2026-12-21T09:00:00Z'), { lat: 78, lon: 15 })).toBe('night')
  expect(sunTimes(at('2026-06-21T09:00:00Z'), { lat: 78, lon: 15 })).toBe('day')
})

test('sun: the sky follows the place, and the sun crosses it from left to right', async () => {
  // 14 November in Istanbul (UTC+3): the sun is up from about 07:45 to 17:45.
  expect(skyOf(at('2026-11-14T01:00:00Z'), ISTANBUL).phase).toBe('night')
  expect(skyOf(at('2026-11-14T05:00:00Z'), ISTANBUL)).toEqual({ phase: 'dawn', at: expect.any(Number) })
  const noon = skyOf(at('2026-11-14T09:45:00Z'), ISTANBUL)
  expect(noon.phase).toBe('day')
  expect(Math.abs(noon.at - 0.5)).toBeLessThan(0.05)
  expect(skyOf(at('2026-11-14T14:30:00Z'), ISTANBUL).phase).toBe('dusk')
  expect(skyOf(at('2026-11-14T13:00:00Z'), ISTANBUL).at).toBeGreaterThan(noon.at)
  // The same moment is the middle of the day half a world away.
  expect(skyOf(at('2026-11-14T01:00:00Z'), { lat: 35.68, lon: 139.69 }).phase).toBe('day')
})

test('sun: a place is read from the zone table and from "lat,lon"', async () => {
  const place = placeOfZone('# comment\nTR\t+4101+02858\tEurope/Istanbul\nUS\t+404251-0740023\tAmerica/New_York\tEastern', 'Europe/Istanbul')
  expect(isNear(place?.lat, 41.0167)).toBe(true)
  expect(isNear(place?.lon, 28.9667)).toBe(true)
  expect(isNear(placeOfZone('US\t+404251-0740023\tAmerica/New_York\tEastern', 'America/New_York')?.lon, -74.0064)).toBe(true)
  expect(placeOfZone('', 'Europe/Istanbul')).toBeUndefined()
  expect(placeFromText('41.01, 28.97')).toEqual({ lat: 41.01, lon: 28.97 })
  expect(placeFromText(undefined)).toBeUndefined()
  expect(placeFromText('nowhere')).toBeUndefined()
})

test('sun: the scene draws the sun further right as the day goes on', async () => {
  const sunX = (dayPart: number): number => {
    const { source } = sceneSvg({ width: 800, crew: [], mood: 'sleeping', steps: [], sky: { phase: 'day', at: dayPart } })

    return Number(/<circle cx="([\d.]+)" cy="\d+" r="6"/.exec(source)?.[1])
  }
  expect(sunX(0.2)).toBeLessThan(sunX(0.5))
  expect(sunX(0.5)).toBeLessThan(sunX(0.9))
})

test('weather: Open-Meteo codes become what the scene draws; anything else is no weather', async () => {
  const kind = (code: unknown) => weatherOfText(JSON.stringify({ current: { weather_code: code } }))
  expect([0, 1, 2, 3, 48, 63, 75, 81, 86, 99].map(kind)).toEqual(['clear', 'clear', 'cloudy', 'overcast', 'fog', 'rain', 'snow', 'rain', 'snow', 'storm'])
  expect([kind(-1), kind(120), kind('63'), weatherOfText('not json'), weatherOfText('null'), weatherOfText('{}')]).toEqual([undefined, undefined, undefined, undefined, undefined, undefined])
})

test('weather: only a rounded place is sent', async () => {
  expect(weatherUrl({ lat: 41.016666, lon: 28.966666 })).toBe('https://api.open-meteo.com/v1/forecast?latitude=41.0&longitude=29.0&current=weather_code')
})

test('weather: rain falls in the scene, a clear sky has no clouds, no weather draws the fair sky', async () => {
  const drawn = (weather?: Weather): string => sceneSvg({ width: 800, crew: [], mood: 'sleeping', steps: [], sky: { phase: 'day', at: 0.5, weather } }).source
  const count = (source: string, cls: string): number => source.split(`class="${cls}"`).length - 1
  expect(count(drawn('rain'), 'drop')).toBeGreaterThan(40)
  expect(count(drawn('snow'), 'flake')).toBeGreaterThan(40)
  expect(count(drawn('storm'), 'bolt')).toBe(1)
  expect(count(drawn('fog'), 'fog')).toBe(1)
  expect(count(drawn('clear'), 'cloud')).toBe(0)
  expect(count(drawn(), 'drop') + count(drawn(), 'veil')).toBe(0)
  expect(count(drawn('overcast'), 'veil')).toBe(1)
})
