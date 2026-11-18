import { expect, test } from 'claude-code/testing'
import type { ModelCompleteRequest, ModelCompleteResult } from 'claude-code'

import { JUDGE_MODEL, judge } from '../hooks/kit/judge'
import type { JudgeIo } from '../hooks/kit/judge'

const LABELS = ['safe', 'risky'] as const
const QUESTION = { text: 'rm -rf build', labels: LABELS, instructions: 'Is this command risky?' }
const USAGE = { input_tokens: 0, output_tokens: 0, cache_creation_input_tokens: 0, cache_read_input_tokens: 0 }

type Calls = { model: ModelCompleteRequest[] }

function answered(text: string): ModelCompleteResult {
  return { isAnswered: true, text, usage: USAGE } as ModelCompleteResult
}

function makeIo(opts: { reply?: ModelCompleteResult }): { io: JudgeIo; calls: Calls } {
  const calls: Calls = { model: [] }
  const io: JudgeIo = {
    complete: async request => {
      calls.model.push(request)
      return opts.reply ?? answered('risky')
    },
  }

  return { io, calls }
}

test('the model answers by default, with the cheap model and a bounded call', async () => {
  const { io, calls } = makeIo({})
  expect(await judge(io, QUESTION)).toEqual({ label: 'risky' })
  expect(calls.model).toHaveLength(1)
  expect(calls.model[0]?.model).toBe(JUDGE_MODEL)
  expect(typeof calls.model[0]?.timeoutMs).toBe('number')
  expect(String(calls.model[0]?.system)).toContain('Is this command risky?')
})

test('a reply naming no label is no judgment; case and a trailing stop still match', async () => {
  expect(await judge(makeIo({ reply: answered('maybe') }).io, QUESTION)).toBeUndefined()
  expect((await judge(makeIo({ reply: answered(' Risky.\n') }).io, QUESTION))?.label).toBe('risky')
})

test('a failed, empty or rejected model call resolves undefined', async () => {
  const aborted = { isAnswered: false, reason: 'aborted', usage: USAGE } as ModelCompleteResult
  expect(await judge(makeIo({ reply: aborted }).io, QUESTION)).toBeUndefined()
  const rejecting: JudgeIo = { complete: () => Promise.reject(new Error('model not allowed')) }
  expect(await judge(rejecting, QUESTION)).toBeUndefined()
})

test('too few or repeated labels are never asked', async () => {
  const { io, calls } = makeIo({})
  expect(await judge(io, { text: 'x', labels: ['only'] })).toBeUndefined()
  expect(await judge(io, { text: 'x', labels: ['a', 'a'] })).toBeUndefined()
  expect(calls.model).toHaveLength(0)
})
