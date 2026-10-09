import { expect, test } from 'claude-code/testing'

import { OTHERS, SURFACES, setup } from './fixtures'

// The `progress` and `step` rows fold away in the transcript; anything else, or a failed call, stays.

const PROGRESS = 'mcp__savvy-progress__progress'
const STEP = 'mcp__savvy-progress__step'

// Each mount is its own instance, as each row of a transcript is.
let seq = 0
const nextId = () => `tu${++seq}`

type Surface = (typeof SURFACES)[number]

const row = (surface: Surface, tool: string, extra = {}) => {
  const id = nextId()
  return {
    plugin: 'savvy-progress',
    surface,
    component: 'ToolUse' as const,
    requestId: id,
    props: { tool_use_id: id, tool, input: {}, isRunning: false, isErrored: false, isInterrupted: false, ...extra },
  }
}

const group = (surface: Surface, tools: string[]) => ({
  plugin: 'savvy-progress',
  surface,
  component: 'ToolGroup' as const,
  requestId: nextId(),
  props: { calls: tools.map(tool => ({ tool, input: {}, isRunning: false, isErrored: false, isInterrupted: false })), isActive: false, isExpanded: false },
})

const isEmptyBox = (tree: any) => tree?.type === 'Box' && (tree.children ?? []).length === 0

for (const surface of SURFACES) {
  test(`${surface}: a progress or step call that went well draws nothing`, async ($, on) => {
    await setup($, on)
    for (const tool of [PROGRESS, STEP]) expect(isEmptyBox(await (await $.ui.mount(row(surface, tool))).drawn())).toBe(true)
    const id = nextId()
    const result = { plugin: 'savvy-progress', surface, component: 'ToolResult' as const, requestId: id, props: { tool_use_id: id, tool: PROGRESS, output: 'ok', isErrored: false } }
    expect(isEmptyBox(await (await $.ui.mount(result)).drawn())).toBe(true)
  })

  test(`${surface}: other tools and failed calls keep the engine's row`, async ($, on) => {
    await setup($, on)
    expect(await (await $.ui.mount(row(surface, 'Bash'))).drawn()).toEqual(OTHERS)
    expect(await (await $.ui.mount(row(surface, PROGRESS, { isErrored: true }))).drawn()).toEqual(OTHERS)
    expect(await (await $.ui.mount(row(surface, STEP, { isInterrupted: true }))).drawn()).toEqual(OTHERS)
  })

  test(`${surface}: a group of only these calls folds away, a mixed one keeps its count line`, async ($, on) => {
    await setup($, on)
    expect(isEmptyBox(await (await $.ui.mount(group(surface, [PROGRESS, PROGRESS]))).drawn())).toBe(true)
    expect(await (await $.ui.mount(group(surface, [PROGRESS, 'Read']))).drawn()).toEqual(OTHERS)
  })
}
