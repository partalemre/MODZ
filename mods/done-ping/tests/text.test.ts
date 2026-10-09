import { expect, test } from 'claude-code/testing'

import { afplayArgv, asnOf, frontBundleOf, osascriptArgv, soundOf, terminalNotifierArgv } from '../hooks/notifier'
import { donePing, durationText, editedPath, isTestCommand, parseSeconds, permissionPing, plainSnippet, projectOf, questionPing } from '../hooks/ping'
import { appMessage } from '../hooks/ring'

test('a done ping: outcome in the title, the project as subtitle, facts in the body', () => {
  expect(durationText(134_000)).toBe('2dk 14sn')
  expect(durationText(3_720_000)).toBe('1sa 2dk')
  expect(durationText(45_000)).toBe('45sn')
  expect(projectOf('/Users/me/code/eliti')).toBe('eliti')
  expect(donePing({ project: 'eliti', durationMs: 134_000, files: 3, tests: 'pass' })).toEqual({
    kind: 'done', project: 'eliti', title: 'Tur bitti', subtitle: 'eliti', body: '3 dosya · testler geçti', detail: '2dk 14sn · 3 dosya değişti · testler geçti',
  })
})

test('with no facts the body says how long it took; failing tests say so', () => {
  expect(donePing({ project: 'x', durationMs: 61_000, files: 0, tests: null })).toMatchObject({ body: '1dk 1sn sürdü', detail: '1dk 1sn' })
  expect(donePing({ project: 'x', durationMs: 61_000, files: 1, tests: 'fail' }).body).toBe('1 dosya · testler kaldı')
  expect(isTestCommand('npm run test -- --watch=false')).toBe(true)
  expect(isTestCommand('pnpm test')).toBe(true)
  expect(isTestCommand('go test ./...')).toBe(true)
  expect(isTestCommand('ls -la')).toBe(false)
})

test('the body is cut to 80 characters and code blocks are left out', () => {
  const snippet = plainSnippet(`${'kelime '.repeat(30)}`)
  expect(snippet.length).toBe(80)
  expect(snippet.endsWith('…')).toBe(true)
  expect(plainSnippet('Bak:\n```ts\nconst a = 1\n```\n[doküman](https://x.dev) hazır')).toBe('Bak: doküman hazır')
})

test('a waiting ping names the tool but never shows a command or code', () => {
  expect(permissionPing('eliti', 'Bash', { command: 'curl -H "Authorization: sk-123" x' })).toMatchObject({ title: 'Onay bekliyor', subtitle: 'eliti', body: 'Bash komutu' })
  expect(permissionPing('eliti', 'Edit', { file_path: '/w/src/app.ts' }).body).toBe('Edit · app.ts')
  expect(permissionPing('eliti', 'WebFetch', { url: 'https://docs.example.com/a?token=1' }).body).toBe('WebFetch · docs.example.com')
  expect(permissionPing('eliti', 'Mystery', {}).body).toBe('Mystery izni')
  expect(questionPing('eliti', { questions: [{ question: 'Hangi kütüphane? `rm -rf` mi?' }] })).toMatchObject({ title: 'Cevap bekliyor', body: 'Hangi kütüphane? mi?' })
  expect(appMessage(permissionPing('eliti', 'Bash', { command: 'ls' }))).toBe('Onay bekliyor · eliti\nBash komutu')
})

test('the notification text goes in as argv, never inside the script', () => {
  const ping = { kind: 'done' as const, project: 'p', title: 'T', subtitle: 'S', body: 'say "hi" & rm -rf', detail: '' }
  const argv = osascriptArgv(ping, { kind: 'name', name: 'Glass' })
  expect(argv[0]).toBe('osascript')
  expect(argv.slice(0, 7).join(' ')).not.toContain('rm -rf')
  expect(argv.slice(7)).toEqual(['say "hi" & rm -rf', 'T', 'S', 'Glass'])
  expect(argv[4]).toContain('subtitle (item 3 of argv) sound name (item 4 of argv)')
  expect(osascriptArgv(ping, { kind: 'none' })[4]).not.toContain('sound name')
})

test('sounds: a system name, a legacy system path, a file, or none', () => {
  expect(soundOf('Hero')).toEqual({ kind: 'name', name: 'Hero' })
  expect(soundOf('/System/Library/Sounds/Glass.aiff')).toEqual({ kind: 'name', name: 'Glass' })
  expect(soundOf('/Users/me/ding.wav')).toEqual({ kind: 'file', path: '/Users/me/ding.wav' })
  expect(soundOf('none')).toEqual({ kind: 'none' })
  expect(afplayArgv(soundOf('/Users/me/ding.wav'))).toEqual(['afplay', '/Users/me/ding.wav'])
  expect(afplayArgv(soundOf('Glass'))).toBeNull()
})

test('terminal-notifier carries the host app as sender and groups by project', () => {
  const ping = { kind: 'wait' as const, project: 'p', title: 'Cevap bekliyor', subtitle: 'p', body: 'Hangisi?', detail: 'Hangisi?' }
  const argv = terminalNotifierArgv({ path: '/opt/homebrew/bin/terminal-notifier', ping, sound: { kind: 'name', name: 'Glass' }, sender: 'com.anthropic.claudefordesktop' })
  expect(argv).toEqual([
    '/opt/homebrew/bin/terminal-notifier', '-title', 'Cevap bekliyor', '-subtitle', 'p', '-message', 'Hangisi?',
    '-group', 'done-ping:p', '-sender', 'com.anthropic.claudefordesktop', '-activate', 'com.anthropic.claudefordesktop', '-sound', 'Glass',
  ])
})

test('the frontmost app is read from lsappinfo', () => {
  expect(asnOf('ASN:0x0-0x68f68f:\n')).toBe('ASN:0x0-0x68f68f')
  expect(frontBundleOf('"CFBundleIdentifier"="com.apple.Terminal"')).toBe('com.apple.Terminal')
  expect(frontBundleOf('[ NULL ] ASN:0x0-0x1: (in front)\n    bundleID="com.anthropic.claudefordesktop"')).toBe('com.anthropic.claudefordesktop')
  expect(frontBundleOf('')).toBeNull()
})

test('thresholds parse as seconds or minutes, and only edit tools count as changes', () => {
  expect(parseSeconds('90')).toBe(90)
  expect(parseSeconds('2m')).toBe(120)
  expect(parseSeconds('3dk')).toBe(180)
  expect(parseSeconds('soon')).toBeNull()
  expect(editedPath({ tool: 'Edit', file_path: 'a.ts' })).toBe('a.ts')
  expect(editedPath({ tool: 'Read', file_path: 'a.ts' })).toBeNull()
})
