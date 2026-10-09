// MODZ kit (Tidemark): the desktop focus race. Source of truth is kit/ in the MODZ repo.
//
// A click on a Pane that does not hold the keyboard gives it focus first. That flips the Pane's
// `isFocused` prop, so the engine redraws it and every Button in the new tree gets a new handle,
// releasing the old ones only once the new tree is returned. The click itself arrives a moment later
// carrying the old handle; if the redraw has already finished, the engine refuses it
// ("ui_press not handled") and the person has to click again. Holding a focus-only redraw back for a
// beat keeps the old tree's handles alive until that click has landed.

export const FOCUS_SETTLE_MS = 350

type FocusProps = { isFocused?: boolean }
type Site = { surface: string; requestId: string; props: unknown }

const lastFocus = new Map<string, boolean>()

// True when this render differs from the last one of the same site only by having gained or lost focus.
export function isFocusFlip(site: Site): boolean {
  const isFocused = (site.props as FocusProps | undefined)?.isFocused
  if (typeof isFocused !== 'boolean') return false
  const key = `${site.surface}\u0000${site.requestId}`
  const before = lastFocus.get(key)
  lastFocus.set(key, isFocused)
  return before !== undefined && before !== isFocused
}

// Await at the top of a Pane's ui.render hook: `await settleFocus(e, ms => $.clock.sleep(ms))`.
export async function settleFocus(site: Site, sleep: (ms: number) => Promise<void>): Promise<void> {
  if (isFocusFlip(site)) await sleep(FOCUS_SETTLE_MS)
}
