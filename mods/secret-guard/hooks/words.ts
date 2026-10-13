// Every word the person reads from secret-guard, in English or in Turkish (MODZ_LANG=tr).
// Read through `words()` when drawing or asking: the language is set at session.start.

import { pick } from './lang'
import type { Lang } from './lang'
import type { GuardPending } from '../types'

export type Words = {
  allow: string
  cancel: string
  question: string
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

const EN_SOURCE: Record<GuardPending['source'], string> = { write: 'This write has', add: 'The files being added have', commit: 'This commit has' }
const TR_SOURCE: Record<GuardPending['source'], string> = { write: 'Bu yazımda', add: 'Bu eklemede', commit: 'Bu commit\'te' }

const EN: Words = {
  allow: 'Allow once',
  cancel: 'Cancel',
  question: 'How do you want to go on?',
  move: count => (count === 1 ? 'Move key to .env' : 'Move keys to .env'),
  privateKey: 'Private key',
  allowLine: 'The call runs as it is; the key stays in the open.',
  cancelLine: 'The call is blocked and Claude is told why.',
  moveLine: isMovable => (isMovable
    ? 'Recommended. The values go into .env, which git ignores; the code reads them from the environment.'
    : 'Recommended. The call stops; Claude moves the keys to .env and tries again.'),
  envFile: 'env file',
  toGit: 'being added to git',
  line: line => `line ${line}`,
  leakEyebrow: 'LEAK BLOCKED',
  envEyebrow: 'ENV FILE',
  leakTitle: (source, count) => `${EN_SOURCE[source]} ${plural(count, 'secret key', 'secret keys')}`,
  envTitle: envFiles => (envFiles.length === 1 ? `${envFiles[0] ?? '.env'} is being added to git` : `${envFiles.length} env files are being added to git`),
  moreFindings: count => `+ ${plural(count, 'more finding', 'more findings')}`,
  moreRows: count => `+ ${count} more`,
  commandLine: 'Turn the secret key scan before writes and git add/commit on or off',
  toggled: isOn => `secret-guard ${isOn ? 'on' : 'off'}`,
  keptOut: count => `${plural(count, 'secret', 'secrets')} kept out of the chat`,
  rec: 'REC',
  recCommandLine: 'Recording mode: mask keys, env values and e-mail addresses on screen',
  recToggled: isOn => (isOn ? 'Recording mode on: keys, env values and e-mail addresses are masked on screen' : 'Recording mode off'),
}

const TR: Words = {
  allow: 'Bir kez izin ver',
  cancel: 'Vazgeç',
  question: 'Nasıl devam edilsin?',
  move: count => (count === 1 ? "Anahtarı .env'e taşı" : "Anahtarları .env'e taşı"),
  privateKey: 'Özel anahtar',
  allowLine: 'Bu çağrı olduğu gibi çalışır; anahtar açıkta kalır.',
  cancelLine: 'Çağrı engellenir; Claude\'a nedeni söylenir.',
  moveLine: isMovable => (isMovable
    ? 'Önerilen. Değerler .env\'e yazılır, .env git dışında tutulur; kod onları ortamdan okur.'
    : 'Önerilen. Çağrı durur; Claude anahtarları .env\'e taşıyıp yeniden dener.'),
  envFile: 'ortam dosyası',
  toGit: 'git\'e ekleniyor',
  line: line => `satır ${line}`,
  leakEyebrow: 'SIZINTI ENGELLENDİ',
  envEyebrow: 'ORTAM DOSYASI',
  leakTitle: (source, count) => `${TR_SOURCE[source]} ${count} gizli anahtar var`,
  envTitle: envFiles => `${envFiles.length === 1 ? (envFiles[0] ?? '.env') : `${envFiles.length} ortam dosyası`} git'e ekleniyor`,
  moreFindings: count => `+${count} bulgu daha`,
  moreRows: count => `+${count} daha`,
  commandLine: 'Yazma ve git add/commit öncesi gizli anahtar taramasını aç/kapat',
  toggled: isOn => `secret-guard ${isOn ? 'açık' : 'kapalı'}`,
  keptOut: count => `${count} sır sohbetin dışında tutuldu`,
  rec: 'REC',
  recCommandLine: 'Kayıt modu: anahtarları, env değerlerini ve e-posta adreslerini ekranda maskele',
  recToggled: isOn => (isOn ? 'Kayıt modu açık: anahtarlar, env değerleri ve e-posta adresleri ekranda maskelenir' : 'Kayıt modu kapalı'),
}

export const WORDS: Readonly<Record<Lang, Words>> = { en: EN, tr: TR }

export const words = (): Words => pick(WORDS)
