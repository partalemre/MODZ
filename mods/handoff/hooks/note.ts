import type { SessionMessage } from 'claude-code'

import { FILES_MAX, GIT_LINES_MAX, GOAL_CHARS, GOAL_PROMPTS, NOTE_MAX_CHARS, SUMMARY_INPUT_CHARS, SUMMARY_LINES, SUMMARY_MESSAGES } from './limits'
import { words } from './words'
import type { PlanTask } from '../types'

// The handoff note, built from what the session already holds. Pure: every fact comes in, markdown comes out.

export type NoteFacts = {
  stamp: string
  root: string
  percent: number | null
  goals: readonly string[]
  steps: readonly string[]
  files: readonly string[]
  git: readonly string[]
  lastError: string | null
  summary: string | null
}

const ELLIPSIS = '…'
const PAD = 2

const pad = (n: number): string => String(n).padStart(PAD, '0')
const oneLine = (text: string): string => text.replace(/\s+/g, ' ').trim()
const cut = (text: string, max: number): string => (text.length <= max ? text : `${text.slice(0, max - 1)}${ELLIPSIS}`)

// `2026-10-13-1405` for the file, `2026-10-13 14:05` for the reader, in the session's local time.
export function stampOf(ms: number): { file: string; label: string } {
  const at = new Date(ms)
  const day = `${at.getFullYear()}-${pad(at.getMonth() + 1)}-${pad(at.getDate())}`
  const hour = pad(at.getHours())
  const minute = pad(at.getMinutes())

  return { file: `${day}-${hour}${minute}`, label: `${day} ${hour}:${minute}` }
}

export const noteDir = (root: string): string => `${root}/.claude/handoff`
export const notePath = (root: string, ms: number): string => `${noteDir(root)}/${stampOf(ms).file}.md`

// What the person typed, newest last: tool results and the engine's tagged rows (`<command-name>`) are not goals.
export function goalsOf(messages: readonly SessionMessage[]): string[] {
  const typed = messages.filter(m => m.role === 'user' && (m.toolResults ?? []).length === 0)
  const texts = typed.map(m => oneLine(m.text)).filter(text => text !== '' && !text.startsWith('<'))

  return texts.slice(-GOAL_PROMPTS).map(text => cut(text, GOAL_CHARS))
}

export function openSteps(tasks: readonly PlanTask[]): string[] {
  return tasks.filter(task => task.status !== 'completed').map(task => (task.status === 'in_progress' ? `[>] ${task.subject}` : `[ ] ${task.subject}`))
}

export function relativeTo(root: string, path: string): string {
  const prefix = `${root}/`

  return path.startsWith(prefix) ? path.slice(prefix.length) : path
}

function capped(lines: readonly string[], max: number): string[] {
  if (lines.length <= max) return [...lines]

  return [...lines.slice(0, max), words().noteMore(lines.length - max)]
}

function section(heading: string, body: readonly string[]): string[] {
  return body.length === 0 ? [] : ['', `## ${heading}`, ...body]
}

export function buildNote(facts: NoteFacts): string {
  const says = words()
  const head = [`# ${says.noteTitle(facts.stamp)}`, '', `${says.noteRepo}: ${facts.root}`]
  if (facts.percent !== null) head.push(says.noteContext(facts.percent))
  const git = facts.git.length === 0 ? [] : ['```', ...capped(facts.git, GIT_LINES_MAX), '```']
  const lines = [
    ...head,
    ...section(says.noteWhere, facts.summary === null ? [] : [facts.summary]),
    ...section(says.noteGoal, facts.goals.map(goal => `- ${goal}`)),
    ...section(says.noteSteps, facts.steps.map(step => `- ${step}`)),
    ...section(says.noteFiles, capped(facts.files, FILES_MAX).map(file => `- ${file}`)),
    ...section(says.noteGit, git),
    ...section(says.noteError, facts.lastError === null ? [] : [facts.lastError]),
  ]

  return cut(`${lines.join('\n')}\n`, NOTE_MAX_CHARS)
}

function rowOf(message: SessionMessage): string {
  const tools = message.toolUses.map(use => use.tool).filter(tool => tool !== '')
  const said = oneLine(message.text)
  const toolPart = tools.length === 0 ? '' : ` [tools: ${tools.join(', ')}]`

  return `${message.role === 'user' ? 'User' : 'Claude'}: ${said}${toolPart}`
}

// The newest messages as plain rows, cut from the front so the latest work is always in.
export function transcriptOf(messages: readonly SessionMessage[]): string {
  const rows = messages.slice(-SUMMARY_MESSAGES).map(rowOf).filter(row => !/^(User|Claude): $/.test(row))
  const text = rows.join('\n')

  return text.length <= SUMMARY_INPUT_CHARS ? text : text.slice(text.length - SUMMARY_INPUT_CHARS)
}

export const SUMMARY_SYSTEM = [
  'You write the "where we are" part of a handoff note for a coding session that will continue in a fresh conversation.',
  `Answer in at most ${SUMMARY_LINES} short lines of plain markdown: what is done, what is in progress, and the next step.`,
  'No preamble, no headings, no closing line. Never repeat secrets, keys or tokens that appear in the transcript.',
].join(' ')

// The model's reply held to its line budget; empty means no summary.
export function cleanSummary(text: string): string | null {
  const lines = text.split('\n').map(line => line.trimEnd()).filter(line => line.trim() !== '')
  const kept = lines.slice(0, SUMMARY_LINES).join('\n').trim()

  return kept === '' ? null : kept
}
