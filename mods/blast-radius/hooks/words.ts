// Every word the person reads on the card, in English or in Turkish (MODZ_LANG=tr).
// Read through `words()` at draw time: the language is set at session.start.

import { pick } from './lang'
import type { Report } from './report'
import type { Banner, Choice, View } from './view'
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
  edit: EditWords
  house: HouseWords
}

// The caution card for a command one of the person's house rules asks about.
export type HouseWords = {
  // "House rule: <the rule>", the card's banner.
  banner: (rule: string) => string
  // Said in place of a rule when the judge could not name which one.
  anyRule: string
  action: Choice
}

// The caution card for a file another chat edited within the last half hour.
export type EditWords = {
  eyebrow: string
  headline: (name: string, minutes: number) => string
  // The other chat's project folder, or '' when it is not known.
  context: (project: string) => string
  banner: string
  action: Choice
  cancel: Choice
  // Said once the person skipped the edit.
  skipped: string
  // The deny reason when Skip was pressed, read by Claude.
  cancelWhy: string
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
