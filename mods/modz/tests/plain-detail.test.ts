// What a single call's trail adds so a person can follow it: the files a command touches, and what came back.
import { expect } from 'claude-code/testing'
import { test } from './budget'

import { commandFiles, folderOf, resultLine } from '../hooks/plain-detail'

test('a command line names its files by whole path, its own script\'s included, each once', () => {
  const command = 'cd /w/app/hooks; grep -n "note" plain-trail.ts | head; python3 - <<\'EOF\'\nopen("../types/index.d.ts").read()\nopen("plain-trail.ts")\nEOF'

  expect(folderOf(command)).toBe('/w/app/hooks')
  expect(commandFiles({ command }).map(file => file.name)).toEqual(['plain-trail.ts', 'index.d.ts'])
  expect(commandFiles({ command })[0]?.path).toBe('/w/app/hooks/plain-trail.ts')
  // With no folder to stand in, a bare name cannot be opened, so it is left out.
  expect(commandFiles({ command: 'grep note plain-trail.ts' })).toEqual([])
  expect(commandFiles({ command: 'cat /w/a.ts /w/a.ts' }).length).toBe(1)
  expect(commandFiles({ file_path: '/w/a.ts' })).toEqual([])
})

test('what came back is one line: its first line, how much more, and a search that found nothing says so', () => {
  expect(resultLine({ tool: 'Bash', output: { stdout: '17: note\n18: step.note\n\n27: more' } }, 'tr')).toBe('→ 17: note (+2 satır daha)')
  expect(resultLine({ tool: 'Bash', output: 'built: modz' }, 'en')).toBe('→ built: modz')
  expect(resultLine({ tool: 'Grep', output: '' }, 'tr')).toBe('→ hiçbir şey bulamadı')
  expect(resultLine({ tool: 'Bash', output: '' }, 'tr')).toBe('')
  expect(resultLine({ tool: 'Bash' }, 'tr')).toBe('')
  expect(resultLine({ tool: 'Read', output: 'file text' }, 'tr')).toBe('')
  expect(resultLine({ tool: 'Bash', output: 'x'.repeat(400) }, 'en').length).toBeLessThan(120)
})
