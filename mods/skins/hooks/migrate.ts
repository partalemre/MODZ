// One-time store migrations, run on load before the prefs are read. Pure: register.tsx
// reads and writes the store, since $ is not passed across modules.

// Versions up to 0.1.1 stored `band: true` only because it was the default; from 0.1.2 the
// usage band starts off (hud-pro shows usage). Once this marker is set, a band someone
// turns back on stays on.
export const BAND_OFF_KEY = 'migrated.bandOff'

type Stored = Record<string, unknown>

const isRecord = (value: unknown): value is Stored => typeof value === 'object' && value !== null && !Array.isArray(value)

// Stored prefs with the band off; anything that is not a prefs object stays as it was.
export const bandOff = (prefs: unknown): unknown => (isRecord(prefs) ? { ...prefs, band: false } : prefs)

// Every pinned folder's prefs with the band off.
export const foldersBandOff = (folders: unknown): unknown =>
  isRecord(folders)
    ? Object.fromEntries(Object.entries(folders).map(([folder, prefs]) => [folder, bandOff(prefs)]))
    : folders

// What to write back, marker last: nothing once the marker is set, else the keys that
// hold prefs to migrate.
export function bandOffWrites(marker: unknown, prefs: unknown, folders: unknown): [string, unknown][] {
  if (marker === true) {
    return []
  }

  return [
    ...(isRecord(prefs) ? [['prefs', bandOff(prefs)] as [string, unknown]] : []),
    ...(isRecord(folders) ? [['folders', foldersBandOff(folders)] as [string, unknown]] : []),
    [BAND_OFF_KEY, true],
  ]
}
