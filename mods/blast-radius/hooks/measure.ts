// Measures a risky command's blast radius. Never throws: a failed read is said, not hidden.

import { measureClean, measureRm } from './measure-files'
import { measureChanges, measureMigrations, measurePush } from './measure-git'
import { emptyReport } from './report'
import type { Report, Run } from './report'
import type { Risk } from './classify'
import { words } from './words'

const ERROR_CHARS = 160

export async function measure(run: Run, risk: Risk, cwd: string): Promise<Report> {
  try {
    if (risk.kind === 'rm') return await measureRm(run, risk, cwd)
    if (risk.kind === 'git-clean') return await measureClean(run, risk, cwd)
    if (risk.kind === 'migrate') return await measureMigrations(run, risk, cwd)
    if (risk.kind === 'git-push-force') return await measurePush(run, risk, cwd)

    return await measureChanges(run, risk, cwd)
  } catch (error) {
    const reason = String(error instanceof Error ? error.message : error).slice(0, ERROR_CHARS)

    return emptyReport('unknown', `${risk.label} (could not measure it)`, words().notes.unmeasured(reason))
  }
}

export const missingFolder = (risk: Risk): Report =>
  emptyReport('unknown', `${risk.label} in ${risk.dir}`, words().notes.missingFolder(String(risk.dir)))
