import { confirmCard } from './confirm'
import type { CardModel, Ui } from './confirm'
import { desktopCard, headlineOf } from './svg-card'
import type { GuardOption, GuardPending } from '../types'
import { words } from './words'

export const HEADER = 'secret-guard'

const DETECTOR_CHIPS: [RegExp, string][] = [
  [/^Anthropic/, 'Anthropic'],
  [/^sk- /, 'OpenAI'],
  [/^Stripe/, 'Stripe'],
  [/^AWS/, 'AWS'],
  [/^GitHub/, 'GitHub'],
  [/^Supabase/, 'Supabase'],
]
const PRIVATE_KEY = /^private key/

/** The chip a finding wears: the detector, or the variable name a generic match was assigned to. */
export function chipOf(label: string): string {
  if (PRIVATE_KEY.test(label)) return words().privateKey

  return DETECTOR_CHIPS.find(([pattern]) => pattern.test(label))?.[1] ?? label.replace(/ value$/, '')
}

/** The dialog's answers, each with the line that says what it does. The safe fix comes first: Enter takes it. */
export function optionsOf(found: { secretCount: number; isMovable: boolean }): GuardOption[] {
  const said = words()
  const allow = { label: said.allow, description: said.allowLine }
  const cancel = { label: said.cancel, description: said.cancelLine }
  if (found.secretCount === 0) return [cancel, allow]

  return [{ label: said.move(found.secretCount), description: said.moveLine(found.isMovable) }, allow, cancel]
}

// An env file staged for git is no secret value but is shown among them. Alone, its path stands where a
// location would; beside secrets it takes the value column (`being added to git`), as on the desktop card.
function rowsOf(pending: GuardPending): string[][] {
  const isAlone = pending.secrets.length === 0
  const said = words()
  const env = pending.envFiles.map(path => (isAlone ? [said.envFile, '', path] : [path, said.toGit, '']))
  const secrets = pending.secrets.map(secret => [secret.label, secret.masked, secret.where])

  return [...env, ...secrets]
}

export function cardModel(pending: GuardPending): CardModel {
  const rows = rowsOf(pending)
  const head = headlineOf(pending)

  return {
    tone: pending.secrets.length === 0 ? 'warning' : 'error',
    eyebrow: head.eyebrow,
    subject: pending.subject,
    headline: head.title,
    columns: [{ align: 'left', isDim: false }, { align: 'left', isDim: false, isToned: true }, { align: 'left', isDim: true }],
    rows,
    total: rows.length,
  }
}

// Desktop draws the vector card; the terminal keeps the text card, both within the dialog's rows.
export function cardTree(ui: Ui, pending: GuardPending, spec: { width: number; isLight: boolean; surface: string }) {
  if (spec.surface !== 'terminal' && 'Svg' in ui) return desktopCard(ui, pending, spec)

  return confirmCard(ui, cardModel(pending), spec.width)
}
