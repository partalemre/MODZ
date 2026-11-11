// Every word the person reads from secret-guard, in English or in Turkish (MODZ_LANG=tr).
// Read through `words()` when drawing or asking: the language is set at session.start.

import { pick } from './lang'
import type { Lang } from './lang'
import type { GuardPending } from '../types'

export type Words = {
  allow: string
  cancel: string
  question: string
  // The MODZ panel's line while a write waits on the question.
  hubWaiting: (subject: string) => string
  // The safe fix's label, for one key or several.
  move: (count: number) => string
  privateKey: string
  allowLine: string
  cancelLine: string
  moveLine: (isMovable: boolean) => string
  envFile: string
  // The value column of an env file staged for git.
  toGit: string
  line: (line: number) => string
  leakEyebrow: string
  envEyebrow: string
  leakTitle: (source: GuardPending['source'], count: number) => string
  envTitle: (envFiles: string[]) => string
  moreFindings: (count: number) => string
  moreRows: (count: number) => string
  commandLine: string
  toggled: (isOn: boolean) => string
  // The status line under the prompt: how many pasted secrets the model only knows as placeholders.
  keptOut: (count: number) => string
  // The status line's mark while recording mode masks the screen.
  rec: string
  recCommandLine: string
  recToggled: (isOn: boolean) => string
}

const plural = (count: number, one: string, many: string): string => `${count} ${count === 1 ? one : many}`

const EN_SOURCE: Record<GuardPending['source'], string> = { write: 'This write has', add: 'The files about to be saved have', commit: 'This saved version has' }
const TR_SOURCE: Record<GuardPending['source'], string> = { write: 'Bu yazımda', add: 'Kayda eklenen dosyalarda', commit: 'Bu kayıtta' }

const EN: Words = {
  allow: 'Allow once',
  cancel: 'Cancel',
  question: 'How do you want to go on?',
  hubWaiting: subject => `A secret key in ${subject} is waiting for you`,
  move: count => (count === 1 ? 'Move key to the secrets file' : 'Move keys to the secrets file'),
  privateKey: 'Private key',
  allowLine: 'It goes ahead as it is; the key stays readable to anyone who gets these files.',
  cancelLine: 'It is stopped, nothing is written or saved, and Claude is told why.',
  moveLine: isMovable => (isMovable
    ? 'Recommended. The keys move to the secrets file (.env), which is kept out of saved versions; the code reads them from there.'
    : 'Recommended. This step stops; Claude moves the keys to the secrets file (.env) and tries again.'),
  envFile: 'secrets file',
  toGit: 'about to be saved',
  line: line => `line ${line}`,
  leakEyebrow: 'Leak blocked',
  envEyebrow: 'Secrets file',
  leakTitle: (source, count) => `${EN_SOURCE[source]} ${plural(count, 'secret key', 'secret keys')}`,
  envTitle: envFiles => (envFiles.length === 1 ? `${envFiles[0] ?? '.env'} is about to go into a saved version` : `${envFiles.length} secrets files are about to go into a saved version`),
  moreFindings: count => `+ ${plural(count, 'more finding', 'more findings')}`,
  moreRows: count => `+ ${count} more`,
  commandLine: 'Turn on or off the check for secret keys before a file is written or a version is saved',
  toggled: isOn => `secret-guard ${isOn ? 'on' : 'off'}`,
  keptOut: count => `${plural(count, 'secret', 'secrets')} kept out of the chat`,
  rec: 'REC',
  recCommandLine: 'Recording mode: hide keys, secret settings and e-mail addresses on screen',
  recToggled: isOn => (isOn ? 'Recording mode on: keys, secret settings and e-mail addresses are hidden on screen' : 'Recording mode off'),
}

const TR: Words = {
  allow: 'Bir kez izin ver',
  cancel: 'Vazgeç',
  question: 'Nasıl devam edilsin?',
  hubWaiting: subject => `${subject} içindeki gizli anahtar seni bekliyor`,
  move: count => (count === 1 ? 'Anahtarı gizli ayar dosyasına taşı' : 'Anahtarları gizli ayar dosyasına taşı'),
  privateKey: 'Özel anahtar',
  allowLine: 'Olduğu gibi devam eder; anahtar bu dosyaları alan herkesin okuyabileceği hâlde kalır.',
  cancelLine: 'Durdurulur, hiçbir şey yazılmaz ya da kaydedilmez; Claude\'a nedeni söylenir.',
  moveLine: isMovable => (isMovable
    ? 'Önerilen. Anahtarlar gizli ayar dosyasına (.env) taşınır; bu dosya kayıtlara girmez, kod anahtarları oradan okur.'
    : 'Önerilen. Bu adım durur; Claude anahtarları gizli ayar dosyasına (.env) taşıyıp yeniden dener.'),
  envFile: 'gizli ayar dosyası',
  toGit: 'kayda giriyor',
  line: line => `satır ${line}`,
  leakEyebrow: 'Sızıntı engellendi',
  envEyebrow: 'Gizli ayar dosyası',
  leakTitle: (source, count) => `${TR_SOURCE[source]} ${count} gizli anahtar var`,
  envTitle: envFiles => `${envFiles.length === 1 ? (envFiles[0] ?? '.env') : `${envFiles.length} gizli ayar dosyası`} kayda giriyor`,
  moreFindings: count => `+${count} bulgu daha`,
  moreRows: count => `+${count} daha`,
  commandLine: 'Dosya yazılmadan ya da sürüm kaydedilmeden önce gizli anahtar kontrolünü aç/kapat',
  toggled: isOn => `secret-guard ${isOn ? 'açık' : 'kapalı'}`,
  keptOut: count => `${count} gizli anahtar sohbetin dışında tutuldu`,
  rec: 'REC',
  recCommandLine: 'Kayıt modu: anahtarları, gizli ayarları ve e-posta adreslerini ekranda gizle',
  recToggled: isOn => (isOn ? 'Kayıt modu açık: anahtarlar, gizli ayarlar ve e-posta adresleri ekranda gizlenir' : 'Kayıt modu kapalı'),
}

export const WORDS: Readonly<Record<Lang, Words>> = { en: EN, tr: TR }

export const words = (): Words => pick(WORDS)
