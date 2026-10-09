import type { Plan } from './match'
import { baseName, isMarkdownPath, isPlanPath, parsePlan } from './parse'
import { clip, currentIndex, progressOf } from './progress'
import type { Tracks } from './progress'
import type { PlanDoc } from '../types'

const APPROVED_LABEL = 'onaylı plan'
const STATUS_TITLE_MAX = 36
const STRONG = 2
const WEAK = 1

export function statusText(plan: Plan | null, tracks: Tracks): string | undefined {
  if (plan === null || plan.steps.length === 0) return undefined
  const progress = progressOf(plan)
  const head = `plan ${progress.done}/${progress.total}`
  if (progress.done === progress.total) return `${head} · tamam`
  const current = plan.steps[currentIndex(plan.steps, tracks)]

  return current === undefined ? head : `${head} · ${clip(current.title, STATUS_TITLE_MAX)}`
}

// Worth reading at all: a named plan file, or any markdown that may hold one.
export function mayHoldPlan(path: string): boolean {
  return isPlanPath(path) || isMarkdownPath(path)
}

// A named plan file takes any plan shape; other markdown only a structured one, and ranks below.
export function fileDoc(path: string, text: string): PlanDoc | null {
  const isNamed = isPlanPath(path)
  const parsed = parsePlan(text)
  if (parsed === null || (!isNamed && !parsed.isStructured)) return null

  return { kind: 'file', label: baseName(path), path, strength: isNamed ? STRONG : WEAK, steps: parsed.steps }
}

export function approvedDoc(result: unknown): PlanDoc | null {
  const record = result as { plan?: unknown; filePath?: unknown } | undefined
  if (typeof record?.plan !== 'string') return null
  const parsed = parsePlan(record.plan)
  if (parsed === null) return null
  const path = typeof record.filePath === 'string' ? record.filePath : null

  return { kind: 'approved', label: APPROVED_LABEL, path, strength: STRONG, steps: parsed.steps }
}

// The plan in view gives way to one as sure or surer, or to a new read of the same file.
export function isReplacing(before: PlanDoc | null, doc: PlanDoc): boolean {
  const isSamePath = before !== null && before.path !== null && before.path === doc.path

  return before === null || isSamePath || doc.strength >= before.strength
}
