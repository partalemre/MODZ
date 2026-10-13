import { expect, test } from 'claude-code/testing'
import type { HttpInit, HttpResponse, ModelCompleteRequest, ModelCompleteResult } from 'claude-code'

import { JEV_URL, JUDGE_MODEL, judge } from '../hooks/kit/judge'
import type { JudgeIo } from '../hooks/kit/judge'

const LABELS = ['safe', 'risky'] as const
const QUESTION = { text: 'rm -rf build', labels: LABELS, instructions: 'Is this command risky?' }
// Built at run time so no scanner mistakes the fixture for a real key.
const SECRET = ['sk', 'live', '0123456789abcdef'].join('-')
const USAGE = { input_tokens: 0, output_tokens: 0, cache_creation_input_tokens: 0, cache_read_input_tokens: 0 }

type Calls = { model: ModelCompleteRequest[]; http: { url: string; init: HttpInit }[] }

function answered(text: string): ModelCompleteResult {
  return { isAnswered: true, text, usage: USAGE } as ModelCompleteResult
}

function jevReply(choice: string, status = 200): HttpResponse {
  const text = JSON.stringify({ model: 'jev-1.13.0', answers: { label: { type: 'choice', choice } } })

  return { status, ok: status < 300, headers: {}, text }
}

function makeIo(opts: { reply?: ModelCompleteResult; http?: HttpResponse; env?: JudgeIo['env'] }): { io: JudgeIo; calls: Calls } {
  const calls: Calls = { model: [], http: [] }
  const io: JudgeIo = {
    complete: async request => {
      calls.model.push(request)
      return opts.reply ?? answered('risky')
    },
    env: opts.env ?? {},
    fetch: async (url, init) => {
      calls.http.push({ url, init })
      return opts.http ?? jevReply('safe')
    },
    sleep: () => new Promise<void>(() => undefined),
    redact: text => text.split(SECRET).join('sk-l****'),
  }

  return { io, calls }
}

const JEV_ENV = { backend: 'jev', typesafeKey: 'ts-test-key' }

test('the model answers by default, with the cheap model and a bounded call', async () => {
  const { io, calls } = makeIo({})
  expect(await judge(io, QUESTION)).toEqual({ label: 'risky', source: 'model', isFallback: false })
  expect(calls.http).toHaveLength(0)
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
  const { io } = makeIo({})
  const rejecting: JudgeIo = { ...io, complete: () => Promise.reject(new Error('model not allowed')) }
  expect(await judge(rejecting, QUESTION)).toBeUndefined()
})

test('too few or repeated labels are never asked', async () => {
  const { io, calls } = makeIo({})
  expect(await judge(io, { text: 'x', labels: ['only'] })).toBeUndefined()
  expect(await judge(io, { text: 'x', labels: ['a', 'a'] })).toBeUndefined()
  expect(calls.model).toHaveLength(0)
})

test('Jev answers only when both MODZ_JUDGE=jev and the key are set', async () => {
  const both = makeIo({ env: JEV_ENV })
  expect(await judge(both.io, QUESTION)).toEqual({ label: 'safe', source: 'jev', isFallback: false })
  expect(both.calls.model).toHaveLength(0)
  expect(both.calls.http[0]?.url).toBe(JEV_URL)
  expect(both.calls.http[0]?.init.headers?.authorization).toBe('Bearer ts-test-key')

  const keyOnly = makeIo({ env: { typesafeKey: 'ts-test-key' } })
  expect((await judge(keyOnly.io, QUESTION))?.source).toBe('model')
  expect(keyOnly.calls.http).toHaveLength(0)

  const askedNoKey = makeIo({ env: { backend: 'jev' } })
  expect(await judge(askedNoKey.io, QUESTION)).toEqual({ label: 'risky', source: 'model', isFallback: true })
  expect(askedNoKey.calls.http).toHaveLength(0)
})

test('without a redact function nothing goes to Jev', async () => {
  const { io, calls } = makeIo({ env: JEV_ENV })
  const bare: JudgeIo = { complete: io.complete, env: io.env, fetch: io.fetch, sleep: io.sleep }
  expect((await judge(bare, QUESTION))?.isFallback).toBe(true)
  expect(calls.http).toHaveLength(0)
})

test('the text and instructions are redacted before they leave for Jev', async () => {
  const { io, calls } = makeIo({ env: JEV_ENV })
  await judge(io, { text: `export KEY=${SECRET}`, labels: LABELS, instructions: `Does ${SECRET} leak?` })
  const body = calls.http[0]?.init.body ?? ''
  expect(body.includes(SECRET)).toBe(false)
  expect(JSON.parse(body)).toHaveProperty('state', 'export KEY=sk-l****')
  expect(JSON.parse(body)).toHaveProperty(['questions', 'label', 'criteria'], { safe: null, risky: null })
})

test('a Jev error, a stray choice, a broken body or a timeout is no judgment and no retry', async () => {
  for (const http of [jevReply('safe', 429), jevReply('unknown'), { ...jevReply('safe'), text: '<html>' }]) {
    const { io, calls } = makeIo({ env: JEV_ENV, http })
    expect(await judge(io, QUESTION)).toBeUndefined()
    expect(calls.http).toHaveLength(1)
    expect(calls.model).toHaveLength(0)
  }
  const { io } = makeIo({ env: JEV_ENV })
  const hanging: JudgeIo = { ...io, fetch: () => new Promise<HttpResponse>(() => undefined), sleep: async () => undefined }
  expect(await judge(hanging, QUESTION)).toBeUndefined()
})
