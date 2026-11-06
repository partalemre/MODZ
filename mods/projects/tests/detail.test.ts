import { expect, test } from 'claude-code/testing'

import { fitPath, foldText, shortPath } from '../hooks/format'
import { headerPic, isPlanTitleCut, planPic } from '../hooks/svg-detail'
import type { PlanRow, Project } from '../types'

const plan = (done: number, total: number): PlanRow => ({ path: 'p.md', mtimeMs: 0, title: 'p', done, total, steps: [] })
const percent: Project['percent'] = { kind: 'estimate', value: 62, at: 0, isStale: false, basis: '' }

test('a folder under home reads short, with either kind of slash, and a sibling stays whole', () => {
  expect(shortPath('/home/me/code/app', '/home/me')).toBe('~/code/app')
  expect(shortPath('C:\\Users\\me\\code', 'C:\\Users\\me')).toBe('~\\code')
  expect(shortPath('/home/mean/app', '/home/me')).toBe('/home/mean/app')
  expect(shortPath('/w/app', '')).toBe('/w/app')
})

test('a long path is cut in its middle, keeping its ends', () => {
  const measure = (text: string) => text.length
  expect(fitPath('~/a/b/c/d/app', 99, measure)).toBe('~/a/b/c/d/app')
  expect(fitPath('~/aaaaaaaa/bbbbbbbb/c/app', 12, measure)).toBe('~/…/c/app')
})

test('a long text folds at a word, and one barely over stays whole', () => {
  expect(foldText('one two three four', 8)).toEqual({ text: 'one two…', isCut: true })
  expect(foldText('one two', 7)).toEqual({ text: 'one two', isCut: false })
})

test('an unticked plan draws no meter and says so; a ticked one shows its count', () => {
  const none = planPic({ ...plan(0, 37), title: 'Untouched' }, { width: 351, isOpen: false }).source
  const some = planPic({ ...plan(1, 2), title: 'Halfway' }, { width: 351, isOpen: false }).source
  expect(none).toContain('37 · not ticked')
  expect(none).not.toContain('f-track')
  expect(some).toContain('1/2')
  expect(some).toContain('f-track')
})

test('a plan title too long for its row says so, for the open plan to show whole', () => {
  expect(isPlanTitleCut({ ...plan(1, 2), title: 'x'.repeat(200) }, 351)).toBe(true)
  expect(isPlanTitleCut({ ...plan(1, 2), title: 'short' }, 351)).toBe(false)
})

test('the page head keeps percent and bar on one line and names what it draws', () => {
  const pic = headerPic({ root: '/w/app', name: 'app', isLive: false, percent } as Project, { width: 351, path: '~/w/app' })
  expect(pic.alt).toBe('app, ~/w/app, ~62%')
  expect(pic.source).toContain('~62%')
})
