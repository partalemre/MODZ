// The card in English, worded like the film: the command as the headline, one plain
// sentence of what it would throw away, and "Run anyway" against "Keep my work".

import { formatSize, plural } from './report'
import type { Report } from './report'
import type { Banner } from './view'
import type { EditWords, HouseWords, Notes, Words } from './words'

const enSize = (bytes: number): string => formatSize(bytes, '.')

const MORE_NOUN: Record<Report['kind'], [string, string]> = {
  files: ['file', 'files'], changes: ['file', 'files'], commits: ['saved version', 'saved versions'], migrations: ['database change', 'database changes'],
  overwrites: ['file', 'files'], stashes: ['set-aside change', 'set-aside changes'], removals: ['item', 'items'], unknown: ['item', 'items'],
}

const appended = (text: string, note: string | null): string => (note === null ? text : `${text} ${note}`)

/** The banner for the reports a delete-like command makes beside rm's files. */
function lossBanner(report: Report): Banner | null {
  const files = plural(report.count, 'file', 'files')
  if (report.kind === 'changes') {
    const changed = report.added + report.removed
    const what = changed === 0 ? `the changes in ${files}` : `${plural(changed, 'changed line', 'changed lines')} in ${files}`

    return { tone: 'danger', text: appended(`This would throw away ${what}, never saved as a version.`, report.note) }
  }
  if (report.kind === 'overwrites') return { tone: 'danger', text: `This would write over ${files} (${enSize(report.bytes ?? 0)}) whose current contents were never saved, so they can't be brought back.` }
  if (report.kind === 'stashes') return { tone: 'danger', text: `This would delete ${plural(report.count, 'set of changes', 'sets of changes')} put aside for later (stash). They are hard to get back.` }
  if (report.kind === 'removals') return { tone: 'danger', text: `This would remove ${plural(report.count, 'item', 'items')} listed below; they can't be brought back from here.` }

  return null
}

function filesBanner(report: Report): Banner {
  const amount = report.bytes === null ? plural(report.count, 'path', 'paths') : `${plural(report.count, 'file', 'files')} (${enSize(report.bytes)})`
  const said = `This would delete ${amount}.`
  if (report.tracked === null) return { tone: 'danger', text: said }
  const untracked = Math.max(0, report.count - report.tracked)
  if (untracked === 0) return { tone: 'read', text: `${said} All of them have a saved version, so they can be brought back.` }
  if (untracked === report.count) return { tone: 'danger', text: `${said} None of them were ever saved as a version, so they can't be brought back.` }

  return { tone: 'danger', text: `${said} ${untracked} of them were never saved as a version and can't be brought back.` }
}

function banner(report: Report): Banner | null {
  if (report.count === 0) return { tone: 'warn', text: report.note ?? 'This could not be measured beforehand.' }
  if (report.kind === 'files') return filesBanner(report)
  const loss = lossBanner(report)
  if (loss !== null) return loss
  if (report.kind === 'commits') {
    return { tone: 'danger', text: `This would erase ${plural(report.count, 'saved version', 'saved versions')} from ${report.where ?? 'the shared copy'}. Unless this computer has a copy, they are gone.` }
  }
  if (report.kind === 'migrations') {
    return { tone: 'danger', text: `This would make ${plural(report.count, 'change', 'changes')} to the database (migrations). Undoing them is separate work.` }
  }

  return report.note === null ? null : { tone: 'warn', text: report.note }
}

const notes: Notes = {
  noPaths: 'No path was given to delete.',
  decidedAtRun: names => `${names} is set while the command runs, so what it deletes can't be measured beforehand.`,
  cleanFailed: error => `Couldn't list what it would delete (git clean -n failed: ${error})`,
  statusFailed: error => `Couldn't check for unsaved changes (git status failed: ${error})`,
  refMissing: ref => `This computer has no copy of ${ref}, so it's unknown which saved versions would be erased. Bring in the shared copy first (git fetch).`,
  noDroppedCommits: ref => `No saved versions on ${ref} would be erased (as of the last look at the shared copy).`,
  cannotListMigrations: 'The database changes waiting to run (migrations) can\'t be listed for this tool.',
  migrationsFailed: argv => `The database changes waiting to run couldn't be listed (${argv} failed).`,
  unmeasured: reason => `Couldn't measure it: ${reason}`,
  missingFolder: dir => `The folder ${dir} wasn't found, so what would change couldn't be measured.`,
  fromInput: label => `${label} acts on what its input lists, so what it would change can't be measured beforehand.`,
  findUnmeasured: 'This search also does something besides deleting, so it can\'t be tried safely first to list what it deletes.',
  device: path => `This writes straight to the device ${path}, which can wipe a whole disk.`,
  database: statement => `This runs ${statement} on a database. What it would remove can't be measured from here, and it can't be undone from here.`,
  toolFailed: argv => `What it would remove couldn't be listed (${argv} failed).`,
  alsoDrops: (count, branch) => `It also takes the line of work ${branch} back by ${plural(count, 'saved version', 'saved versions')}.`,
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

const house: HouseWords = {
  banner: rule => `House rule: ${rule}`,
  anyRule: 'house rules',
  action: { label: 'Run anyway', hotkey: 'r' },
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
  hubWaiting: command => `Waiting for your answer: ${command}`,
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
  house,
}
