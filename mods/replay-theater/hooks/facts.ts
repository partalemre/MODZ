import type { ReplayStep } from '../types'
import { baseName } from './pane-svg'
import { words } from './words'

// The resolved element table of the surface that draws the pane or the band.
export type Ui = Record<string, any>

// "2 edits · 2 files", and the files' names, for the hub card.
export function editFacts(steps: ReplayStep[]): { title: string; files: string } {
  const names = [...new Set(steps.map(step => baseName(step.file)))]
  const fileCount = new Set(steps.map(step => step.file)).size

  return { title: words().editsAndFiles(steps.length, fileCount), files: names.join(' · ') }
}
