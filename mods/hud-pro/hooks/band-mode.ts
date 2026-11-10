// Which band line shows: the full line always, alerts only, or auto. The desktop app already shows the 5-hour and
// weekly percent itself, so auto keeps the band to alerts there and draws the full line in the terminal.
// `/hud band <mode>` stores a choice that wins over the plugin setting.

export type BandMode = 'auto' | 'always' | 'alerts'

const MODES: readonly string[] = ['auto', 'always', 'alerts']

export const isBandMode = (value: unknown): value is BandMode => typeof value === 'string' && MODES.includes(value)

export const BAND_KEY = 'hud-pro.band'

// The plugin setting, and the stored `/hud band` choice that wins over it.
export const band: { setting: BandMode; chosen: BandMode | null } = { setting: 'auto', chosen: null }

export const isAlertsOnly =(mode: BandMode, isDesktop: boolean): boolean => mode === 'alerts' || (mode === 'auto' && isDesktop)

// The words after `/hud band`: a mode, or null for anything else.
export function parseBand(args: string): BandMode | null {
  const [verb, mode, ...rest] = args.trim().toLowerCase().split(/\s+/)

  return verb === 'band' && rest.length === 0 && isBandMode(mode) ? mode : null
}
