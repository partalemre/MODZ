import { confirmCard } from './confirm'
import type { CardModel, Ui } from './confirm'
import { desktopCard } from './svg-card'
import type { GuardOption, GuardPending } from '../types'

export const ALLOW = 'Bir kez izin ver'
export const CANCEL = 'Vazgeç'
export const HEADER = 'secret-guard'
export const QUESTION = 'Nasıl devam edilsin?'

// The safe fix comes first: the dialog's first answer is the one Enter takes.
export const moveLabel = (count: number): string => (count === 1 ? "Anahtarı .env'e taşı" : "Anahtarları .env'e taşı")

const DETECTOR_CHIPS: [RegExp, string][] = [
  [/^Anthropic/, 'Anthropic'],
  [/^sk- /, 'OpenAI'],
  [/^Stripe/, 'Stripe'],
  [/^AWS/, 'AWS'],
  [/^GitHub/, 'GitHub'],
  [/^Supabase/, 'Supabase'],
  [/^private key/, 'Özel anahtar'],
]

/** The chip a finding wears: the detector, or the variable name a generic match was assigned to. */
export function chipOf(label: string): string {
  return DETECTOR_CHIPS.find(([pattern]) => pattern.test(label))?.[1] ?? label.replace(/ value$/, '')
}

/** The dialog's answers, each with the line that says what it does. */
export function optionsOf(found: { secretCount: number; isMovable: boolean }): GuardOption[] {
  const allow = { label: ALLOW, description: 'Bu çağrı olduğu gibi çalışır; anahtar açıkta kalır.' }
  const cancel = { label: CANCEL, description: 'Çağrı engellenir; Claude\'a nedeni söylenir.' }
  if (found.secretCount === 0) return [cancel, allow]
  const move = found.isMovable
    ? 'Önerilen. Değerler .env\'e yazılır, .env git dışında tutulur; kod onları ortamdan okur.'
    : 'Önerilen. Çağrı durur; Claude anahtarları .env\'e taşıyıp yeniden dener.'

  return [{ label: moveLabel(found.secretCount), description: move }, allow, cancel]
}

// An env file staged for git is no secret value but is shown among them: its path stands where a location would.
function rowsOf(pending: GuardPending): string[][] {
  const env = pending.envFiles.map(path => ['ortam dosyası', '', path])
  const secrets = pending.secrets.map(secret => [secret.label, secret.masked, secret.where])

  return [...env, ...secrets]
}

export function cardModel(pending: GuardPending): CardModel {
  const rows = rowsOf(pending)

  return {
    tone: pending.secrets.length === 0 ? 'warning' : 'error',
    title: pending.secrets.length === 0 ? 'Ortam dosyası' : 'Gizli anahtar',
    subject: pending.subject,
    summary: `${rows.length} bulgu`,
    columns: [{ align: 'left', isDim: false }, { align: 'left', isDim: false }, { align: 'left', isDim: true }],
    rows,
    total: rows.length,
  }
}

// Desktop draws the vector card; the terminal keeps the text card, both within the dialog's rows.
export function cardTree(ui: Ui, pending: GuardPending, spec: { width: number; isLight: boolean; surface: string }) {
  if (spec.surface !== 'terminal' && 'Svg' in ui) return desktopCard(ui, pending, spec)

  return confirmCard(ui, cardModel(pending), spec.width)
}
