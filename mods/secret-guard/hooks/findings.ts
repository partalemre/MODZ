import { chipOf, optionsOf } from './card'
import { isTestPath, mask } from './detect'
import type { Secret } from './detect'
import { gitSteps } from './git'
import { words } from './words'
import type { GuardPending } from '../types'

// What one scan found, and how the card and the denial messages say it.

// `token`: a finding that is one of this session's placeholders, `value` the real secret behind it.
export type Finding = Secret & { where: string; token?: string }
export type Found = { secrets: Finding[]; envFiles: string[]; path: string | null; command: string }

function relative(path: string, cwd: string): string {
  return cwd !== '' && path.startsWith(`${cwd}/`) ? path.slice(cwd.length + 1) : path
}

// A file write names the file in the card's title, so each finding says only its line.
function sourceOf(found: Found): GuardPending['source'] {
  if (found.path !== null) return 'write'

  return gitSteps(found.command).some(step => step.kind === 'commit') ? 'commit' : 'add'
}

// Moving to .env rewrites the call itself only for a file write with no private key. A test file's keys are
// fixtures more often than not: Claude is asked to deal with them instead of the guard moving them unseen.
export const isMovable = (found: Found): boolean => found.path !== null && !isTestPath(found.path) && found.secrets.every(secret => secret.isMovable)

// A placeholder is shown as itself: not even the first characters of the value behind it.
const shownOf = (secret: Finding): string => secret.token ?? mask(secret.value)

export function pendingOf(found: Found, cwd: string): GuardPending {
  const where = (secret: Finding) => (found.path === null ? secret.where : words().line(secret.line))
  const atOf = (secret: Finding) => (found.path === null ? relative(secret.where, cwd) : `${relative(found.path, cwd)}:${secret.line}`)
  const secrets = [...found.secrets].sort((a, b) => a.line - b.line)

  return {
    subject: found.path === null ? found.command : relative(found.path, cwd),
    source: sourceOf(found),
    envFiles: found.envFiles,
    secrets: secrets.map(secret => ({ label: secret.label, chip: chipOf(secret.label), masked: shownOf(secret), where: where(secret), at: atOf(secret) })),
    options: optionsOf({ secretCount: found.secrets.length, isMovable: isMovable(found) }),
  }
}

export function summary(found: Found): string {
  return found.secrets.map(secret => `${secret.label} ${shownOf(secret)} (${secret.where})`).join(', ')
}

const exposed = (found: Found): string => summary(found) || found.envFiles.join(', ')

export const unattendedDeny = (found: Found): string =>
  `secret-guard blocked this call: it would expose ${exposed(found)}, and nobody can answer its question here, so nothing was moved. Keep secrets in .env (git-ignored) and read them from the environment, or leave this change to the main conversation.`

export const blockedDeny = (found: Found): string =>
  `The user blocked this call: it would expose ${exposed(found)}. Keep secrets in .env (git-ignored) and read them from the environment.`

export const moveYourselfDeny = (found: Found): string =>
  `The user chose "Move to .env" for ${summary(found)}. Move each secret into the project's .env (git-ignored), reference it from the environment, then retry.`
