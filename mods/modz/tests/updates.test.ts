import { expect, test } from 'claude-code/testing'

import { headOf, installedCommit, isNewer, remoteOf } from '../hooks/updates'

const OLD = 'a'.repeat(40)
const NEW = 'b'.repeat(40)

test('the marketplace address comes from where it was added; a local folder has none', () => {
  const known = JSON.stringify({
    modz: { source: { source: 'github', repo: 'partalemre/MODZ' } },
    git: { source: { source: 'git', url: 'https://example.test/m.git' } },
    here: { source: { source: 'directory', path: '/m' } },
  })

  expect(remoteOf(known, 'modz')).toBe('https://github.com/partalemre/MODZ.git')
  expect(remoteOf(known, 'git')).toBe('https://example.test/m.git')
  expect(remoteOf(known, 'here')).toBeUndefined()
  expect(remoteOf('not json', 'modz')).toBeUndefined()
})

test('the installed commit is read from installed_plugins.json', () => {
  const installed = JSON.stringify({ version: 2, plugins: { 'modz@modz': [{ gitCommitSha: OLD }] } })

  expect(installedCommit(installed, 'modz@modz')).toBe(OLD)
  expect(installedCommit(installed, 'other@modz')).toBeUndefined()
  expect(installedCommit(undefined, 'modz@modz')).toBeUndefined()
})

test('an update is ready only when both commits are known and differ', () => {
  const head = headOf(`${NEW}\tHEAD\n`)

  expect(head).toBe(NEW)
  expect(isNewer(OLD, head)).toBe(true)
  expect(isNewer(NEW, head)).toBe(false)
  expect(isNewer(OLD, headOf('fatal: unable to access'))).toBe(false)
})
