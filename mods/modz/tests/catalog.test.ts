import { expect, test } from 'claude-code/testing'

import { headline, linkCheck, loadCatalog } from '../hooks/catalog'
import type { ModInfo } from '../hooks/catalog'
import { setLang } from '../hooks/kit/lang'

const ROOT = '/m'

function market(plugins: unknown, files: Record<string, unknown> = {}) {
  const all: Record<string, string> = { [`${ROOT}/.claude-plugin/marketplace.json`]: JSON.stringify({ name: 'modz', plugins }) }
  for (const [name, manifest] of Object.entries(files)) all[`${ROOT}/mods/${name}/.claude-plugin/plugin.json`] = JSON.stringify(manifest)
  const read = async (path: string) => {
    if (all[path] === undefined) throw new Error(`ENOENT ${path}`)

    return all[path]
  }

  return { read, root: ROOT }
}

const local = (name: string, extra: object = {}) => ({ name, source: `./mods/${name}`, ...extra })
const byName = (mods: ModInfo[], name: string) => mods.find(mod => mod.name === name)

test('a bad marketplace entry becomes an unhealthy row and the others still load', async () => {
  setLang('tr')
  const plugins = [null, 'text', {}, { name: 'noSource' }, { name: 'remote', source: { source: 'github', repo: 'o/r' } }, local('good')]
  const { mods } = await loadCatalog({ ...market(plugins, { good: { version: '1.0.0', description: 'ok' } }) })

  expect(mods).toHaveLength(6)
  expect(mods.filter(mod => !mod.isHealthy)).toHaveLength(5)
  expect(byName(mods, 'good')?.isHealthy).toBe(true)
  expect(mods[0]?.description).toBe('marketplace kaydı geçersiz')
  expect(byName(mods, 'noSource')?.description).toBe('marketplace kaydı geçersiz')
  expect(byName(mods, 'remote')?.description).toContain('o/r')
  expect(new Set(mods.map(mod => mod.name)).size).toBe(6)
})

test('a missing or non-array plugins list gives an empty catalog, not a throw', async () => {
  for (const plugins of [undefined, null, { a: 1 }, 'x']) expect((await loadCatalog(market(plugins))).mods).toEqual([])
})

test('a readable manifest without version is healthy and falls back to the marketplace entry', async () => {
  const plugins = [local('a', { version: '9.9.9', description: 'from market' }), local('b'), local('c', { description: 'only market' })]
  const { mods } = await loadCatalog(market(plugins, { a: { description: 'from manifest' }, b: {}, c: {} }))

  expect(byName(mods, 'a')).toMatchObject({ isHealthy: true, version: '9.9.9', description: 'from manifest' })
  expect(byName(mods, 'b')).toMatchObject({ isHealthy: true, version: null })
  expect(byName(mods, 'c')).toMatchObject({ isHealthy: true, description: 'only market' })
})

test('plugin.json okunamadı is shown only when the manifest cannot be read', async () => {
  setLang('tr')
  const { mods } = await loadCatalog(market([local('gone', { description: 'from market' }), local('bare')], {}))
  const base = market([local('broken')])
  const read = async (path: string) => (path.endsWith('plugin.json') ? '{ not json' : base.read(path))

  expect(byName(mods, 'gone')).toMatchObject({ isHealthy: false, description: 'from market' })
  expect(byName(mods, 'bare')).toMatchObject({ isHealthy: false, description: 'plugin.json okunamadı' })
  expect((await loadCatalog({ read, root: ROOT })).mods[0]).toMatchObject({ isHealthy: false, description: 'plugin.json okunamadı' })
})

test('enabled state: settings false wins, settings true or a skills link is on, else unknown', async () => {
  const names = ['off', 'on', 'linked', 'offLinked', 'none']
  const linked = new Set(['linked', 'offLinked'])
  const files = Object.fromEntries(names.map(name => [name, { version: '1.0.0' }]))
  const { mods } = await loadCatalog({
    ...market(names.map(name => local(name)), files),
    enabledPlugins: { 'off@modz': false, 'on@modz': true, 'offLinked@modz': false, 'other@elsewhere': true },
    hasLink: async name => linked.has(name),
  })

  expect(Object.fromEntries(mods.map(mod => [mod.name, mod.isEnabled]))).toEqual({ off: false, on: true, linked: true, offLinked: false, none: null })
})

test('a failing or absent link check, and an unsafe name, leave the state unknown', async () => {
  const files = { a: { version: '1' }, '../x': { version: '1' } }
  const seen: string[] = []
  const hasLink = async (name: string) => {
    seen.push(name)
    throw new Error('boom')
  }
  const { mods } = await loadCatalog({ ...market([local('a'), { name: '../x', source: './mods/a' }], files), hasLink })

  expect(mods.map(mod => mod.isEnabled)).toEqual([null, null])
  expect(seen).toEqual(['a'])
  expect((await loadCatalog(market([local('a')], files))).mods[0]?.isEnabled).toBeNull()
})

test("a link counts from the user's skills folder or the project's, and a failing check is no link", async () => {
  const present = new Set(['/home/u/.claude/skills/user-mod', '/repo/.claude/skills/cloud-mod'])
  const asked: string[] = []
  const hasLink = linkCheck({
    roots: ['/home/u', undefined, '/repo'],
    exists: async path => {
      asked.push(path)
      if (path.endsWith('/broken')) throw new Error('EACCES')

      return present.has(path)
    },
  })

  expect(await hasLink('user-mod')).toBe(true)
  expect(await hasLink('cloud-mod')).toBe(true)
  expect(await hasLink('broken')).toBe(false)
  expect(await hasLink('none')).toBe(false)
  expect(asked).toContain('/repo/.claude/skills/cloud-mod')
  expect(asked.some(path => path.includes('undefined'))).toBe(false)
})

test('the headline counts against known mods and reports the unknown ones', () => {
  const mod = (isEnabled: boolean | null) => ({ isEnabled }) as ModInfo
  setLang('tr')

  expect(headline([mod(true), mod(true), mod(null)])).toBe('3 mod · hepsi açık · 1 bilinmiyor')
  expect(headline([mod(true), mod(false), mod(null), mod(null)])).toBe('4 mod · 1 açık · 2 bilinmiyor')
  expect(headline([mod(null), mod(null)])).toBe('2 mod')
  expect(headline([mod(false)])).toBe('1 mod · 0 açık')
})
