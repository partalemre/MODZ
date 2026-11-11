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
  ruleShape: 'reflect: kaydedilmedi - tek satır, gizli anahtar yok, en fazla 200 karakter',
  brokenMarks: (path: string) => `reflect: ${path} içindeki claude-reflect işaretleri bozuk; elle düzelt, bir şey yazılmadı`,
  boxNotEmpty: 'reflect: önce mesaj kutusunu boşalt - kural oraya yazılacak',
  queueHelp: 'reflect: burada bulunan kurallar ve durumları',
  pauseHelp: 'reflect: mesajlarında kural aramayı duraklat ya da sürdür',
  undoHelp: 'reflect: son kaydedilen kuralı talimat dosyasından (CLAUDE.md) geri al',
  nothingToUndo: 'reflect: geri alınacak bir kayıt yok',
  undone: (rule: string, path: string) => `reflect: geri alındı “${rule}” · ${path}`,
  writtenHead: 'reflect’in yazdıkları:',
  nothingHere: 'Burada henüz bir şey bulunmadı.',
  status: { pending: 'bekliyor', saved: 'kayıtlı', skipped: 'atlandı' } as Record<Status, string>,
  scope: { global: 'tüm projeler', project: 'bu proje' } as Record<Scope, string>,
  queueHead: (waiting: number, total: number) => `${waiting} bekliyor, toplam ${total} (bu proje ve tüm projeler)`,
  paused: 'Duraklatıldı. Mesajlarında kural aranmıyor.',
  resumed: 'Açık. Kısa mesajlarında yeniden kural aranıyor.',
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
  ruleShape: 'reflect: not saved - one line, no secret keys, at most 200 characters',
  brokenMarks: path => `reflect: the claude-reflect marks in ${path} are broken; fix them by hand. Nothing was written.`,
  boxNotEmpty: 'reflect: empty your message box first - the rule goes there',
  queueHelp: 'reflect: the rules found here and where they stand',
  pauseHelp: 'reflect: pause or resume looking for rules in your messages',
  undoHelp: 'reflect: take the last saved rule back out of its instructions file (CLAUDE.md)',
  nothingToUndo: 'reflect: nothing to undo',
  undone: (rule, path) => `reflect: took back “${rule}” · ${path}`,
  writtenHead: 'What reflect wrote:',
  nothingHere: 'Nothing found here yet.',
  status: { pending: 'waiting', saved: 'saved', skipped: 'skipped' },
  scope: { global: 'all projects', project: 'this project' },
  queueHead: (waiting, total) => `${waiting} waiting, ${total} in all (this project and all projects)`,
  paused: 'Paused. Your messages are not checked for rules.',
  resumed: 'On. Short messages are checked for rules again.',
}

export const words = (): Words => pick({ en: EN, tr: TR })
