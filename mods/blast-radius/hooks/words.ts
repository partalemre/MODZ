// Every word the person reads on the card, in English or in Turkish (MODZ_LANG=tr).
// Read through `words()` at draw time: the language is set at session.start.

import { pick } from './lang'
import type { Report } from './report'
import type { Banner, View } from './view'
import { EN } from './words-en'
import { TR } from './words-tr'

export type Words = {
  eyebrow: string
  // The band has no title, so it says who is holding the command.
  holder: string
  showLess: string
  showMore: string
  cancel: { label: string; hotkey: string }
  doing: (isDelete: boolean) => string
  fullCommand: (command: string) => string
  // Said once the person kept their work.
  kept: string
  // The deny reason when Cancel was pressed, read by Claude and shown in the transcript.
  cancelWhy: string
  context: (place: { where: string | null; folder: string }) => string
  size: (bytes: number) => string
  folderCount: (count: number) => string
  moreFiles: (hidden: number, bytes: number) => string
  moreItems: (hidden: number, kind: Report['kind']) => string
  moreRows: (hidden: number) => string
  headline: (report: Report) => { payload: string; tail: string }
  banner: (report: Report) => Banner | null
  action: (report: Report) => View['action']
  notes: Notes
}

// Lines for the person when something could not be measured.
export type Notes = {
  noPaths: string
  decidedAtRun: (names: string) => string
  cleanFailed: (error: string) => string
  statusFailed: (error: string) => string
  refMissing: (ref: string) => string
  noDroppedCommits: (ref: string) => string
  cannotListMigrations: string
  migrationsFailed: (argv: string) => string
  unmeasured: (reason: string) => string
  missingFolder: (dir: string) => string
}

export const words = (): Words => pick({ en: EN, tr: TR })
