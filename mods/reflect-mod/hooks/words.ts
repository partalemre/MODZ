import { pick } from './lang'

// Every word the card, its toasts and the commands show, in English and Turkish. The prompt prefilter's
// trigger words (rules.ts) are detection, not UI: they stay bilingual whatever the language.
// Read through `words()` when drawing or answering: the language is set at session.start.

type Scope = 'global' | 'project'
type Status = 'pending' | 'saved' | 'skipped'

const plural = (count: number, one: string, many: string): string => `${count} ${count === 1 ? one : many}`

const TR = {
  rowLabel: { project: 'Sadece bu proje', global: 'Tüm projelerin' } as Record<Scope, string>,
  saveLabel: { project: 'Bu projeye kaydet', global: 'Tüm projelere kaydet' } as Record<Scope, string>,
  savedTitle: { project: 'Bu projeye kaydedildi', global: 'Tüm projelere kaydedildi' } as Record<Scope, string>,
  alreadySaved: 'Bu kural zaten kayıtlı',
  sure: (percent: number) => `%${percent} emin`,
  rewordPlaceholder: 'Kuralı yeniden yaz',
  rewordSubmit: 'güncelle',
  cancel: 'Vazgeç',
  reword: 'Yeniden yaz',
  skip: 'Kaydetme',
  // The keys follow the labels' first letters: Kaydet, Yeniden yaz.
  saveKey: 'k',
  rewordKey: 'y',
  more: (count: number) => `+${count} kural daha · /reflect-queue`,
  ask: 'Kural olarak kaydedilsin mi?',
  askAlt: (rule: string) => `Kural olarak kaydedilsin mi? “${rule}”`,
  said: 'Söylediğin: ',
  where: 'Nereye',
  saved: 'Kural kaydedildi',
  addedTo: 'Eklendiği yer',
  alreadyIn: 'Zaten burada',
  followsNext: 'Claude bir sonraki mesajından itibaren buna uyar.',
  // Toasts and command answers.
  ruleShape: 'reflect: kaydedilmedi - tek satır, sır yok, en fazla 200 karakter',
  brokenMarks: (path: string) => `reflect: ${path} içindeki claude-reflect işaretleri bozuk; elle düzelt, bir şey yazılmadı`,
  boxNotEmpty: 'reflect: önce istem kutusunu boşalt - kural oraya yazılacak',
  queueHelp: 'reflect: burada bulunan kurallar ve durumları',
  pauseHelp: 'reflect: istemlerinin denetimini duraklat ya da sürdür',
  nothingHere: 'Burada henüz bir şey bulunmadı.',
  status: { pending: 'bekliyor', saved: 'kayıtlı', skipped: 'atlandı' } as Record<Status, string>,
  scope: { global: 'genel', project: 'proje' } as Record<Scope, string>,
  queueHead: (waiting: number, total: number) => `${waiting} bekliyor, toplam ${total} (burada ve genel)`,
  paused: 'Duraklatıldı. İstemlerin denetlenmiyor.',
  resumed: 'Açık. Kısa istemler yeniden denetleniyor.',
}

type Words = typeof TR

const EN: Words = {
  rowLabel: { project: 'This project only', global: 'All your projects' },
  saveLabel: { project: 'Save to this project', global: 'Save to all projects' },
  savedTitle: { project: 'Saved to this project', global: 'Saved to all projects' },
  alreadySaved: 'This rule is already saved',
  sure: percent => `${percent}% sure`,
  rewordPlaceholder: 'Rewrite the rule',
  rewordSubmit: 'update',
  cancel: 'Cancel',
  reword: 'Rewrite',
  skip: "Don't save",
  saveKey: 's',
  rewordKey: 'r',
  more: count => `+${plural(count, 'more rule', 'more rules')} · /reflect-queue`,
  ask: 'Save as a rule?',
  askAlt: rule => `Save as a rule? “${rule}”`,
  said: 'You said: ',
  where: 'Where',
  saved: 'Rule saved',
  addedTo: 'Added to',
  alreadyIn: 'Already in',
  followsNext: 'Claude follows it from your next message.',
  ruleShape: 'reflect: not saved - one line, no secrets, at most 200 characters',
  brokenMarks: path => `reflect: the claude-reflect marks in ${path} are broken; fix them by hand. Nothing was written.`,
  boxNotEmpty: 'reflect: empty the prompt box first - the rule goes there',
  queueHelp: 'reflect: the rules found here and where they stand',
  pauseHelp: 'reflect: pause or resume checking your prompts',
  nothingHere: 'Nothing found here yet.',
  status: { pending: 'waiting', saved: 'saved', skipped: 'skipped' },
  scope: { global: 'global', project: 'project' },
  queueHead: (waiting, total) => `${waiting} waiting, ${total} in all (here and global)`,
  paused: 'Paused. Your prompts are not checked.',
  resumed: 'On. Short prompts are checked again.',
}

export const words = (): Words => pick({ en: EN, tr: TR })
