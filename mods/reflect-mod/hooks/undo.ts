// What the mod itself wrote into CLAUDE.md files, newest last: for /reflect-queue to list and /reflect-undo to take back.

import type { Io } from './learn'
import { END, START } from './rules'

export type Written = { rule: string; path: string; at: number }

const KEY = 'written'
const MAX_WRITTEN = 50

export async function writtenList(io: Io): Promise<Written[]> {
  const got = await io.get(KEY)
  return Array.isArray(got) ? (got as Written[]) : []
}

export async function noteWritten(io: Io, w: Written) {
  await io.set(KEY, [...(await writtenList(io)), w].slice(-MAX_WRITTEN))
}

/** The newest written line, taken off the list. */
export async function popWritten(io: Io): Promise<Written | undefined> {
  const list = await writtenList(io)
  const last = list.pop()
  if (last !== undefined) await io.set(KEY, list)
  return last
}

/** `file` without the bullet `rule` inside the marked section; anything outside the marks is never touched. */
export function withoutRule(file: string, rule: string): string {
  const start = file.indexOf(START)
  const end = file.indexOf(END)
  if (start < 0 || end < start) return file
  const section = file.slice(start, end).replace(`\n- ${rule}\n`, '\n')
  return `${file.slice(0, start)}${section}${file.slice(end)}`
}
