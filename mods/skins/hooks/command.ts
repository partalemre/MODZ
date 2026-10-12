import type { Prefs } from '../types'
import { say } from './words'

export const DEFAULT_PREFS: Prefs = {
  skin: 'tidemark',
  icons: 'unicode',
  rail: true,
  tables: true,
  shimmer: true,
  // Off by default: another mod (hud-pro) shows usage. /skin band on brings it back.
  band: false,
  clipOutput: false,
}

// The on/off settings, by the word /skin and the settings pane use for each.
export const TOGGLES = {
  rail: 'rail',
  tables: 'tables',
  shimmer: 'shimmer',
  band: 'band',
  clip: 'clipOutput',
} as const satisfies Record<string, keyof Prefs>

export type ToggleWord = keyof typeof TOGGLES

export type Outcome = {
  prefs: Prefs
  message: string
  // `row` prints a transcript line (listings, mistakes); `toast` confirms a change quietly.
  channel: 'row' | 'toast'
}

const flagOr = (value: unknown, fallback: boolean): boolean =>
  typeof value === 'boolean' ? value : fallback

// What the store hands back may be old, hand-edited or from another version.
export function parsePrefs(raw: unknown, names: readonly string[]): Prefs {
  const saved = typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>) : {}
  const skin = saved.skin

  return {
    skin:
      typeof skin === 'string' && (skin === 'off' || names.includes(skin))
        ? skin
        : DEFAULT_PREFS.skin,
    icons: saved.icons === 'ascii' ? 'ascii' : 'unicode',
    rail: flagOr(saved.rail, DEFAULT_PREFS.rail),
    tables: flagOr(saved.tables, DEFAULT_PREFS.tables),
    shimmer: flagOr(saved.shimmer, DEFAULT_PREFS.shimmer),
    band: flagOr(saved.band, DEFAULT_PREFS.band),
    clipOutput: flagOr(saved.clipOutput, DEFAULT_PREFS.clipOutput),
  }
}

const changed = (prefs: Prefs, message: string): Outcome => ({ prefs, message, channel: 'toast' })

const refused = (prefs: Prefs, message: string): Outcome => ({ prefs, message, channel: 'row' })

const onOff = (on: boolean): string => (on ? 'on' : 'off')

export const listing = (current: Prefs, names: readonly string[]): string =>
  [
    ...names.map(name => `${name === current.skin ? '●' : '○'} ${name}`),
    `${current.skin === 'off' ? '●' : '○'} off`,
    [
      `icons ${current.icons}`,
      `rail ${onOff(current.rail)}`,
      `tables ${onOff(current.tables)}`,
      `shimmer ${onOff(current.shimmer)}`,
      `band ${onOff(current.band)}`,
      `clip ${onOff(current.clipOutput)}`,
    ].join(' · '),
  ].join('\n')

const isToggle = (word: string): word is ToggleWord => Object.hasOwn(TOGGLES, word)

// Every argument but none: with none, /skin opens the settings pane instead.
export function runSkinCommand(args: string, current: Prefs, names: readonly string[]): Outcome {
  const [head = '', value] = args.trim().toLowerCase().split(/\s+/)

  if (isToggle(head)) {
    const field = TOGGLES[head]

    return value === 'on' || value === 'off'
      ? changed({ ...current, [field]: value === 'on' }, `${head} ${value}`)
      : refused(current, say().usage(head))
  }

  switch (head) {
    case 'list':
      return refused(current, listing(current, names))
    // `default` and `stock` are what people reach for when they want Claude Code's own look.
    case 'off':
    case 'default':
    case 'stock':
      return changed({ ...current, skin: 'off' }, say().skinOff)
    case 'on':
      return current.skin === 'off'
        ? changed({ ...current, skin: DEFAULT_PREFS.skin }, `skin: ${DEFAULT_PREFS.skin}`)
        : changed(current, `skin: ${current.skin}`)
    case 'icons':
      return value === 'unicode' || value === 'ascii'
        ? changed({ ...current, icons: value }, `icons: ${value}`)
        : refused(current, say().iconsUsage)
    default:
      return names.includes(head)
        ? changed({ ...current, skin: head }, `skin: ${head}`)
        : refused(current, say().unknown(head))
  }
}

export type RowContext = { args: string; isPinned: boolean; columns: number | undefined }

// /skin list also says whether this folder is pinned, and the width the last reply was
// drawn at, to tune table sizing.
export function rowReply(message: string, { args, isPinned, columns }: RowContext): string {
  if (args.trim() !== 'list') {
    return message
  }

  const width = columns === undefined ? '' : `\n${say().replyWidth(columns)}`
  const folder = isPinned ? say().folderPinned : say().folderFollows

  return `${message}\n${folder}${width}`
}
