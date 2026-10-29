import { expect, test } from 'claude-code/testing'

import { needsReminder, reminderOf, targetOf } from '../hooks/reply-language'
import { stubWorld } from './world'

const TURKISH = { name: 'Turkish' }

const ENGLISH_OUT =
  'The build finished, but two of the tests failed. The first one expects the parser to return an empty list when the ' +
  'input has no rows, and it was given a header line instead. The second one is a timeout: the server did not answer ' +
  'within the five seconds the suite allows, which usually means it was still starting.'

const TURKISH_OUT =
  'Derleme bitti ama testlerden ikisi başarısız oldu. Birincisi girdi boş olduğunda ayrıştırıcının boş bir liste ' +
  'döndürmesini bekliyor, ona bunun yerine bir başlık satırı verilmiş. İkincisi bir zaman aşımı: sunucu, test ' +
  'takımının izin verdiği beş saniye içinde cevap vermedi, bu da genelde hâlâ açılmakta olduğu anlamına gelir.'

const CODE_OUT = `import { readFile } from 'node:fs/promises'
export async function load(path: string): Promise<Config> {
  const text = await readFile(path, 'utf8')
  const parsed = JSON.parse(text) as Partial<Config>
  for (const key of REQUIRED) if (!(key in parsed)) throw new Error(\`missing \${key}\`)
  return { ...DEFAULTS, ...parsed, loadedAt: Date.now() }
}`

test('English prose asks for the reminder; Turkish prose, code and short output do not', () => {
  const target = targetOf({ setting: undefined, uiLang: 'tr' })!
  expect(needsReminder({ text: ENGLISH_OUT, target })).toBe(true)
  expect(needsReminder({ text: TURKISH_OUT, target })).toBe(false)
  expect(needsReminder({ text: CODE_OUT, target })).toBe(false)
  expect(needsReminder({ text: 'The file was not found.', target })).toBe(false)
})

test('the language setting wins over MODZ_LANG; English or nothing means no target', () => {
  expect(targetOf({ setting: 'turkish', uiLang: 'en' })).toMatchObject(TURKISH)
  expect(targetOf({ setting: 'Türkçe', uiLang: 'en' })).toMatchObject(TURKISH)
  expect(targetOf({ setting: 'english', uiLang: 'tr' })).toBeUndefined()
  expect(targetOf({ setting: undefined, uiLang: 'tr' })).toMatchObject(TURKISH)
  expect(targetOf({ setting: '', uiLang: 'en' })).toBeUndefined()
  // A language with no word table is judged on the English alone.
  const japanese = targetOf({ setting: 'japanese', uiLang: 'en' })!
  expect(japanese).toEqual({ name: 'japanese' })
  expect(needsReminder({ text: ENGLISH_OUT, target: japanese })).toBe(true)
  expect(reminderOf(japanese)).toBe("Reply in japanese, the user's language; keep code, paths and identifiers as they are.")
})

const OUTPUTS: Record<string, string> = { english: ENGLISH_OUT, turkish: TURKISH_OUT, code: CODE_OUT }

function stubTurn(on: any, env: Record<string, string>, settings: Record<string, unknown> = {}) {
  stubWorld(on, { env, settings })
  on('turn.start', (_: unknown, e: { turnId: string }) => ({ turnId: e.turnId }))
  on('tool.call', (_: unknown, e: { command: string }) => ({ result: {}, text: OUTPUTS[e.command] }))
}

const run = async ($: any, command: string) => ((await $.tool.call({ tool: 'Bash', command })) as { context?: string[] }).context ?? []

async function begin($: any, turnId: string) {
  await $.turn.start({ text: 'testleri çalıştır', turnId })
}

test('one reminder per turn, after the first English output, and again in the next turn', async ($: any, on: any) => {
  stubTurn(on, { MODZ_LANG: 'tr' })
  await $.session.start({ surface: 'terminal', isInteractive: true, cwd: '/work' })
  await begin($, 't1')
  expect(await run($, 'turkish')).toEqual([])
  expect(await run($, 'code')).toEqual([])
  expect(await run($, 'english')).toEqual([reminderOf({ name: 'Turkish' })])
  expect(await run($, 'english')).toEqual([])
  await begin($, 't2')
  expect(await run($, 'english')).toEqual([reminderOf({ name: 'Turkish' })])
})

test('no target language: English output passes untouched', async ($: any, on: any) => {
  stubTurn(on, {})
  await $.session.start({ surface: 'terminal', isInteractive: true, cwd: '/work' })
  await begin($, 't1')
  expect(await run($, 'english')).toEqual([])
})

test("Claude Code's language setting sets the target with no MODZ_LANG", async ($: any, on: any) => {
  stubTurn(on, {}, { language: 'turkish' })
  await $.session.start({ surface: 'terminal', isInteractive: true, cwd: '/work' })
  await begin($, 't1')
  expect(await run($, 'english')).toEqual([reminderOf({ name: 'Turkish' })])
})

test('turned off: no reminder even in Turkish', { options: { keepReplyLanguage: false } }, async ($: any, on: any) => {
  stubTurn(on, { MODZ_LANG: 'tr' })
  await $.session.start({ surface: 'terminal', isInteractive: true, cwd: '/work' })
  await begin($, 't1')
  expect(await run($, 'english')).toEqual([])
})
