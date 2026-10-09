// MODZ kit — the rules of a button row, as pure data (DESIGN.md §4): at most one primary
// (the suggested path), then secondary, then plain. On danger the safe choice holds the
// focus, a destructive button is never the inviting primary, and it gets a letter hotkey.
import type { UiPressArgument } from 'claude-code'

export type ButtonVariant = 'primary' | 'secondary' | 'plain'

export type ButtonSpec = {
  label: string
  onPress: (e: UiPressArgument) => void
  variant?: ButtonVariant
  hotkey?: string
  key?: string
  isSafe?: boolean
  isDestructive?: boolean
}

export type PlannedButton = ButtonSpec & { variant: ButtonVariant; isFocused: boolean }

const RANK: Record<ButtonVariant, number> = { primary: 0, secondary: 1, plain: 2 }
const ASCII: Record<string, string> = { ç: 'c', ğ: 'g', ı: 'i', ö: 'o', ş: 's', ü: 'u' }

// The first letter of the label that is free as a hotkey, folded to a–z.
function letterFor(label: string, taken: ReadonlySet<string>): string | undefined {
  for (const char of label.toLocaleLowerCase('tr')) {
    const letter = ASCII[char] ?? char
    if (/^[a-z]$/.test(letter) && !taken.has(letter)) return letter
  }

  return undefined
}

function demote(buttons: readonly ButtonSpec[], isDanger: boolean): ButtonSpec[] {
  let hasPrimary = false

  return buttons.map(button => {
    const wantsPrimary = (button.variant ?? 'secondary') === 'primary' && !(isDanger && button.isDestructive)
    const variant: ButtonVariant = wantsPrimary && !hasPrimary ? 'primary' : button.variant === 'plain' ? 'plain' : 'secondary'
    hasPrimary = hasPrimary || variant === 'primary'
    return { ...button, variant }
  })
}

function focusIndex(buttons: readonly ButtonSpec[], isDanger: boolean): number {
  if (!isDanger) return -1

  const safe = buttons.findIndex(button => button.isSafe)
  return safe >= 0 ? safe : buttons.findIndex(button => !button.isDestructive)
}

export function planButtons(buttons: readonly ButtonSpec[], isDanger = false): PlannedButton[] {
  const ordered = demote(buttons, isDanger)
    .map((button, i) => ({ button, i }))
    .sort((a, b) => RANK[a.button.variant ?? 'secondary'] - RANK[b.button.variant ?? 'secondary'] || a.i - b.i)
    .map(({ button }) => button)
  const focus = focusIndex(ordered, isDanger)
  const taken = new Set(ordered.map(button => button.hotkey).filter((key): key is string => key !== undefined))

  return ordered.map((button, i) => {
    const hotkey = button.hotkey ?? (isDanger && button.isDestructive ? letterFor(button.label, taken) : undefined)
    if (hotkey) taken.add(hotkey)
    return { ...button, variant: button.variant ?? 'secondary', hotkey, isFocused: i === focus }
  })
}
