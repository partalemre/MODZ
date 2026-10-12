import type { DocStep } from '../types'
import { words } from './words'

// A named plan file is a plan on sight; any other markdown must show plan structure.
const PLAN_PATH = /(^|\/)(docs\/(.+\/)?plans\/[^/]+\.md|PLAN\.md|[^/]+\.plan\.md)$/i
const MARKDOWN = /\.(md|markdown)$/i
const FENCE = /^\s*(```|~~~)/
const STEP_HEADING = /^#{2,4}\s+(?:(?:task|step|adım|görev|phase|aşama)\s*(\d+)\b\s*[:.)\-–—]?\s*(.*)|(\d+)[.)]\s+(.+))$/i
const CHECKBOX = /^(\s*)[-*+]\s+\[([ xX])\]\s+(.*)$/
const NUMBERED = /^(\d+)[.)]\s+(.+)$/
const NESTED_INDENT = 2
const MIN_STEPS = 2
const MIN_LOOSE_CHECKBOXES = 3

// A loose parse (two checkboxes, a numbered list) counts only in a named plan file or an approved plan.
export type ParsedPlan = { steps: DocStep[]; isStructured: boolean }

export function isPlanPath(path: string): boolean {
  return PLAN_PATH.test(path)
}

export function isMarkdownPath(path: string): boolean {
  return MARKDOWN.test(path)
}

export function cleanTitle(text: string): string {
  return text
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[*_`]+/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/[:.]$/, '')
    .trim()
}

function visibleLines(markdown: string): string[] {
  const lines: string[] = []
  let isInFence = false
  for (const line of markdown.split(/\r?\n/)) {
    if (FENCE.test(line)) isInFence = !isInFence
    else if (!isInFence) lines.push(line)
  }

  return lines
}

function newStep(title: string, number: number | null): DocStep {
  return { title, number, isChecked: false, checksDone: 0, checksTotal: 0 }
}

function count(step: DocStep, mark: string): void {
  step.checksTotal += 1
  if (mark !== ' ') step.checksDone += 1
}

function fromHeadings(lines: string[]): DocStep[] {
  const steps: DocStep[] = []
  let current: DocStep | null = null
  for (const line of lines) {
    const heading = STEP_HEADING.exec(line.trim())
    if (heading !== null) {
      const number = Number(heading[1] ?? heading[3])
      const title = cleanTitle(heading[2] ?? heading[4] ?? '')
      current = newStep(title === '' ? words().stepTitle(number) : title, number)
      steps.push(current)
    } else if (/^#{1,3}\s/.test(line.trim())) {
      current = null
    } else if (current !== null) {
      const box = CHECKBOX.exec(line)
      if (box !== null) count(current, box[2] ?? ' ')
    }
  }

  return steps
}

function fromCheckboxes(lines: string[]): DocStep[] {
  const steps: DocStep[] = []
  for (const line of lines) {
    const box = CHECKBOX.exec(line)
    if (box === null) continue
    const indent = (box[1] ?? '').replace(/\t/g, '  ').length
    const mark = box[2] ?? ' '
    const parent = steps[steps.length - 1]
    if (indent >= NESTED_INDENT && parent !== undefined) {
      count(parent, mark)
    } else {
      const step = newStep(cleanTitle(box[3] ?? ''), null)
      step.isChecked = mark !== ' '
      steps.push(step)
    }
  }

  return steps
}

// The longest run numbered from 1, so a later "Verification" list does not join the steps.
function fromNumbered(lines: string[]): DocStep[] {
  let best: DocStep[] = []
  let run: DocStep[] = []
  for (const line of lines) {
    const item = NUMBERED.exec(line)
    if (item === null) {
      if (/^#{1,6}\s/.test(line.trim())) run = []
      continue
    }
    const number = Number(item[1])
    if (number === 1) run = []
    else if (number !== run.length + 1) continue
    run.push(newStep(cleanTitle(item[2] ?? ''), number))
    if (run.length > best.length) best = run
  }

  return best
}

// Headings first (`### Task N:`, `## Step N`), then top-level checkboxes, then a numbered list.
export function parsePlan(markdown: string): ParsedPlan | null {
  const lines = visibleLines(markdown)
  const headed = fromHeadings(lines)
  if (headed.length >= MIN_STEPS) return { steps: headed, isStructured: true }
  const boxed = fromCheckboxes(lines)
  const boxCount = boxed.reduce((sum, step) => sum + 1 + step.checksTotal, 0)
  if (boxed.length >= MIN_STEPS) {
    return { steps: boxed, isStructured: boxCount >= MIN_LOOSE_CHECKBOXES }
  }
  const numbered = fromNumbered(lines)

  return numbered.length >= MIN_STEPS ? { steps: numbered, isStructured: false } : null
}

export function baseName(path: string): string {
  return path.split('/').pop() ?? path
}
