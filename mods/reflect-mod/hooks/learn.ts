// The learnings store: found rules, their repeats and decisions, kept in the plugin's own store.

import type { Learning } from '../types'
import type { Verdict } from './policy'
import { MAX_SAID, SAME, isKnownIn, similarity } from './rules'

const MAX_ITEMS = 300
const ID_SPACE = 46656
const ID_BASE = 36

/** What the store needs from the engine, bound in register.tsx (the one file that holds `$`). */
export type Io = {
  get: (key: string) => Promise<unknown>
  set: (key: string, value: unknown) => Promise<unknown>
  now: () => Promise<number>
  /** A file's text, '' when it does not exist. */
  read: (path: string) => Promise<string>
}

export type Found = { verdict: Verdict; root: string; isExplicit: boolean; said: string; files: string[] }

export async function items(io: Io): Promise<Learning[]> {
  const got = await io.get('items')
  return Array.isArray(got) ? (got as Learning[]) : []
}

/** Keeps the newest MAX_ITEMS, dropping decided ones before any still waiting for a decision. */
export async function saveItems(io: Io, list: Learning[]) {
  let kept = list
  if (kept.length > MAX_ITEMS) {
    const decided = kept.filter(l => l.status !== 'pending').sort((a, b) => a.lastAt - b.lastAt)
    const drop = new Set(decided.slice(0, kept.length - MAX_ITEMS).map(l => l.id))
    kept = kept.filter(l => !drop.has(l.id)).slice(-MAX_ITEMS)
  }
  await io.set('items', kept)
}

export const isHere = (l: Learning, root: string): boolean => l.scope === 'global' || l.project === root

/**
 * Adds a learning, counts a repeat of a waiting or saved one, or keeps an explicit one apart from a skipped twin.
 * A rule any of `files` (this project's CLAUDE.md and the global one) already holds is kept as saved, never shown.
 */
export async function record(io: Io, f: Found) {
  const now = await io.now()
  const list = await items(io)
  const v = f.verdict
  const same = list.find(l => isHere(l, f.root) && (l.status !== 'skipped' || !f.isExplicit) && similarity(l.rule, v.rule) >= SAME)
  if (same !== undefined) {
    same.count += 1
    same.lastAt = now
    return saveItems(io, list)
  }
  const texts = await Promise.all(f.files.map(path => io.read(path)))
  const isKnown = texts.some(text => isKnownIn(text, v.rule))
  list.push({
    id: `r${now.toString(ID_BASE)}${Math.floor(Math.random() * ID_SPACE).toString(ID_BASE)}`,
    rule: v.rule, scope: v.scope, project: f.root, count: 1, firstAt: now, lastAt: now,
    status: isKnown ? 'saved' : 'pending', confidence: v.confidence, isExplicit: f.isExplicit, said: f.said.slice(0, MAX_SAID),
  })
  await saveItems(io, list)
}

export type Decision = { id: string; status: Learning['status']; scope?: Learning['scope']; project?: string; rule?: string }

/** Settles a waiting learning, or rewords it (`rule` with status pending). */
export async function decide(io: Io, d: Decision) {
  const list = await items(io)
  const one = list.find(l => l.id === d.id)
  if (one !== undefined && one.status === 'pending') {
    one.status = d.status
    if (d.scope !== undefined) one.scope = d.scope
    if (d.project !== undefined) one.project = d.project
    if (d.rule !== undefined) one.rule = d.rule
  }
  await saveItems(io, list)
}

/** The rules waiting here, as the band draws them: the most repeated first, then the newest. */
export const waitingHere = (list: Learning[], root: string): Learning[] =>
  list.filter(l => l.status === 'pending' && isHere(l, root)).sort((a, b) => b.count - a.count || b.lastAt - a.lastAt)

/** The project's and the global CLAUDE.md: a rule either one holds is never offered again. */
export const claudePaths = (home: string, root: string): { project: string; global: string } =>
  ({ project: `${root}/CLAUDE.md`, global: `${home}/.claude/CLAUDE.md` })
