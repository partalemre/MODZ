import { expect, test } from 'claude-code/testing'

import type { FileNode } from '../types'
import { desktopRow, type RowCtx } from '../hooks/rowspec'
import { DARK } from '../hooks/theme'
import { emptyTree } from '../hooks/tree'

const NOW = 1_800_000_000_000
const fileAt = (name: string): FileNode => ({ id: `/r/${name}`, name, parent: '/r', kind: 'file', hidden: false, size: 1, mtime: NOW - 86_400_000 * 3 }) as FileNode

function ctxOf(width: number): RowCtx {
  const none = new Set<string>()
  return { t: emptyTree('/r'), bright: none, dimmed: none, ignored: none, untracked: none, width, now: NOW, unicode: true, theme: {} as RowCtx['theme'], pal: DARK, pillOf: () => '', costOf: () => '' }
}
const nameOf = (row: ReturnType<typeof desktopRow>) => row.left.at(-1)?.t

test('a name keeps its room: the date goes first, then the middle of the name', () => {
  const long = fileAt('a-rather-long-file-name-for-a-pane.test.tsx')
  const wide = desktopRow(ctxOf(62), { node: long, depth: 1, open: false } as any)
  expect(nameOf(wide)).toBe(long.name)
  expect(wide.right).toHaveLength(1)
  const narrow = desktopRow(ctxOf(39), { node: long, depth: 1, open: false } as any)
  expect(nameOf(narrow)).toBe(long.name)
  expect(narrow.right).toEqual([])
  const slim = desktopRow(ctxOf(28), { node: long, depth: 3, open: false } as any)
  expect(nameOf(slim)).toContain('…')
  expect(nameOf(slim)).toEndWith('.tsx')
})

test('every level is one fixed box, so names at one depth line up', () => {
  const row = desktopRow(ctxOf(40), { node: fileAt('a.ts'), depth: 2, open: false } as any)
  expect(row.left.slice(0, 3).map(s => s.cells)).toEqual([2, 2, 2])
  expect(row.left.slice(0, 2).map(s => s.t)).toEqual(['│', '│'])
})
