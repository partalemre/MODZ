import { expect, test } from 'claude-code/testing'

import { commitOutcome, commitReason, gitDirOf, placeOf } from '../hooks/commit'
import { hubOf, isOpenFor, isSameCard } from '../hooks/hub'
import { setLang } from '../hooks/lang'

const AT = { cwd: '/Users/k/MODZ', home: '/Users/k' }

test('gitDirOf follows assignments, cd and -C to where the commit ran', () => {
  const seeded = 'P=/Users/k/playground; mkdir -p $P/src && cd $P && git init -q -b main\nprintf x > a\ngit add -A && git commit -qm "chore: seed" && bun test | tail -4'
  expect(gitDirOf(seeded, AT)).toBe('/Users/k/playground')
  expect(gitDirOf('git commit -m x', AT)).toBe('/Users/k/MODZ')
  expect(gitDirOf('cd mods && git commit -m x', AT)).toBe('/Users/k/MODZ/mods')
  expect(gitDirOf('git -C ../other commit -m x', AT)).toBe('/Users/k/other')
  expect(gitDirOf('cd ~/notes && git commit -am x', AT)).toBe('/Users/k/notes')
  expect(gitDirOf('ROOT=/Users/k/site; cd "${ROOT}/web" && git commit -m x', AT)).toBe('/Users/k/site/web')
})

test('gitDirOf says null when the folder is a guess', () => {
  expect(gitDirOf('cd "$(git rev-parse --show-toplevel)" && git commit -m x', AT)).toBe(null)
  expect(gitDirOf('cd $UNSET && git commit -m x', AT)).toBe(null)
  expect(gitDirOf('(cd sub && git commit -m x)', AT)).toBe(null)
  expect(gitDirOf('pushd sub && git commit -m x', AT)).toBe(null)
  // A subagent's loop: its folder is unknown unless the command names one.
  expect(gitDirOf('git commit -m x', { cwd: '', home: AT.home })).toBe(null)
  expect(gitDirOf('cd /Users/k/wt && git commit -m x', { cwd: '', home: AT.home })).toBe('/Users/k/wt')
})

test('placeOf keeps the tree repo here and names any other', () => {
  expect(placeOf('/Users/k/MODZ/mods', { top: '/Users/k/MODZ', isAgent: false })).toEqual({ isHere: true, name: '' })
  expect(placeOf('/Users/k/playground', { top: '/Users/k/MODZ', isAgent: false })).toEqual({ isHere: false, name: 'playground' })
  expect(placeOf(null, { top: '/Users/k/MODZ', isAgent: false }).isHere).toBe(true)
  expect(placeOf(null, { top: '/Users/k/MODZ', isAgent: true }).isHere).toBe(false)
})

test('a commit is a failure only with proof, and the reason is said plainly', () => {
  setLang('tr')
  const base = { sha: '', place: '', isDirKnown: false, hasFailed: false, text: '' }
  expect(commitOutcome({ ...base, sha: 'fed4321cba9', place: 'playground' })).toEqual({ state: 'done', label: 'commit edildi · playground', detail: 'fed4321' })
  expect(commitOutcome({ ...base, text: 'On branch main\nnothing to commit, working tree clean' }).label).toBe('commit olmadı: değişiklik yok')
  expect(commitOutcome({ ...base, isDirKnown: true })).toEqual({ state: 'failed', label: 'commit oluşmadı', detail: '' })
  expect(commitOutcome(base)).toEqual({ state: 'done', label: 'git commit çalıştı', detail: '' })
  expect(commitReason('Author identity unknown\n*** Please tell me who you are.')).toBe('git kimliği ayarlı değil')
  expect(commitReason('husky - pre-commit hook exited with code 1')).toBe('bir git kancası durdurdu')
  expect(commitReason('[main abc1234] feat: x')).toBe('')
})

test('hub card: live files this turn, then uncommitted work, then clean', () => {
  setLang('tr')
  expect(hubOf({ isRunning: true, touched: 4, hasRepo: true, changed: 3 })).toEqual({ detail: '4 dosya bu tur', tone: 'live' })
  expect(hubOf({ isRunning: false, touched: 4, hasRepo: true, changed: 3 })).toEqual({ detail: '3 değişiklik commit edilmedi', tone: 'warn' })
  expect(hubOf({ isRunning: true, touched: 0, hasRepo: true, changed: 0 })).toEqual({ detail: 'temiz', tone: 'ok' })
  expect(hubOf({ isRunning: false, touched: 0, hasRepo: false, changed: 0 }).tone).toBe('idle')
  for (const n of [1, 999_999]) expect(hubOf({ isRunning: false, touched: 0, hasRepo: true, changed: n }).detail.length).toBeLessThanOrEqual(40)
  // After the turn: its commit on a clean tree, or what it edited where there is no git.
  expect(hubOf({ isRunning: false, touched: 2, hasRepo: true, changed: 0, edited: 2, sha: 'b7d2e91c3a' })).toEqual({ detail: 'commit b7d2e91 · temiz', tone: 'ok' })
  expect(hubOf({ isRunning: false, touched: 4, hasRepo: false, changed: 0, edited: 1 })).toEqual({ detail: 'son tur 1 dosya düzenlendi', tone: 'idle' })
  expect(hubOf({ isRunning: false, touched: 3, hasRepo: false, changed: 0, edited: 0 })).toEqual({ detail: 'git deposu yok', tone: 'idle' })
  expect(hubOf({ isRunning: false, touched: 0, hasRepo: false, changed: 0, edited: 999_999 }).detail.length).toBeLessThanOrEqual(40)
  expect(isSameCard({ pane: 'files', detail: 'temiz', tone: 'ok', at: 1 }, { detail: 'temiz', tone: 'ok' })).toBe(true)
  expect(isSameCard(undefined, { detail: 'temiz', tone: 'ok' })).toBe(false)
})

test('an open request matches this pane only', () => {
  expect(isOpenFor({ pane: 'files', at: 1 }, 'files')).toBe(true)
  expect(isOpenFor({ pane: 'agents', at: 1 }, 'files')).toBe(false)
  expect(isOpenFor(null, 'files')).toBe(false)
})
