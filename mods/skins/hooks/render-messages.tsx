import type { RenderElement } from 'claude-code'

import { replyRows } from './cards'
import { pick } from './format'
import { cardSegments, isOwnPrompt } from './messages'
import { desktopSpinnerRow, footerRow, promptRow, spinnerRow } from './rows'
import { withBeneath } from './beneath'
import { pinned } from './pin'
import { DEFAULT_COLUMNS } from './view'
import type { Drawing } from './view'

// How often the spinner steps while a turn works.
export const FRAME_MS = 90

export async function userMessageView({ view, e, pass }: Drawing<'UserMessage'>): Promise<RenderElement> {
  const active = await view.active()

  // Off the terminal your messages keep Claude Code's own component: it carries the copy and
  // rewind buttons, the context menu and selectable text, which an outline would lose.
  if (active === null || e.surface !== 'terminal' || !isOwnPrompt(e.props)) {
    return pass(e)
  }

  const look = view.look(active)
  const hasImages = await view.hasImages()

  // Claude Code draws the images; the text is already in the outline above them.
  if (hasImages) return promptRow(look, e.props.text, await pass({ ...e, props: { ...e.props, text: '' } }))

  return withBeneath(look, promptRow(look, e.props.text), await pass(e))
}

// A reply keeps Claude Code's own drawing unless it holds a table to draw.
export async function replyView({ view, e, pass }: Drawing<'AssistantMessage'>): Promise<RenderElement> {
  const active = await view.active()
  const segments = active?.prefs.tables === true ? cardSegments(e.props.text) : null

  if (active === null || segments === null) {
    return pass(e)
  }

  view.drewAt(e.viewport?.columns)
  // Every surface's table names Svg, but the terminal draws it as nothing.
  const look = view.look(active, true)

  return withBeneath(look, pinned(e, replyRows(look, { segments, maxWidth: e.viewport?.columns ?? DEFAULT_COLUMNS, Svg: look.svg })), await pass(e))
}

// The terminal's spinner gets the skin's word with a shimmer; the desktop's keeps its
// word, which says what the step is doing, beside an animated icon.
export async function spinnerView({ view, e, pass }: Drawing<'Spinner'>): Promise<RenderElement> {
  const active = await view.active()

  if (active === null) {
    return pass(e)
  }

  if (e.surface !== 'terminal') {
    const look = view.look(active)

    if (look.svg === undefined) return pass(e)

    return withBeneath(look, desktopSpinnerRow(look, { Svg: look.svg, mode: e.props.mode, text: e.props.message ?? e.props.word }), await pass(e))
  }

  const word = pick(active.skin.spinner, e.props.word) ?? e.props.word

  if (!active.prefs.shimmer || e.props.message !== null) {
    return pass({ ...e, props: { ...e.props, word } })
  }

  const frame = await view.frame()
  const startedAt = await view.startedAt()
  const elapsedMs = startedAt === 0 ? 0 : (await view.now()) - startedAt

  const look = view.look(active)

  return withBeneath(look, spinnerRow(look, { word, frame, elapsedMs }), await pass(e))
}

export async function turnDurationView({ view, e, pass }: Drawing<'TurnDuration'>): Promise<RenderElement> {
  const active = await view.active()

  if (active === null) {
    return pass(e)
  }

  const turns = await view.turns()
  const word = pick(active.skin.done, e.props.word) ?? e.props.word

  const look = view.look(active)

  return withBeneath(look, footerRow(look, { word, durationMs: e.props.durationMs, stats: turns[String(e.props.durationMs)] }), await pass(e))
}
