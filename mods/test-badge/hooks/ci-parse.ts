import type { CiCheck, CiCheckState } from '../types'

// Reading what the Bash tool and `gh` print: which commands start a watch, the PR a `gh pr create` made,
// and gh's JSON for a PR and its checks. Everything here is untrusted text, checked field by field.

export type PrRef = { number: number; url: string }
export type PrInfo = PrRef & { title: string; state: PrState }
export type PrState = 'open' | 'merged' | 'closed'
export type PrPoll = { title: string; state: PrState; talk: number }

const PR_URL = /https:\/\/[^\s/]+\/[^\s/]+\/[^\s/]+\/pull\/(\d+)/
const PR_CREATE = /(^|[\s;&|(])gh\s+pr\s+create\b/
const GIT_PUSH = /(^|[\s;&|(])git\s+(?:-C\s+\S+\s+)?push\b/
const STATES: Record<string, PrState> = { OPEN: 'open', MERGED: 'merged', CLOSED: 'closed' }
// gh's own buckets; a cancelled check did not pass, so it reads as failed.
const BUCKETS: Record<string, CiCheckState> = { pass: 'pass', fail: 'fail', cancel: 'fail', pending: 'pending', skipping: 'skipped' }
const MAX_NAME = 120

export const isPrCreate = (command: string): boolean => PR_CREATE.test(command)
export const isGitPush = (command: string): boolean => GIT_PUSH.test(command)

// The last PR link in the output: gh prints the new PR's URL last, after any warnings that may hold others.
export function prRefOf(output: string): PrRef | null {
  const found = output.split('\n').map(line => PR_URL.exec(line)).filter((match): match is RegExpExecArray => match !== null)
  const last = found.at(-1)
  if (last === undefined) return null

  return { number: Number(last[1]), url: last[0] }
}

function jsonOf(text: string): unknown {
  try {
    return JSON.parse(text)
  } catch {
    // gh printed no JSON (an error, a "no checks reported" line): the caller reads it as no answer.
    return null
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value)
const countOf = (value: unknown): number => (Array.isArray(value) ? value.length : 0)

// `gh pr view --json number,url,headRefName,state,title`.
export function prInfoOf(text: string): PrInfo | null {
  const json = jsonOf(text)
  if (!isRecord(json) || typeof json.number !== 'number' || typeof json.url !== 'string') return null
  const state = STATES[String(json.state)]
  if (state === undefined) return null

  return { number: json.number, url: json.url, title: typeof json.title === 'string' ? json.title : '', state }
}

// `gh pr view <n> --json state,title,reviews,comments`: the state, and how many reviews and comments, never their text.
export function prPollOf(text: string): PrPoll | null {
  const json = jsonOf(text)
  if (!isRecord(json)) return null
  const state = STATES[String(json.state)]
  if (state === undefined) return null

  return { title: typeof json.title === 'string' ? json.title : '', state, talk: countOf(json.reviews) + countOf(json.comments) }
}

function checkOf(item: unknown): CiCheck | null {
  if (!isRecord(item) || typeof item.name !== 'string') return null
  const link = typeof item.link === 'string' && item.link.startsWith('https://') ? item.link : null

  return { name: item.name.slice(0, MAX_NAME), state: BUCKETS[String(item.bucket)] ?? 'pending', link }
}

// `gh pr checks <n> --json name,state,bucket,link`; null when gh gave no list (it prints none before any check reports).
export function checksOf(text: string): CiCheck[] | null {
  const json = jsonOf(text)
  if (!Array.isArray(json)) return null

  return json.map(checkOf).filter((check): check is CiCheck => check !== null)
}
