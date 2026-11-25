import { expect } from 'claude-code/testing'
import { test } from './budget'

import { headOf, installedCommit, installedFrom, isNewer, remoteOf, updateCommands, updatesCard } from '../hooks/updates'

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

test('the plugins installed from the marketplace make the update commands', () => {
  const installed = JSON.stringify({ plugins: { 'modz@modz': [{}], 'hud-pro@modz': [{}], 'other@elsewhere': [{}] } })
  const mods = installedFrom(installed, 'modz')

  expect(mods).toEqual(['hud-pro', 'modz'])
  expect(updateCommands('modz', mods)).toBe('claude plugin marketplace update modz && claude plugin update hud-pro@modz && claude plugin update modz@modz')
})

test('the row says a new version first, then whether updates are automatic', () => {
  const base = { isInstalled: true, isAuto: false, hasNew: false, mods: [], market: 'modz' }

  expect(updatesCard({ ...base, hasNew: true }, 0).tone).toBe('warn')
  expect(updatesCard({ ...base, isAuto: true }, 0).tone).toBe('idle')
  expect(updatesCard({ ...base, isAuto: true }, 0).detail).not.toBe(updatesCard(base, 0).detail)
})
