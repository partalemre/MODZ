import { pick } from './lang'

// Git's side of the pane's words, in English and in Turkish (MODZ_LANG=tr): what each git or gh verb says
// while it runs and once done, why a commit did not happen, and how a commit ended, in the plain words of DESIGN.md §10.
// Read at call time.

export type Said = { running: string; done: string }
export type Reason = 'nothing' | 'identity' | 'notRepo' | 'conflicts' | 'sign' | 'emptyMessage' | 'locked' | 'hook'

const EN_VERBS: Record<string, Said> = {
  commit: { running: 'saving a new version', done: 'new version saved' },
  push: { running: 'sending to the shared copy', done: 'sent to the shared copy' },
  pull: { running: 'bringing in from the shared copy', done: 'brought in from the shared copy' },
  fetch: { running: 'checking the shared copy', done: 'checked the shared copy' },
  checkout: { running: 'switching version', done: 'switched version' },
  switch: { running: 'switching line of work', done: 'switched line of work' },
  branch: { running: 'starting a line of work', done: 'line of work started' },
  merge: { running: 'joining lines of work', done: 'lines of work joined' },
  rebase: { running: 'moving onto the newest code', done: 'moved onto the newest code' },
  'cherry-pick': { running: 'copying a saved version', done: 'saved version copied' },
  stash: { running: 'setting changes aside', done: 'changes set aside' },
  reset: { running: 'going back to a saved version', done: 'back at a saved version' },
  restore: { running: 'restoring', done: 'restored' },
  revert: { running: 'undoing a saved version', done: 'saved version undone' },
  add: { running: 'picking changes to save', done: 'picked to save' },
  rm: { running: 'removing', done: 'removed' },
  mv: { running: 'moving', done: 'moved' },
  tag: { running: 'labelling a version', done: 'version labelled' },
  init: { running: 'starting version history', done: 'version history started' },
  clone: { running: 'downloading a copy', done: 'copy downloaded' },
  'pr create': { running: 'opening a change request', done: 'change request opened' },
  'pr merge': { running: 'accepting a change request', done: 'change request accepted' },
  'pr checkout': { running: 'getting a change request', done: 'change request here' },
  'pr comment': { running: 'commenting on a change request', done: 'commented on a change request' },
  'pr review': { running: 'reviewing a change request', done: 'change request reviewed' },
  'repo clone': { running: 'downloading a copy', done: 'copy downloaded' },
  'release create': { running: 'publishing a release', done: 'release published' },
  'issue create': { running: 'opening an issue', done: 'issue opened' },
}

const TR_VERBS: Record<string, Said> = {
  commit: { running: 'yeni sürüm kaydediliyor', done: 'yeni sürüm kaydedildi' },
  push: { running: 'ortak kopyaya gönderiliyor', done: 'ortak kopyaya gönderildi' },
  pull: { running: 'ortak kopyadan alınıyor', done: 'ortak kopyadan alındı' },
  fetch: { running: 'ortak kopyaya bakılıyor', done: 'ortak kopyaya bakıldı' },
  checkout: { running: 'sürüm değiştiriliyor', done: 'sürüm değiştirildi' },
  switch: { running: 'çalışma dalı değiştiriliyor', done: 'çalışma dalı değiştirildi' },
  branch: { running: 'çalışma dalı açılıyor', done: 'çalışma dalı açıldı' },
  merge: { running: 'çalışma dalları birleştiriliyor', done: 'çalışma dalları birleşti' },
  rebase: { running: 'en güncel kodun üstüne taşınıyor', done: 'en güncel kodun üstüne taşındı' },
  'cherry-pick': { running: 'bir kayıt kopyalanıyor', done: 'kayıt kopyalandı' },
  stash: { running: 'değişiklikler kenara konuyor', done: 'değişiklikler kenara kondu' },
  reset: { running: 'bir kayda dönülüyor', done: 'kayda dönüldü' },
  restore: { running: 'geri yükleniyor', done: 'geri yüklendi' },
  revert: { running: 'bir kayıt geri alınıyor', done: 'kayıt geri alındı' },
  add: { running: 'kaydedilecekler seçiliyor', done: 'kayda seçildi' },
  rm: { running: 'siliniyor', done: 'silindi' },
  mv: { running: 'taşınıyor', done: 'taşındı' },
  tag: { running: 'sürüm etiketleniyor', done: 'sürüm etiketlendi' },
  init: { running: 'sürüm geçmişi başlatılıyor', done: 'sürüm geçmişi başladı' },
  clone: { running: 'kopya indiriliyor', done: 'kopya indirildi' },
  'pr create': { running: 'değişiklik isteği açılıyor', done: 'değişiklik isteği açıldı' },
  'pr merge': { running: 'değişiklik isteği kabul ediliyor', done: 'değişiklik isteği kabul edildi' },
  'pr checkout': { running: 'değişiklik isteği alınıyor', done: 'değişiklik isteği alındı' },
  'pr comment': { running: 'değişiklik isteğine yorum yazılıyor', done: 'değişiklik isteğine yorum yazıldı' },
  'pr review': { running: 'değişiklik isteği inceleniyor', done: 'değişiklik isteği incelendi' },
  'repo clone': { running: 'kopya indiriliyor', done: 'kopya indirildi' },
  'release create': { running: 'sürüm yayımlanıyor', done: 'sürüm yayımlandı' },
  'issue create': { running: 'sorun kaydı açılıyor', done: 'sorun kaydı açıldı' },
}

const EN = {
  reasons: {
    nothing: 'no changes to save', identity: 'git does not know your name and email yet', notRepo: 'no version history (git) here', conflicts: 'clashing changes not settled yet',
    sign: 'could not sign the version', emptyMessage: 'the version has no description', locked: 'git is busy with another job (index.lock)', hook: 'a project check stopped it (git hook)',
  } satisfies Record<Reason, string>,
  committed: 'new version saved',
  committedIn: (place: string) => `new version saved · ${place}`,
  noCommit: (reason: string) => `not saved: ${reason}`,
  noCommitMade: 'no new version saved',
  commitRan: 'tried to save a new version',
  failed: (doing: string) => `Did not work: ${doing}`,
  ran: (doing: string) => `Ran: ${doing}`,
}

type GitWords = typeof EN

const TR: GitWords = {
  reasons: {
    nothing: 'kaydedilecek değişiklik yok', identity: 'git adını ve e-postanı henüz bilmiyor', notRepo: 'burada sürüm geçmişi (git) yok', conflicts: 'çakışan değişiklikler henüz çözülmedi',
    sign: 'sürüm imzalanamadı', emptyMessage: 'kaydın açıklaması boş', locked: 'git başka bir işle meşgul (index.lock)', hook: 'bir proje denetimi durdurdu (git hook)',
  },
  committed: 'yeni sürüm kaydedildi',
  committedIn: place => `yeni sürüm kaydedildi · ${place}`,
  noCommit: reason => `kaydedilmedi: ${reason}`,
  noCommitMade: 'yeni sürüm kaydedilmedi',
  commitRan: 'yeni sürüm kaydetmeyi denedi',
  failed: doing => `Olmadı: ${doing}`,
  ran: doing => `Çalıştı: ${doing}`,
}

export const gitWords = (): GitWords => pick({ en: EN, tr: TR })

// What a git or gh verb says while it runs and once done; the verb itself when nothing is written for it.
export const saidOf = (verb: string): Said => pick({ en: EN_VERBS, tr: TR_VERBS })[verb] ?? { running: verb, done: verb }
