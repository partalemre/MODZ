// The trail in the conversation: under a tool call's row, what the call is in words anyone follows, with a small
// picture of the kind of work it is; under a folded run of calls, the order of the work as one picture and then
// its steps, each led by the agent's own words for it. Worked out from the calls themselves (plain-trail.ts):
// no model call, no tokens, and the engine's row stays as it is, with the trail beneath it.
import type { Register, RenderElement } from 'claude-code'

import { GLYPH } from './kit/icons'
import { lang, pick } from './kit/lang'
import { KIND_ICON, kindOf, plainCall } from './kit/plain'
import { flowPic, kindPic } from './plain-flow'
import { isTold, stateOf, trailOf } from './plain-trail'
import type { Step, StepState, ToldCall } from './plain-trail'

type On = Parameters<Register>[0]
type Options = Parameters<Register>[1]
type Ui = Record<string, any>
type Draw = { ui: Ui; isText: boolean }

const WORDS = {
  en: { failed: 'did not work', stopped: 'stopped halfway', more: (n: number) => `+${n} more ${n === 1 ? 'step' : 'steps'}` },
  tr: { failed: 'başarısız oldu', stopped: 'yarıda kesildi', more: (n: number) => `+${n} adım daha` },
}

const MARK: Record<StepState, string> = { done: '✓', live: '●', failed: '✗', stopped: '—' }
const MARK_KEY: Record<StepState, string | undefined> = { done: undefined, live: 'claude', failed: 'error', stopped: undefined }

/** How a step ended, in words where it ended badly: "✗ başarısız oldu". */
export function endOf(state: StepState): string {
  const words = pick(WORDS)
  if (state === 'failed') return `${MARK.failed} ${words.failed}`

  return state === 'stopped' ? `${MARK.stopped} ${words.stopped}` : MARK[state]
}

/** A single call's step: its sentence alone, since the engine's row above already carries the agent's words. */
export function stepOfCall(call: ToldCall): Step {
  return { kind: kindOf(call.tool, call.input), text: plainCall(call.tool, call.input, lang()), note: '', count: 1, state: stateOf(call) }
}

function iconOf(draw: Draw, step: Step): RenderElement {
  const { Svg, Text } = draw.ui
  if (draw.isText) return <Text dimColor>{GLYPH[KIND_ICON[step.kind]]}</Text>
  const pic = kindPic(step.kind, step.state)

  return <Svg source={pic.source} alt={pic.alt} width={pic.width} height={pic.height} />
}

// icon · the step in the agent's words · what that means, quiet · how many calls · how it ended. The ending sits
// right after the words, not at the row's far edge, so the eye reads the step and its result together.
function stepRow(draw: Draw, step: Step, key: string, hasEnd: boolean): RenderElement {
  const { Box, Text } = draw.ui
  const tail = [step.count > 1 ? `×${step.count}` : '', hasEnd ? endOf(step.state) : ''].filter(Boolean).join(' ')

  return (
    <Box key={key} flexDirection="row" alignItems="center" columnGap={1}>
      {iconOf(draw, step)}
      <Box flexShrink={1}>
        <Text wrap="truncate-end">
          <Text>{step.text}</Text>
          {step.note === '' ? null : <Text dimColor>{` · ${step.note}`}</Text>}
        </Text>
      </Box>
      {tail === '' ? null : <Box flexShrink={0}><Text color={MARK_KEY[step.state]} dimColor={MARK_KEY[step.state] === undefined}>{tail}</Text></Box>}
    </Box>
  )
}

function under(draw: Draw, row: RenderElement, trail: RenderElement[]): RenderElement {
  const { Box } = draw.ui

  return <Box flexDirection="column">{row}{trail}</Box>
}

// A single row says its ending itself, so the step adds one only when the call went wrong.
function callTrail(draw: Draw, call: ToldCall): RenderElement[] {
  const step = stepOfCall(call)

  return [stepRow(draw, step, 'plain-0', step.state === 'failed' || step.state === 'stopped')]
}

function groupTrail(draw: Draw, calls: readonly ToldCall[]): RenderElement[] {
  const { Svg, Text } = draw.ui
  const trail = trailOf(calls, lang())
  const flow = draw.isText ? null : flowPic(trail.flow)

  return [
    flow === null ? null : <Svg key="plain-flow" source={flow.source} alt={flow.alt} width={flow.width} height={flow.height} />,
    ...trail.steps.map((step, i) => stepRow(draw, step, `plain-${i}`, true)),
    trail.more > 0 ? <Text key="plain-more" dimColor>{pick(WORDS).more(trail.more)}</Text> : null,
  ].filter((part): part is RenderElement => part !== null)
}

const drawOf = ($: any, e: any): Draw => {
  const ui = $.ui.resolve(e) as Ui

  return { ui, isText: e.surface === 'terminal' || !('Svg' in ui) }
}

export function wirePlainRows(on: On, options: Options): void {
  if (options.plainWords === false) return

  // A hook that fails costs its trail, never the row: the engine's own drawing stands.
  on('ui.render', { component: 'ToolUse' }, async ($, e, next) => {
    const row = await next(e)
    const draw = drawOf($, e)

    return isTold(e.props.tool) ? under(draw, row, callTrail(draw, e.props)) : row
  }).catch(($, e, next) => next(e))

  // A run folded into one line tells its steps under it; unfolded, each row tells its own.
  on('ui.render', { component: 'ToolGroup' }, async ($, e, next) => {
    const row = await next(e)
    const draw = drawOf($, e)
    const trail = e.props.isExpanded ? [] : groupTrail(draw, e.props.calls)

    return trail.length === 0 ? row : under(draw, row, trail)
  }).catch(($, e, next) => next(e))
}
