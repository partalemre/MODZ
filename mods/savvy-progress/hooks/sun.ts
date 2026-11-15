import type { Weather } from './weather'

// When the sun rises and sets at a place, worked out on this machine (no network), and what that makes of the
// strip's sky right now. The formulas are the usual sunrise equation, good to a few minutes.

export type Place = { lat: number; lon: number }
export type Phase = 'dawn' | 'day' | 'dusk' | 'night'
/** `at`: how far the sun (by night, the moon) is across the sky, 0 at its rising and 1 at its setting. */
export type Sky = { phase: Phase; at: number; weather?: Weather | undefined }

const DAY_MS = 86_400_000
const RAD = Math.PI / 180
const J2000 = 2451545
const UNIX_EPOCH_JULIAN = 2440587.5
// The sun's centre is this far under the horizon when its upper edge shows, the air's bending included.
const RISE_ANGLE = -0.833 * RAD
const TILT = 23.4397 * RAD

/** Today's sunrise and sunset at `place` in epoch ms, or which of day and night lasts all day near the poles. */
export function sunTimes(now: number, place: Place): { rise: number; set: number } | 'day' | 'night' {
  const turn = -place.lon / 360
  const days = Math.round(now / DAY_MS + UNIX_EPOCH_JULIAN - J2000 - 0.0009 - turn) + 0.0009 + turn
  const anomaly = RAD * (357.5291 + 0.98560028 * days)
  const centre = RAD * (1.9148 * Math.sin(anomaly) + 0.02 * Math.sin(2 * anomaly) + 0.0003 * Math.sin(3 * anomaly))
  const longitude = anomaly + centre + RAD * 102.9372 + Math.PI
  const noon = J2000 + days + 0.0053 * Math.sin(anomaly) - 0.0069 * Math.sin(2 * longitude)
  const tilt = Math.asin(Math.sin(longitude) * Math.sin(TILT))
  const lat = place.lat * RAD
  const cos = (Math.sin(RISE_ANGLE) - Math.sin(lat) * Math.sin(tilt)) / (Math.cos(lat) * Math.cos(tilt))
  if (cos > 1) return 'night'
  if (cos < -1) return 'day'
  const half = Math.acos(cos) / (2 * Math.PI)
  const toMs = (julian: number): number => (julian - UNIX_EPOCH_JULIAN) * DAY_MS

  return { rise: toMs(noon - half), set: toMs(noon + half) }
}

// Where no place is known the sun keeps office hours by the machine's own clock.
const clockTimes = (now: number): { rise: number; set: number } => ({ rise: new Date(now).setHours(6, 30, 0, 0), set: new Date(now).setHours(18, 30, 0, 0) })

// The sky glows this long on each side of a sunrise and of a sunset.
const GLOW_MS = 45 * 60_000
// The sun moves in steps this fine, so the scene's source changes every few minutes, not every redraw.
const STEPS = 120
const stepped = (at: number): number => Math.round(Math.min(1, Math.max(0, at)) * STEPS) / STEPS

export function skyOf(now: number, place: Place | undefined): Sky {
  const times = place === undefined ? clockTimes(now) : sunTimes(now, place)
  if (times === 'day' || times === 'night') return { phase: times, at: 0.5 }
  const { rise, set } = times
  if (now >= rise && now <= set) {
    const phase = now < rise + GLOW_MS ? 'dawn' : now > set - GLOW_MS ? 'dusk' : 'day'

    return { phase, at: stepped((now - rise) / (set - rise)) }
  }
  if (now < rise && now >= rise - GLOW_MS) return { phase: 'dawn', at: 0 }
  if (now > set && now <= set + GLOW_MS) return { phase: 'dusk', at: 1 }
  // The moon crosses the night as the sun crosses the day; last night's sunset and tomorrow's sunrise are taken
  // a day off today's, which is right to a couple of minutes.
  const dusk = now < rise ? set - DAY_MS : set
  const dawn = now < rise ? rise : rise + DAY_MS

  return { phase: 'night', at: stepped((now - dusk) / (dawn - dusk)) }
}

/** `"41.01,28.97"` (latitude, longitude) as a place. */
export function placeFromText(text: string | undefined): Place | undefined {
  const [lat, lon] = (text ?? '').split(',').map(Number)
  if (lat === undefined || lon === undefined || !(Math.abs(lat) <= 90) || !(Math.abs(lon) <= 180)) return undefined

  return { lat, lon }
}

// zone.tab writes a place as ±DDMM±DDDMM, or with seconds as ±DDMMSS±DDDMMSS.
const ZONE_PLACE = /^([+-])(\d{2})(\d{2})(\d{2})?([+-])(\d{3})(\d{2})(\d{2})?$/
const degrees = (sign: string, deg: string, min: string, sec = '0'): number => (sign === '-' ? -1 : 1) * (Number(deg) + Number(min) / 60 + Number(sec) / 3600)

/**
 * The main city of time zone `zone`, from the system's own table of zones (`zone.tab`).
 * shortcut: a zone's main city stands in for the real place (up to ~40 min off across a wide zone such as
 * Turkey's); MODZ_PLACE gives the exact spot.
 */
export function placeOfZone(zoneTab: string, zone: string): Place | undefined {
  const row = zoneTab.split('\n').find(line => line.split('\t')[2] === zone)
  const found = ZONE_PLACE.exec(row?.split('\t')[1] ?? '')
  if (found === null) return undefined
  const [, latSign = '+', latDeg = '0', latMin = '0', latSec, lonSign = '+', lonDeg = '0', lonMin = '0', lonSec] = found

  return { lat: degrees(latSign, latDeg, latMin, latSec), lon: degrees(lonSign, lonDeg, lonMin, lonSec) }
}
