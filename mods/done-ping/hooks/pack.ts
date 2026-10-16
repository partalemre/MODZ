import type { PingKind } from './ping'

// The optional sound packs: two clips each under sounds/<pack>/, made by tools/sounds/make.py.
// A finished turn (passed or failed) plays `done`; Claude waiting on you plays `wait`.
export const SOUND_PACKS = ['off', 'chime', 'soft', 'retro'] as const

export type SoundPack = (typeof SOUND_PACKS)[number]

export function packOf(value: unknown): SoundPack {
  return SOUND_PACKS.find(pack => pack === value) ?? 'off'
}

/** The clip a ping plays, as `$.audio.play({ asset })` takes it (relative to the mod's folder), or null when off. */
export function packAsset(pack: SoundPack, kind: PingKind): string | null {
  if (pack === 'off') return null

  return `sounds/${pack}/${kind === 'wait' ? 'wait' : 'done'}.wav`
}
