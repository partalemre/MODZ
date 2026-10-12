import { pick } from './lang'

// Git's side of the pane's words, in English and in Turkish (MODZ_LANG=tr): what each git or gh verb says
// while it runs and once done, why a commit did not happen, and how a commit ended. Read at call time.

export type Said = { running: string; done: string }
export type Reason = 'nothing' | 'identity' | 'notRepo' | 'conflicts' | 'sign' | 'emptyMessage' | 'locked' | 'hook'

const EN_VERBS: Record<string, Said> = {
  commit: { running: 'committing', done: 'committed' },
  push: { running: 'pushing', done: 'pushed' },
  pull: { running: 'pulling', done: 'pulled' },
  fetch: { running: 'fetching', done: 'fetched' },
  checkout: { running: 'checking out', done: 'checked out' },
  switch: { running: 'switching branch', done: 'switched branch' },
  branch: { running: 'creating branch', done: 'branch created' },
  merge: { running: 'merging', done: 'merged' },
  rebase: { running: 'rebasing', done: 'rebased' },
  'cherry-pick': { running: 'cherry-picking', done: 'cherry-picked' },
  stash: { running: 'stashing', done: 'stashed' },
  reset: { running: 'resetting', done: 'reset' },
  restore: { running: 'restoring', done: 'restored' },
  revert: { running: 'reverting', done: 'reverted' },
  add: { running: 'staging', done: 'staged' },
  rm: { running: 'removing', done: 'removed' },
  mv: { running: 'moving', done: 'moved' },
  tag: { running: 'tagging', done: 'tagged' },
  init: { running: 'initializing', done: 'initialized' },
  clone: { running: 'cloning', done: 'cloned' },
  'pr create': { running: 'opening PR', done: 'PR opened' },
  'pr merge': { running: 'merging PR', done: 'PR merged' },
  'pr checkout': { running: 'checking out PR', done: 'PR checked out' },
  'pr comment': { running: 'commenting on PR', done: 'commented on PR' },
  'pr review': { running: 'reviewing PR', done: 'PR reviewed' },
  'repo clone': { running: 'cloning', done: 'cloned' },
  'release create': { running: 'publishing release', done: 'release published' },
  'issue create': { running: 'opening issue', done: 'issue opened' },
}

const TR_VERBS: Record<string, Said> = {
  commit: { running: 'commit ediliyor', done: 'commit edildi' },
  push: { running: 'push ediliyor', done: 'push edildi' },
  pull: { running: 'pull ediliyor', done: 'pull edildi' },
  fetch: { running: 'fetch ediliyor', done: 'fetch edildi' },
  checkout: { running: 'checkout ediliyor', done: 'checkout edildi' },
  switch: { running: 'dal değiştiriliyor', done: 'dal değiştirildi' },
  branch: { running: 'dal açılıyor', done: 'dal açıldı' },
  merge: { running: 'merge ediliyor', done: 'merge edildi' },
  rebase: { running: 'rebase ediliyor', done: 'rebase edildi' },
  'cherry-pick': { running: 'cherry-pick ediliyor', done: 'cherry-pick edildi' },
  stash: { running: 'stash ediliyor', done: 'stash edildi' },
  reset: { running: 'reset ediliyor', done: 'reset edildi' },
  restore: { running: 'geri yükleniyor', done: 'geri yüklendi' },
  revert: { running: 'revert ediliyor', done: 'revert edildi' },
  add: { running: 'stage ediliyor', done: 'stage edildi' },
  rm: { running: 'siliniyor', done: 'silindi' },
  mv: { running: 'taşınıyor', done: 'taşındı' },
  tag: { running: 'etiketleniyor', done: 'etiketlendi' },
  init: { running: 'başlatılıyor', done: 'başlatıldı' },
  clone: { running: 'klonlanıyor', done: 'klonlandı' },
  'pr create': { running: 'PR açılıyor', done: 'PR açıldı' },
  'pr merge': { running: 'PR merge ediliyor', done: 'PR merge edildi' },
  'pr checkout': { running: 'PR checkout ediliyor', done: 'PR checkout edildi' },
  'pr comment': { running: "PR'a yorum yazılıyor", done: "PR'a yorum yazıldı" },
  'pr review': { running: 'PR inceleniyor', done: 'PR incelendi' },
  'repo clone': { running: 'klonlanıyor', done: 'klonlandı' },
  'release create': { running: 'sürüm yayımlanıyor', done: 'sürüm yayımlandı' },
  'issue create': { running: 'issue açılıyor', done: 'issue açıldı' },
}

const EN = {
  reasons: {
    nothing: 'nothing to commit', identity: 'git identity not set', notRepo: 'not a git repository', conflicts: 'conflicts not resolved',
    sign: 'could not sign', emptyMessage: 'commit message is empty', locked: 'git is locked (index.lock)', hook: 'a git hook stopped it',
  } satisfies Record<Reason, string>,
  committed: 'committed',
  committedIn: (place: string) => `committed · ${place}`,
  noCommit: (reason: string) => `no commit: ${reason}`,
  noCommitMade: 'no commit made',
  commitRan: 'git commit ran',
  failed: (verb: string) => `${verb} failed`,
  ran: (kind: string) => `${kind} ran`,
}

type GitWords = typeof EN

const TR: GitWords = {
  reasons: {
    nothing: 'değişiklik yok', identity: 'git kimliği ayarlı değil', notRepo: 'git deposu değil', conflicts: 'çakışma çözülmemiş',
    sign: 'imza atılamadı', emptyMessage: 'commit mesajı boş', locked: 'git kilidi açık (index.lock)', hook: 'bir git kancası durdurdu',
  },
  committed: 'commit edildi',
  committedIn: place => `commit edildi · ${place}`,
  noCommit: reason => `commit olmadı: ${reason}`,
  noCommitMade: 'commit oluşmadı',
  commitRan: 'git commit çalıştı',
  failed: verb => `${verb} başarısız`,
  ran: kind => `${kind} çalıştı`,
}

export const gitWords = (): GitWords => pick({ en: EN, tr: TR })

// What a git or gh verb says while it runs and once done; the verb itself when nothing is written for it.
export const saidOf = (verb: string): Said => pick({ en: EN_VERBS, tr: TR_VERBS })[verb] ?? { running: verb, done: verb }
