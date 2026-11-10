// The card in English, worded like the film: the command as the headline, one plain
// sentence of what it would throw away, and "Run anyway" against "Keep my work".

import { formatSize, plural } from './report'
import type { Report } from './report'
import type { Banner } from './view'
import type { EditWords, HouseWords, Notes, Words } from './words'

const enSize = (bytes: number): string => formatSize(bytes, '.')

const MORE_NOUN: Record<Report['kind'], [string, string]> = {
  files: ['file', 'files'], changes: ['file', 'files'], commits: ['commit', 'commits'], migrations: ['migration', 'migrations'],
  overwrites: ['file', 'files'], stashes: ['stash', 'stashes'], removals: ['item', 'items'], unknown: ['item', 'items'],
}

const appended = (text: string, note: string | null): string => (note === null ? text : `${text} ${note}`)

/** The banner for the reports a delete-like command makes beside rm's files. */
function lossBanner(report: Report): Banner | null {
  const files = plural(report.count, 'file', 'files')
  if (report.kind === 'changes') {
    const changed = report.added + report.removed
    const what = changed === 0 ? files : `${files} and ${plural(changed, 'line', 'lines')}`

    return { tone: 'danger', text: appended(`This would throw away ${what} you haven't committed.`, report.note) }
  }
  if (report.kind === 'overwrites') return { tone: 'danger', text: `This would write over ${files} (${enSize(report.bytes ?? 0)}) whose contents git can't bring back.` }
  if (report.kind === 'stashes') return { tone: 'danger', text: `This would delete ${plural(report.count, 'stash', 'stashes')}. A dropped stash is hard to get back.` }
  if (report.kind === 'removals') return { tone: 'danger', text: `This would remove ${plural(report.count, 'item', 'items')} listed below; they can't be brought back from here.` }

  return null
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
  const loss = lossBanner(report)
  if (loss !== null) return loss
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
  fromInput: label => `${label} acts on what its input lists, so what it would change can't be measured beforehand.`,
  findUnmeasured: 'This find runs another action besides the delete, so it can\'t be dry-run to list what it deletes.',
  device: path => `This writes straight to the device ${path}, which can wipe a whole disk.`,
  database: statement => `This runs ${statement} on a database. What it holds can't be measured from here, and it can't be undone from here.`,
  toolFailed: argv => `What it would remove couldn't be listed (${argv} failed).`,
  alsoDrops: (count, branch) => `It also moves ${branch} back past ${plural(count, 'commit', 'commits')}.`,
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
