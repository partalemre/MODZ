import { mock } from 'claude-code/testing'

// A session whose only fake boundary is `gh`: what `gh pr view` answers is what the test sets.

export const PR_URL = 'https://github.com/acme/shop/pull/7'
export const CALL_ID = 'call-1'

export const openPr = (over: Record<string, unknown> = {}) => ({
  title: 'Add the checkout page',
  state: 'OPEN',
  isDraft: false,
  additions: 120,
  deletions: 8,
  changedFiles: 2,
  files: [{ path: 'src/a.ts', additions: 1, deletions: 0 }, { path: 'src/checkout.tsx', additions: 119, deletions: 8 }],
  statusCheckRollup: [
    { name: 'build', status: 'COMPLETED', conclusion: 'SUCCESS' },
    { context: 'lint', state: 'SUCCESS' },
  ],
  reviewDecision: 'APPROVED',
  mergeable: 'MERGEABLE',
  mergeStateStatus: 'CLEAN',
  ...over,
})

export type Gh = { calls: string[][]; hasGh: boolean; answer: unknown; exitCode: number; bashOut: string }
export const newGh = (over: Partial<Gh> = {}): Gh => ({ calls: [], hasGh: true, answer: openPr(), exitCode: 0, bashOut: `Creating pull request\n${PR_URL}\n`, ...over })

export async function setup($: any, on: any, spec: { gh: Gh; surface?: string; lang?: string }) {
  const { gh } = spec
  const clock = mock.clock(on)
  mock.env(on, { MODZ_LANG: spec.lang ?? 'en' })
  on('ui.log', () => ({ value: undefined }))
  on('ui.render', () => ({ type: 'engine', ref: 1 }))
  on('session.start', () => ({ cwd: '/w' }))
  on('session.cwd', () => ({ value: '/w' }))
  on('tool.call', () => ({ result: { stdout: gh.bashOut, stderr: '' }, text: gh.bashOut }))
  on('process.run', async (_: any, e: any) => {
    gh.calls.push([...e.argv])
    if (!gh.hasGh) return { deny: 'gh: not found' }

    return { value: { exitCode: gh.exitCode, stdout: JSON.stringify(gh.answer), stderr: '' } }
  })
  await $.session.start({ surface: spec.surface ?? 'desktop', isInteractive: true, cwd: '/w' })
  await clock.settle()

  return clock
}

export async function openThePr($: any, clock: any, command = 'git push && gh pr create --fill') {
  await $.tool.call({ tool: 'Bash', command, tool_use_id: CALL_ID })
  await clock.settle()
}

export const groupOf = (surface: string, output: unknown = `${PR_URL}\n`, command = 'gh pr create --fill') => ({
  plugin: 'pr-card',
  surface,
  component: 'ToolGroup' as const,
  requestId: 'g1',
  props: { calls: [{ tool_use_id: CALL_ID, tool: 'Bash', input: { command }, isRunning: false, isErrored: false, isInterrupted: false, output }], isActive: false, isExpanded: false },
})

export const altOf = async (ui: any): Promise<string> => (await ui.find({ type: 'Svg' }))?.props?.alt ?? ''
export const sourceOf = async (ui: any): Promise<string> => (await ui.find({ type: 'Svg' }))?.props?.source ?? ''
