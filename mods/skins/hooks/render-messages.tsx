import type { RenderElement } from 'claude-code'

import { replyRows } from './cards'
import { pick } from './format'
import { cardSegments, isOwnPrompt } from './messages'
import { desktopSpinnerRow, footerRow, promptRow, spinnerRow } from './rows'
import { pinned } from './pin'
import { DEFAULT_COLUMNS } from './view'
import type { Drawing } from './view'

// How often the spinner steps while a turn works.
export const FRAME_MS = 90

export async function userMessageView({ view, e, pass }: Drawing<'UserMessage'>): Promise<RenderElement> {
  const active = await view.active()

  if (active === null || !isOwnPrompt(e.props)) {
    return pass(e)
  }

  // Outside the terminal the outline's text cannot be selected, so it carries a Copy button.
  const look = view.look(active, e.surface !== 'terminal')
  const hasImages = await view.hasImages()

  // Claude Code draws the images; the text is already in the outline above them.
  return promptRow(look, e.props.text, hasImages ? await pass({ ...e, props: { ...e.props, text: '' } }) : undefined)
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

  return pinned(e, replyRows(look, { segments, maxWidth: e.viewport?.columns ?? DEFAULT_COLUMNS, Svg: look.svg }))
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

    return look.svg === undefined ? pass(e) : desktopSpinnerRow(look, { Svg: look.svg, mode: e.props.mode, text: e.props.message ?? e.props.word })
  }

  const word = pick(active.skin.spinner, e.props.word) ?? e.props.word

  if (!active.prefs.shimmer || e.props.message !== null) {
    return pass({ ...e, props: { ...e.props, word } })
  }

  const frame = await view.frame()
  const startedAt = await view.startedAt()
  const elapsedMs = startedAt === 0 ? 0 : (await view.now()) - startedAt

  return spinnerRow(view.look(active), { word, frame, elapsedMs })
}

export async function turnDurationView({ view, e, pass }: Drawing<'TurnDuration'>): Promise<RenderElement> {
  const active = await view.active()

  if (active === null) {
    return pass(e)
  }

  const turns = await view.turns()
  const word = pick(active.skin.done, e.props.word) ?? e.props.word

  return footerRow(view.look(active), { word, durationMs: e.props.durationMs, stats: turns[String(e.props.durationMs)] })
}
