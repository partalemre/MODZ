// The local prefilter of `/mine`, zero tokens: what keeps coming back across past chats. Each typed prompt
// goes to one kind (a standing ask, a correction, or a plain prompt that repeats); held calls group by tool,
// failed commands by their start. Only what was seen at least MIN_REPEATS times becomes a candidate.

import type { Candidate } from '../types'
import type { Signals } from './signals'
import { MAX_PROMPT, hasTrigger, isTrivial, looksSecret } from './rules'

export const MIN_REPEATS = 2
/** How many candidates go on to the model, the strongest first. */
export const TOP_CANDIDATES = 12
/** A candidate's sample as the model and the pane see it. */
export const MAX_SAMPLE = 140
/** Prompts of one kind compared with each other at most: the grouping is quadratic. */
const MAX_GROUPED = 400
/** Two prompts sharing this much of their words are the same correction said again. */
const SAME_WORDS = 0.5
const MIN_WORD = 3
/** A repeated plain prompt is told apart by its start. */
const PROMPT_KEY = 60

/** "Remember", "always", "never" and their Turkish kin: a standing ask, worth a rule if it comes back. */
const ASK = /(?<![\p{L}\p{N}])(remember|always|never|from now on|hatırla|unutma|her zaman|asla|hiçbir zaman|daima|bundan sonra)/iu

type Seen = { kind: Candidate['kind']; key: string; sample: string; chat: number }
type Group = { kind: Candidate['kind']; sample: string; words: Set<string>; count: number; chats: Set<number> }

const cut = (text: string): string => {
  const one = text.replace(/\s+/g, ' ').trim()
  return one.length <= MAX_SAMPLE ? one : `${one.slice(0, MAX_SAMPLE - 1).trimEnd()}…`
}

const wordsOf = (text: string): Set<string> =>
  new Set(text.toLocaleLowerCase('tr').split(/[^\p{L}\p{N}]+/u).filter(w => w.length >= MIN_WORD))

function overlap(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0
  let both = 0
  for (const w of a) if (b.has(w)) both += 1
  return both / (a.size + b.size - both)
}

export const promptKey = (text: string): string => text.toLocaleLowerCase('tr').replace(/\s+/g, ' ').trim().slice(0, PROMPT_KEY)

function kindOf(text: string): Candidate['kind'] {
  if (ASK.test(text.toLocaleLowerCase('tr'))) return 'ask'
  return text.length <= MAX_PROMPT && hasTrigger(text) ? 'correction' : 'repeat'
}

/** Every signal of every chat, flattened; prompts that are commands, go-aheads or secret-shaped are left out. */
function seenIn(chats: Signals[]): Seen[] {
  return chats.flatMap((s, chat) => [
    ...s.prompts.filter(p => !p.startsWith('/') && !isTrivial(p) && !looksSecret(p))
      .map(p => ({ kind: kindOf(p), key: promptKey(p), sample: cut(p), chat })),
    ...s.holds.map(tool => ({ kind: 'held' as const, key: tool, sample: tool, chat })),
    ...s.failures.filter(c => !looksSecret(c)).map(c => ({ kind: 'failing' as const, key: c, sample: c, chat })),
  ])
}

/** Corrections and asks group by shared words; the rest by their exact key. */
function group(seen: Seen[]): Group[] {
  const exact = new Map<string, Group>()
  const loose: Group[] = []
  const looseCount = new Map<Candidate['kind'], number>()
  for (const s of seen) {
    const isLoose = s.kind === 'correction' || s.kind === 'ask'
    if (isLoose) {
      const n = looseCount.get(s.kind) ?? 0
      if (n >= MAX_GROUPED) continue
      looseCount.set(s.kind, n + 1)
    }
    const words = wordsOf(s.sample)
    const found = isLoose
      ? loose.find(g => g.kind === s.kind && overlap(g.words, words) >= SAME_WORDS)
      : exact.get(`${s.kind}:${s.key}`)
    if (found !== undefined) {
      found.count += 1
      found.chats.add(s.chat)
      continue
    }
    const made: Group = { kind: s.kind, sample: s.sample, words, count: 1, chats: new Set([s.chat]) }
    if (isLoose) loose.push(made)
    else exact.set(`${s.kind}:${s.key}`, made)
  }
  return [...exact.values(), ...loose]
}

/** The recurring frictions, strongest first: most seen, then seen in the most chats. */
export function candidatesOf(chats: Signals[]): Candidate[] {
  return group(seenIn(chats))
    .filter(g => g.count >= MIN_REPEATS)
    .map(g => ({ kind: g.kind, sample: g.sample, count: g.count, chats: g.chats.size }))
    .sort((a, b) => b.count - a.count || b.chats - a.chats)
}
