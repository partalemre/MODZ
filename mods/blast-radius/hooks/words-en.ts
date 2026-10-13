// The card in English, worded like the film: the command as the headline, one plain
// sentence of what it would throw away, and "Run anyway" against "Keep my work".

import { formatSize, plural } from './report'
import type { Report } from './report'
import type { Banner } from './view'
import type { EditWords, Notes, Words } from './words'

const enSize = (bytes: number): string => formatSize(bytes, '.')

const MORE_NOUN: Record<Report['kind'], [string, string]> = {
  files: ['file', 'files'], changes: ['file', 'files'], commits: ['commit', 'commits'], migrations: ['migration', 'migrations'], unknown: ['item', 'items'],
}

function filesBanner(report: Report): Banner {
  const amount = report.bytes === null ? plural(report.count, 'path', 'paths') : `${plural(report.count, 'file', 'files')} (${enSize(report.bytes)})`
  const said = `This would delete ${amount}.`
  if (report.tracked === null) return { tone: 'danger', text: said }
  const untracked = Math.max(0, report.count - report.tracked)
  if (untracked === 0) return { tone: 'read', text: `${said} All of them are in git; git checkout brings them back.` }
  if (untracked === report.count) return { tone: 'danger', text: `${said} None of them are in git, so they can't be brought back.` }

  return { tone: 'danger', text: `${said} ${untracked} of them aren't in git and can't be brought back.` }
}

function banner(report: Report): Banner | null {
  if (report.count === 0) return { tone: 'warn', text: report.note ?? 'This could not be measured beforehand.' }
  if (report.kind === 'files') return filesBanner(report)
  if (report.kind === 'changes') {
    return { tone: 'danger', text: `This would throw away ${plural(report.count, 'file', 'files')} and ${plural(report.added + report.removed, 'line', 'lines')} you haven't committed.` }
  }
  if (report.kind === 'commits') {
    return { tone: 'danger', text: `This would drop ${plural(report.count, 'commit', 'commits')} from ${report.where ?? 'the remote branch'}. Without a local copy they don't come back.` }
  }
  if (report.kind === 'migrations') {
    return { tone: 'danger', text: `This would apply ${plural(report.count, 'migration', 'migrations')}. They change the database; undoing them is separate work.` }
  }

  return report.note === null ? null : { tone: 'warn', text: report.note }
}

const notes: Notes = {
  noPaths: 'No path was given to delete.',
  decidedAtRun: names => `${names} is set while the command runs, so what it deletes can't be measured beforehand.`,
  cleanFailed: error => `git clean -n didn't run: ${error}`,
  statusFailed: error => `git status didn't run: ${error}`,
  refMissing: ref => `${ref} isn't here locally, so it's unknown which commits would be dropped. Run git fetch first.`,
  noDroppedCommits: ref => `No commits on ${ref} would be dropped (as of the last fetch).`,
  cannotListMigrations: 'Pending migrations can\'t be listed for this tool.',
  migrationsFailed: argv => `Pending migrations couldn't be listed (${argv} failed).`,
  unmeasured: reason => `Couldn't measure it: ${reason}`,
  missingFolder: dir => `The folder ${dir} wasn't found, so what would change couldn't be measured.`,
}

const edit: EditWords = {
  eyebrow: 'Held · Blast Radius',
  headline: (name, minutes) => `Another chat edited ${name} ${minutes < 1 ? 'just now' : `${minutes} min ago`}`,
  context: project => (project === '' ? 'Waiting for you' : `${project} · Waiting for you`),
  banner: 'Editing it now could write over what that chat changed.',
  action: { label: 'Edit anyway', hotkey: 'e' },
  cancel: { label: 'Skip this edit', hotkey: 's' },
  skipped: 'Skipped. The file was left as it was.',
  cancelWhy: 'the user pressed Skip this edit',
}

export const EN: Words = {
  eyebrow: 'Held · Blast Radius',
  holder: 'Held by Blast Radius',
  showLess: 'Show less',
  showMore: 'Show more',
  cancel: { label: 'Keep my work', hotkey: 'k' },
  doing: isDelete => (isDelete ? 'Deleting…' : 'Running…'),
  fullCommand: command => `full command: ${command}`,
  kept: 'Kept. Nothing was thrown away.',
  cancelWhy: 'the user pressed Keep my work',
  context: ({ where }) => `${where === null ? '' : `${where} · `}Waiting for you`,
  size: enSize,
  folderCount: count => plural(count, 'file', 'files'),
  moreFiles: (hidden, bytes) => `+ ${plural(hidden, 'more file', 'more files')} · ${enSize(bytes)}`,
  moreItems: (hidden, kind) => `+ ${plural(hidden, `more ${MORE_NOUN[kind][0]}`, `more ${MORE_NOUN[kind][1]}`)}`,
  moreRows: hidden => `+ ${plural(hidden, 'more row', 'more rows')}`,
  headline: () => ({ payload: '', tail: '' }),
  banner,
  action: () => ({ label: 'Run anyway', hotkey: 'r' }),
  notes,
  edit,
}
