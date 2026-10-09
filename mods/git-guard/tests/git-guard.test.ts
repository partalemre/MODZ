import { expect, test } from 'claude-code/testing'

type Setup = { choice: string; branch: string }

function stubEngine(on: Parameters<Parameters<typeof test>[1]>[1], setup: Setup, asked: string[]) {
  on('process.run', () => ({ value: { exitCode: 0, stdout: `${setup.branch}\n`, stderr: '' } }))
  on('ui.log', () => ({ value: undefined }))
  on('tool.call', (_, e) => {
    if (e.tool === 'AskUserQuestion') {
      const question = e.questions[0].question
      asked.push(question)

      return { result: { answers: { [question]: setup.choice } } }
    }

    return { result: 'ran' }
  })
}

test('a safe command runs without a question', async ($, on) => {
  const asked: string[] = []
  stubEngine(on, { choice: 'Run it', branch: 'feature/x' }, asked)

  const out = await $.tool.call({ tool: 'Bash', command: 'git status' })

  expect(out).toMatchObject({ result: 'ran' })
  expect(asked).toEqual([])
})

test('a force push asks and runs when approved', async ($, on) => {
  const asked: string[] = []
  stubEngine(on, { choice: 'Run it', branch: 'feature/x' }, asked)

  const out = await $.tool.call({ tool: 'Bash', command: 'git push --force origin feature/x' })

  expect(asked).toHaveLength(1)
  expect(asked[0]).toContain('force push')
  expect(out).toMatchObject({ result: 'ran' })
})

test('a refused force push does not run', async ($, on) => {
  const asked: string[] = []
  stubEngine(on, { choice: 'Refuse', branch: 'feature/x' }, asked)

  const out = await $.tool.call({ tool: 'Bash', command: 'git push -f origin feature/x' })

  expect(out.deny).toMatch(/declined/)
})

test('a plain push from main asks, from a feature branch does not', async ($, on) => {
  const asked: string[] = []
  const setup: Setup = { choice: 'Run it', branch: 'main' }
  stubEngine(on, setup, asked)

  await $.tool.call({ tool: 'Bash', command: 'git push' })
  expect(asked).toHaveLength(1)
  expect(asked[0]).toContain('push from main')

  setup.branch = 'feature/x'
  await $.tool.call({ tool: 'Bash', command: 'git push -u origin feature/x' })
  expect(asked).toHaveLength(1)
})

test('a branch named like main does not trigger the question', async ($, on) => {
  const asked: string[] = []
  stubEngine(on, { choice: 'Run it', branch: 'feature/x' }, asked)

  await $.tool.call({ tool: 'Bash', command: 'git push origin feature/main-menu' })

  expect(asked).toEqual([])
})

test('rm -rf and git reset --hard ask', async ($, on) => {
  const asked: string[] = []
  stubEngine(on, { choice: 'Run it', branch: 'feature/x' }, asked)

  await $.tool.call({ tool: 'Bash', command: 'rm -rf build' })
  await $.tool.call({ tool: 'Bash', command: 'git reset --hard HEAD~1' })

  expect(asked).toHaveLength(2)
  expect(asked[0]).toContain('recursive delete')
  expect(asked[1]).toContain('hard reset')
})

test('the question is drawn under a risk card on both surfaces', async ($, on) => {
  const seen: Record<string, unknown> = {}
  on('process.run', () => ({ value: { exitCode: 0, stdout: 'main\n', stderr: '' } }))
  on('ui.log', () => ({ value: undefined }))
  on('ui.render', () => ({ type: 'engine', ref: 1 }))
  on('tool.call', async (_, e) => {
    if (e.tool !== 'AskUserQuestion') return { result: 'ran' }
    for (const surface of ['terminal', 'desktop'] as const) {
      const ui = await $.ui.mount({
        plugin: 'git-guard',
        component: 'AskUserQuestion',
        requestId: 'q',
        surface,
        viewport: { columns: 120, rows: 40 },
        props: { tool: 'AskUserQuestion', questions: [] },
      })
      seen[surface] = surface === 'terminal'
        ? await ui.find({ type: 'Text', text: /RISKY COMMAND/ })
        : await ui.find({ type: 'Svg' })
      await ui.unmount()
    }
    const question = e.questions[0].question

    return { result: { answers: { [question]: 'Refuse' } } }
  })

  await $.tool.call({ tool: 'Bash', command: 'git push --force origin main' })

  expect(seen.terminal).toBeDefined()
  expect((seen.desktop as any)?.props?.source).toContain('FORCE PUSH')
  expect((seen.desktop as any)?.props?.source).toContain('main')
})
