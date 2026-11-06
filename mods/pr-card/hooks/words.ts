import { pick } from './kit/lang'
import type { Merge, PrState, Review } from '../types'

const EN = {
  state: { open: 'Open', merged: 'Merged', closed: 'Closed' } as Record<PrState, string>,
  draft: 'Draft',
  files: (n: number) => (n === 1 ? '1 file' : `${n} files`),
  checksLabel: 'Checks',
  reviewLabel: 'Review',
  mergeLabel: 'Merge',
  failingLabel: 'Failing',
  noChecks: 'None',
  passed: (done: number, all: number) => `${done}/${all} passed`,
  failed: (n: number) => `${n} failed`,
  running: (n: number) => `${n} running`,
  review: { approved: 'Approved', changes: 'Changes asked', required: 'Waiting', none: 'Not asked' } as Record<Review, string>,
  merge: { ready: 'Ready', conflict: 'Conflicts', blocked: 'Blocked', behind: 'Behind base', draft: 'Draft', unknown: 'Checking' } as Record<Merge, string>,
  moreFiles: (n: number) => `+${n}`,
  loading: 'Reading the pull request…',
  noGh: 'gh is not available, so only the link is known',
  failed1: 'gh could not read this pull request',
  stale: (ago: string) => `Could not refresh · last read ${ago}`,
  ago: (minutes: number) => (minutes < 1 ? 'just now' : minutes < 60 ? `${minutes} min ago` : `${Math.floor(minutes / 60)} h ago`),
  refresh: 'Refresh',
}

type Words = typeof EN

const TR: Words = {
  state: { open: 'Açık', merged: 'Birleşti', closed: 'Kapalı' },
  draft: 'Taslak',
  files: n => `${n} dosya`,
  checksLabel: 'Kontroller',
  reviewLabel: 'İnceleme',
  mergeLabel: 'Birleştirme',
  failingLabel: 'Başarısız',
  noChecks: 'Yok',
  passed: (done, all) => `${done}/${all} geçti`,
  failed: n => `${n} başarısız`,
  running: n => `${n} çalışıyor`,
  review: { approved: 'Onaylandı', changes: 'Değişiklik istendi', required: 'Bekliyor', none: 'İstenmedi' },
  merge: { ready: 'Hazır', conflict: 'Çakışma var', blocked: 'Engelli', behind: 'Tabandan geride', draft: 'Taslak', unknown: 'Bakılıyor' },
  moreFiles: n => `+${n}`,
  loading: 'Pull request okunuyor…',
  noGh: 'gh yok, yalnızca bağlantı biliniyor',
  failed1: 'gh bu pull request’i okuyamadı',
  stale: ago => `Yenilenemedi · son okuma ${ago}`,
  ago: minutes => (minutes < 1 ? 'az önce' : minutes < 60 ? `${minutes} dk önce` : `${Math.floor(minutes / 60)} sa önce`),
  refresh: 'Yenile',
}

export const words = (): Words => pick({ en: EN, tr: TR })
