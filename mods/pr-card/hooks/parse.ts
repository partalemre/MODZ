import type { ChangedFile, Checks, Merge, PrState, PrView, Review } from '../types'

// Reading what the Bash tool and `gh` print. Everything here is untrusted text, checked field by field.

export type PrRef = { url: string; repo: string; number: number }

const PR_URL = /https:\/\/github\.com\/([\w.-]+\/[\w.-]+)\/pull\/(\d+)/
const PR_CREATE = /(^|[\s;&|(])gh\s+pr\s+create\b/
// The GitHub MCP server's tool, under whatever name the session mounted the server.
const MCP_CREATE = /(^|__)create_pull_request$/
const STATES: Record<string, PrState> = { OPEN: 'open', MERGED: 'merged', CLOSED: 'closed' }
const REVIEWS: Record<string, Review> = { APPROVED: 'approved', CHANGES_REQUESTED: 'changes', REVIEW_REQUIRED: 'required' }
const MERGE_STATES: Record<string, Merge> = {
  CLEAN: 'ready',
  HAS_HOOKS: 'ready',
  UNSTABLE: 'ready',
  DIRTY: 'conflict',
  BLOCKED: 'blocked',
  BEHIND: 'behind',
  DRAFT: 'draft',
}
const FAILED = new Set(['FAILURE', 'TIMED_OUT', 'CANCELLED', 'ACTION_REQUIRED', 'STARTUP_FAILURE', 'ERROR'])
const SKIPPED = new Set(['NEUTRAL', 'SKIPPED', 'STALE'])
const MAX_NAME = 80
const MAX_FAILING = 5
const MAX_FILES = 100

export const VIEW_FIELDS = 'url,title,state,isDraft,additions,deletions,changedFiles,files,statusCheckRollup,reviewDecision,mergeable,mergeStateStatus'

export const isPrCreate = (command: string): boolean => PR_CREATE.test(command)

const commandOf = (input: unknown): string => String((input as { command?: unknown } | null | undefined)?.command ?? '')

// A call that opens a PR: `gh pr create` in Bash, or the GitHub MCP tool.
export const isPrCall = (tool: string, input: unknown): boolean => (tool === 'Bash' && isPrCreate(commandOf(input))) || MCP_CREATE.test(tool)

// The last PR link in the output: gh prints the new PR's URL last, after any warnings that may hold others.
export function prRefOf(output: string): PrRef | null {
  const found = output.split('\n').map(line => PR_URL.exec(line)).filter((match): match is RegExpExecArray => match !== null)
  const last = found.at(-1)

  return last === undefined ? null : { url: last[0], repo: last[1] ?? '', number: Number(last[2]) }
}

// A Bash result reaches a drawing as its record on one surface and as plain text on another; an MCP result as
// its content, read as JSON text.
export function outputText(output: unknown): string {
  if (typeof output === 'string') return output
  if (output === null || output === undefined) return ''
  const stdout = (output as { stdout?: unknown }).stdout

  return typeof stdout === 'string' ? stdout : JSON.stringify(output)
}

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value)
const count = (value: unknown): number => (typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : 0)
const listOf = (value: unknown): unknown[] => (Array.isArray(value) ? value : [])

function fileOf(item: unknown): ChangedFile | null {
  if (!isRecord(item) || typeof item.path !== 'string') return null

  return { path: item.path, additions: count(item.additions), deletions: count(item.deletions) }
}

// A rollup item is a CheckRun (name, status, conclusion) or a StatusContext (context, state).
function bucketOf(item: Record<string, unknown>): keyof Omit<Checks, 'failing'> {
  const outcome = String(item.conclusion || item.state || '')
  if (FAILED.has(outcome)) return 'failed'
  if (SKIPPED.has(outcome)) return 'skipped'
  const isSettled = outcome === 'SUCCESS' && (item.status === undefined || item.status === 'COMPLETED')

  return isSettled ? 'passed' : 'pending'
}

export function checksOf(rollup: unknown): Checks {
  const checks: Checks = { passed: 0, failed: 0, pending: 0, skipped: 0, failing: [] }
  for (const item of listOf(rollup).filter(isRecord)) {
    const bucket = bucketOf(item)
    checks[bucket] += 1
    const name = String(item.name ?? item.context ?? '').slice(0, MAX_NAME)
    if (bucket === 'failed' && name !== '' && checks.failing.length < MAX_FAILING) checks.failing.push(name)
  }

  return checks
}

function mergeOf(json: Record<string, unknown>): Merge {
  if (json.mergeable === 'CONFLICTING') return 'conflict'

  return MERGE_STATES[String(json.mergeStateStatus)] ?? 'unknown'
}

// `gh pr view <url> --json VIEW_FIELDS`; null when it is not the JSON asked for.
export function viewOf(text: string): PrView | null {
  let json: unknown
  try {
    json = JSON.parse(text)
  } catch {
    // gh printed no JSON (an error line): the caller reads it as no answer.
    return null
  }
  if (!isRecord(json)) return null
  const state = STATES[String(json.state)]
  if (state === undefined) return null
  const files = listOf(json.files).slice(0, MAX_FILES).map(fileOf).filter((file): file is ChangedFile => file !== null)

  return {
    title: typeof json.title === 'string' ? json.title : '',
    state,
    isDraft: json.isDraft === true,
    additions: count(json.additions),
    deletions: count(json.deletions),
    changedFiles: count(json.changedFiles),
    files,
    checks: checksOf(json.statusCheckRollup),
    review: REVIEWS[String(json.reviewDecision)] ?? 'none',
    merge: mergeOf(json),
  }
}
