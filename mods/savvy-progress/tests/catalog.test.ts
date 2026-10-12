import { expect, test } from 'claude-code/testing'

import { BUILTIN_TYPES, blankDraft, chosenOf, describe, mergeTypes, offered, parseAgentFile, sourceWord } from '../hooks/agent-types'
import { headerSvg } from '../hooks/header-svg'
import type { HeaderData } from '../hooks/header-svg'
import { ALL_STRINGS, setLang, t } from '../hooks/i18n'
import { cardHeadSvg, pillPart } from '../hooks/card-svg'
import { reconcile } from '../hooks/roster'
import type { AgentRun } from '../types'

// These words are the Turkish ones (MODZ_LANG=tr).
setLang('tr')

// The agent-type catalogue, the roster's edge cases, the languages and the panel's drawings.

const info = (id: string, status: string, patch: Record<string, unknown> = {}) => ({ id, type: 'general-purpose', description: 'Work', status, ...patch }) as any

const run = (id: string, patch: Partial<AgentRun> = {}): AgentRun => ({
  id, agentId: id, type: 'general-purpose', description: 'Work', model: 'm', status: 'running', startedAt: 1,
  contextTokens: 0, contextMax: 1, tokens: 0, costUsd: 0, steps: 0, round: 1, toolCount: 0, ...patch,
})

test('an agent file gives its name and description; one with no name or no front matter gives none', () => {
  expect(parseAgentFile('---\nname: reviewer\ndescription: "Reviews diffs"\n---\nbody', 'project')).toEqual({ name: 'reviewer', description: 'Reviews diffs', source: 'project' })
  expect(parseAgentFile('---\ndescription: x\n---\n', 'user')).toBeNull()
  expect(parseAgentFile('name: loose\n', 'user')).toBeNull()
})

test('types merge once by name, the first source kept; nothing new keeps the same list', () => {
  const found = [{ name: 'Explore', description: 'again', source: 'plugin' }, { name: 'reviewer', description: 'a', source: 'project' }, { name: 'reviewer', description: 'b', source: 'user' }]
  const merged = mergeTypes(BUILTIN_TYPES, found)
  expect(merged.map(type => `${type.name}:${type.source}`)).toEqual(['general-purpose:built-in', 'Explore:built-in', 'Plan:built-in', 'reviewer:project'])
  expect(mergeTypes(merged, found)).toBe(merged)
})

test('the form picks the chosen type or the first; an offer keeps its first line; words are local', () => {
  expect(chosenOf(BUILTIN_TYPES, { ...blankDraft(), type: 'Plan' })?.name).toBe('Plan')
  expect(chosenOf(BUILTIN_TYPES, { ...blankDraft(), type: 'gone' })?.name).toBe('general-purpose')
  expect(offered({ agent: 'x', description: 'One line\nmore', source: 'plugin' }).description).toBe('One line')
  expect(describe(BUILTIN_TYPES[1]!)).toBe('Hızlı, salt okunur kod araması')
  expect(describe({ name: 'mine', description: '', source: 'user' })).toBe('Açıklama yok.')
  expect(sourceWord('plugin')).toBe('eklenti')
  expect(sourceWord('policySettings')).toBe('policySettings')
})

test('roster: a waiting or idle agent counts as alive; failed and completed close as such', () => {
  const added = reconcile([], [info('a1', 'pending'), info('a2', 'idle'), info('a3', 'waiting')], 4)
  expect(added.map(a => `${a.id}:${a.status}:${a.look}`)).toEqual(['a1:running:0', 'a2:running:1', 'a3:running:2'])
  const closed = reconcile([run('a1'), run('a2')], [info('a1', 'failed'), info('a2', 'completed')], 9)
  expect(closed.map(a => `${a.status}:${a.endReason ?? ''}:${a.endedAt}`)).toEqual(['failed::9', 'done::9'])
})

test('roster: an ended run is left as it ended; another type with the same words is not adopted', () => {
  const ended = [run('a1', { status: 'done', endedAt: 3 })]
  expect(reconcile(ended, [info('a1', 'killed')], 9)).toBe(ended)
  const waiting = [run('task-1', { agentId: undefined, type: 'Explore' })]
  const next = reconcile(waiting, [info('a7', 'running')], 2)
  expect(next.map(a => a.id)).toEqual(['task-1', 'a7'])
  expect(next[0]?.agentId).toBeUndefined()
})

test('roster: a run known by its own id is matched, and the list stays capped', () => {
  const byId = [run('a1', { agentId: undefined })]
  expect(reconcile(byId, [info('a1', 'running')], 2)).toBe(byId)
  const full = Array.from({ length: 200 }, (_, i) => run(`r${i}`))
  const next = reconcile(full, [info('new', 'running')], 5)
  expect(next).toHaveLength(200)
  expect(next.at(-1)?.id).toBe('new')
})

test('every language has every word, none empty', () => {
  const keys = Object.keys(ALL_STRINGS.tr).sort()
  for (const [lang, strings] of Object.entries(ALL_STRINGS)) {
    expect(Object.keys(strings).sort()).toEqual(keys)
    for (const [key, value] of Object.entries(strings)) if (typeof value === 'string') expect(`${lang}.${key}:${value.trim() ? 'ok' : 'empty'}`).toBe(`${lang}.${key}:ok`)
  }
})

test('Turkish names take their case by vowel harmony', () => {
  const s = ALL_STRINGS.tr
  expect(['Pip', 'Mako', 'Nori', 'Coral', 'Sol', 'Dune'].map(s.stopWho)).toEqual(["Pip'i durdur", "Mako'yu durdur", "Nori'yi durdur", "Coral'ı durdur", "Sol'u durdur", "Dune'yi durdur"])
  expect(['Pip', 'Mako', 'Nori', 'Coral'].map(name => s.messageTo(name).split(' ')[0])).toEqual(["Pip'e", "Mako'ya", "Nori'ye", "Coral'a"])
  setLang('en')
  expect(t().stopWho('Pip')).toBe('Stop Pip')
  setLang('tr')
})

const HEADER: HeaderData = {
  eyebrow: 'AJANLAR', counts: '2 çalışıyor', headline: 'Launch kit', percent: '—', tone: 'run', meter: null,
  stats: [{ label: 'Maliyet', value: '≈$1,68' }, { label: 'Token', value: '387k' }, { label: 'Süre', value: '0:56' }, { label: '5 saat payı', value: '≈%5,9' }],
}

test('the header lays its four figures in a row when they fit, two by two when not; an unknown percent is quiet', () => {
  const wide = headerSvg(600, HEADER)
  const narrow = headerSvg(400, HEADER)
  expect(narrow.height).toBeGreaterThan(wide.height)
  expect(wide.source).toContain('5 SAAT PAYI')
  expect(narrow.source).not.toContain('…')
  expect(wide.source).toMatch(/<text class="m"[^>]*>—<\/text>/)
  expect(headerSvg(600, { ...HEADER, percent: '%40' }).source).toMatch(/<text class="f-run"[^>]*>%40<\/text>/)
})

test('a card head keeps the task whole when it fits and gives way in the model first', () => {
  const head = { name: 'Nori', tier: 'light', tierWord: 'light', model: 'Opus 5.5 · low', title: 'Build the landing page', pill: { text: 'çalışıyor', role: 'run' as const } }
  expect(cardHeadSvg(400, head)).toContain('Build the landing page')
  expect(cardHeadSvg(400, head)).toContain(' · Opus 5.5 · low')
  const tight = cardHeadSvg(200, head)
  expect(tight).toContain('Nori')
  expect(tight).not.toContain(' · Opus 5.5 · low')
  expect(pillPart({ text: 'sessiz 3 dk', role: 'warn' }, 0, 0).body).toContain('b-warn l-warn')
})
