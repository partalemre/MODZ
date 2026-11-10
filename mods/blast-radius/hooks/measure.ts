// Measures a risky command's blast radius. Never throws: a failed read is said, not hidden.

import { measureClean, measureFind, measureRm } from './measure-files'
import { measureChanges, measureMigrations, measurePush, measureReset } from './measure-git'
import { measureBranchDelete, measurePushDelete, measureStash, measureWorktree } from './measure-refs'
import { measureTool } from './measure-tools'
import { measureWrite } from './measure-write'
import { emptyReport } from './report'
import type { Report, Run } from './report'
import type { GitKind, GitRisk, Risk } from './classify'
import { words } from './words'

const ERROR_CHARS = 160

type GitMeasure = (run: Run, risk: GitRisk, cwd: string) => Promise<Report>

const GIT: Record<GitKind, GitMeasure> = {
  'git-reset': measureReset,
  'git-clean': measureClean,
  'git-push-force': measurePush,
  'git-checkout': measureChanges,
  'git-stash': measureStash,
  'git-branch-delete': measureBranchDelete,
  'git-push-delete': measurePushDelete,
  'git-worktree': measureWorktree,
}

function measureKind(run: Run, risk: Risk, cwd: string): Promise<Report> {
  if (risk.kind === 'rm') return measureRm(run, risk, cwd)
  if (risk.kind === 'migrate') return measureMigrations(run, risk, cwd)
  if (risk.kind === 'find') return measureFind(run, risk, cwd)
  if (risk.kind === 'overwrite') return measureWrite(run, risk, cwd)
  if (risk.kind === 'tool') return measureTool(run, risk, cwd)

  return GIT[risk.kind](run, risk, cwd)
}

export async function measure(run: Run, risk: Risk, cwd: string): Promise<Report> {
  // `… | xargs rm`: what it acts on is only known once its input runs.
  if (risk.isFromInput === true) return emptyReport('unknown', `${risk.label} (on paths from its input)`, words().notes.fromInput(risk.label))
  try {
    return await measureKind(run, risk, cwd)
  } catch (error) {
    const reason = String(error instanceof Error ? error.message : error).slice(0, ERROR_CHARS)

    return emptyReport('unknown', `${risk.label} (could not measure it)`, words().notes.unmeasured(reason))
  }
}

export const missingFolder = (risk: Risk): Report =>
  emptyReport('unknown', `${risk.label} in ${risk.dir}`, words().notes.missingFolder(String(risk.dir)))
