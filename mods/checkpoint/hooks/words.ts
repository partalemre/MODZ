// Every word the person reads from checkpoint, in English or in Turkish (MODZ_LANG=tr).
// Read through `words()` when drawing or answering: the language is set at session.start.

import { pick } from './lang'

export type Words = {
  title: string
  ago: (ms: number) => string
  hubDetail: (count: number) => string
  headerMeta: (count: number, ago: string) => string
  newest: (ago: string) => string
  emptyLead: string
  emptyRest: string
  turnsSaved: (turns: number) => string
  turn: (number: number) => string
  // A restore point with no turn number.
  saved: string
  beforeUndo: string
  // What a safety snapshot's label starts with; written into git, so every language's prefix is read back.
  safetyPrefix: string
  undo: string
  undoMeta: string
  question: (target: string) => string
  changed: (count: number) => string
  confirm: (count: number) => { label: string; hotkey: string }
  cancel: { label: string; hotkey: string }
  redo: string
  files: (count: number) => string
  undone: string
  willDelete: string
  moreFiles: (count: number) => string
  more: (count: number) => string
  toRestore: (count: number) => string
  toDelete: (count: number) => string
  lines: string
  summary: (restore: number, remove: number) => string
  checking: string
  undoing: string
  noRepo: string
  alreadyThere: string
  failed: string
  // Lines under the confirm card: what an undo leaves alone, and what else it brings back.
  commitsKept: (count: number) => string
  indexBack: string
  ignoredKept: string
  restored: (count: number, target: string) => string
  toggled: (isOn: boolean) => string
  toggleLine: string
  paneLine: string
  // A prompt with no words of its own.
  promptFallback: string
}

const SECOND = 1000
const MINUTE = 60 * SECOND
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

const plural = (count: number, one: string, many: string): string => `${count} ${count === 1 ? one : many}`

/** `just now`, `3m ago`, `2h ago`, `1d ago`. */
function agoEn(ms: number): string {
  if (ms < MINUTE) return 'just now'
  if (ms < HOUR) return `${Math.round(ms / MINUTE)}m ago`
  if (ms < DAY) return `${Math.round(ms / HOUR)}h ago`

  return `${Math.round(ms / DAY)}d ago`
}

function agoTr(ms: number): string {
  if (ms < MINUTE) return `${Math.max(0, Math.round(ms / SECOND))} sn önce`
  if (ms < HOUR) return `${Math.round(ms / MINUTE)} dk önce`
  if (ms < DAY) return `${Math.round(ms / HOUR)} sa önce`

  return `${Math.round(ms / DAY)} g önce`
}

const EN: Words = {
  title: 'Restore points',
  ago: agoEn,
  hubDetail: count => `${count} saved`,
  headerMeta: (count, ago) => `${count} saved · newest ${ago}`,
  newest: ago => `newest ${ago}`,
  emptyLead: 'No restore points yet',
  emptyRest: 'one is saved quietly before the first file change',
  turnsSaved: turns => `${plural(turns, 'turn', 'turns')} saved`,
  turn: number => `Turn ${number}`,
  saved: 'Restore point',
  beforeUndo: 'Before undo',
  safetyPrefix: 'before undo: ',
  undo: 'Undo',
  undoMeta: 'the current state is saved first',
  question: target => `Go back to before ${target}?`,
  changed: count => `${plural(count, 'file', 'files')} will change`,
  confirm: count => ({ label: `Restore ${plural(count, 'file', 'files')}`, hotkey: 'r' }),
  cancel: { label: 'Cancel', hotkey: 'c' },
  redo: 'Redo',
  files: count => `+${plural(count, 'file', 'files')}`,
  undone: 'undone',
  willDelete: 'will be deleted',
  moreFiles: count => `+ ${plural(count, 'more file', 'more files')}`,
  more: count => `+ ${count} more`,
  toRestore: count => `${count} to restore`,
  toDelete: count => `${count} to delete`,
  lines: 'lines',
  summary: (restore, remove) => [`${plural(restore, 'file', 'files')} will be restored`, remove > 0 ? `${plural(remove, 'new file', 'new files')} will be deleted` : ''].filter(Boolean).join(', ') + '. The current state is saved first.',
  checking: 'Checking…',
  undoing: 'Undoing…',
  noRepo: 'This folder has no version history (git).',
  alreadyThere: 'The files already match this restore point.',
  failed: 'Couldn\'t undo; the reason is in Claude Code\'s log (debug log).',
  commitsKept: count => `${plural(count, 'saved version', 'saved versions')} (commits) made since this point stay in the history; the undo shows up as new changes on top.`,
  indexBack: 'Files marked for the next saved version (staged) go back as they were too.',
  ignoredKept: 'Files git is told to skip (such as the secrets file .env) are not covered and stay as they are.',
  restored: (count, target) => `Restored ${plural(count, 'file', 'files')} to before ${target}.`,
  toggled: isOn => `restore points ${isOn ? 'on' : 'off'}`,
  toggleLine: 'Quietly saves a restore point before each turn\'s first file change: on/off',
  paneLine: 'Lists the restore points; undoes a turn',
  promptFallback: 'turn',
}

const TR: Words = {
  title: 'Geri dönüş noktaları',
  ago: agoTr,
  hubDetail: count => `${count} nokta`,
  headerMeta: (count, ago) => `${count} nokta · en yenisi ${ago}`,
  newest: ago => `en yenisi ${ago}`,
  emptyLead: 'Henüz geri dönüş noktası yok',
  emptyRest: 'ilk dosya değişikliğinden önce sessizce alınır',
  turnsSaved: turns => `${turns} tur kayıtlı`,
  turn: number => `Tur ${number}`,
  saved: 'Geri dönüş noktası',
  beforeUndo: 'Geri almadan önce',
  safetyPrefix: 'geri almadan önce: ',
  undo: 'Geri al',
  undoMeta: 'şimdiki hal önce kaydedilir',
  question: target => `${target} öncesine dönülsün mü?`,
  changed: count => `${count} dosya değişecek`,
  confirm: count => ({ label: `${count} dosyayı geri al`, hotkey: 'g' }),
  cancel: { label: 'Vazgeç', hotkey: 'v' },
  redo: 'Yinele',
  files: count => `+${count} dosya`,
  undone: 'geri alındı',
  willDelete: 'silinecek',
  moreFiles: count => `+${count} dosya daha`,
  more: count => `+${count} daha`,
  toRestore: count => `${count} geri yüklenecek`,
  toDelete: count => `${count} silinecek`,
  lines: 'satır',
  summary: (restore, remove) => [`${restore} dosya geri yüklenecek`, remove > 0 ? `${remove} yeni dosya silinecek` : ''].filter(Boolean).join(', ') + '. Önce şimdiki hal kaydedilir.',
  checking: 'Denetleniyor…',
  undoing: 'Geri alınıyor…',
  noRepo: 'Bu klasörün sürüm geçmişi (git) yok.',
  alreadyThere: 'Dosyalar zaten bu noktadaki gibi.',
  failed: 'Geri alınamadı; nedeni Claude Code günlüğünde (debug log).',
  commitsKept: count => `Bu noktadan sonraki ${count} kayıt (commit) geçmişte kalır; geri alma bunların üstüne yeni değişiklik olarak görünür.`,
  indexBack: 'Sonraki kayda hazırlanan (staged) dosyalar da eski haline döner.',
  ignoredKept: 'Git\'in atladığı dosyalar (gizli ayar dosyası .env gibi) kapsanmaz, olduğu gibi kalır.',
  restored: (count, target) => `${count} dosya ${target} öncesine döndü.`,
  toggled: isOn => `geri dönüş noktaları ${isOn ? 'açık' : 'kapalı'}`,
  toggleLine: 'Her turun ilk dosya değişikliğinden önce sessizce geri dönüş noktası alır: aç/kapa',
  paneLine: 'Geri dönüş noktalarını listeler; bir turu geri alır',
  promptFallback: 'tur',
}

/** Every language's safety prefix: a label written under one language is still read under another. */
export const SAFETY_PREFIXES = [EN.safetyPrefix, TR.safetyPrefix]

export const words = (): Words => pick({ en: EN, tr: TR })
