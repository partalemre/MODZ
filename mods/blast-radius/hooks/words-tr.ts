// The card in Turkish: the words it had before English became the default.

import { formatSize } from './report'
import type { Report } from './report'
import type { Banner, View } from './view'
import type { Notes, Words } from './words'

export const trSize = (bytes: number): string => formatSize(bytes, ',')

function filesBanner(report: Report): Banner | null {
  if (report.count === 0 || report.tracked === null) return null
  const untracked = Math.max(0, report.count - report.tracked)
  if (untracked === 0) return { tone: 'read', text: 'Hepsi git\'te; git checkout ile geri getirilebilir.' }
  if (untracked === report.count) return { tone: 'danger', text: 'Bunların hiçbiri git\'te değil, geri getirilemez.' }

  return { tone: 'danger', text: `${untracked} tanesi git'te değil, geri getirilemez.` }
}

function banner(report: Report): Banner | null {
  if (report.note !== null && report.count === 0) return { tone: 'warn', text: report.note }
  if (report.kind === 'files') return filesBanner(report)
  if (report.kind === 'changes') return { tone: 'danger', text: `Commit edilmemiş değişiklikler (+${report.added} −${report.removed} satır) geri getirilemez.` }
  if (report.kind === 'commits') return { tone: 'danger', text: 'Bu commit\'ler uzak daldan silinir; yerelde kopyası yoksa geri gelmez.' }
  if (report.kind === 'migrations') return { tone: 'danger', text: 'Migration\'lar veritabanını değiştirir; geri almak ayrı bir iş.' }

  return report.note === null ? null : { tone: 'warn', text: report.note }
}

function headline(report: Report): { payload: string; tail: string } {
  if (report.count === 0) return { payload: 'önceden ölçülemedi', tail: '' }
  if (report.kind === 'files') return { payload: report.bytes === null ? `${report.count} yol` : `${report.count} dosya · ${trSize(report.bytes)}`, tail: ' silinecek' }
  if (report.kind === 'changes') return { payload: `${report.count} dosyadaki değişiklik`, tail: ' silinecek' }
  if (report.kind === 'commits') return { payload: `${report.count} commit`, tail: ' düşecek' }

  return { payload: `${report.count} migration`, tail: ' uygulanacak' }
}

function action(report: Report): View['action'] {
  if (report.count === 0) return { label: 'Yine de çalıştır', hotkey: 'c' }
  if (report.kind === 'files') return { label: `${report.count} dosyayı sil`, hotkey: 's' }
  if (report.kind === 'changes') return { label: 'Değişiklikleri sil', hotkey: 's' }
  if (report.kind === 'commits') return { label: 'Zorla gönder', hotkey: 'z' }

  return { label: `${report.count} migration'ı uygula`, hotkey: 'u' }
}

const notes: Notes = {
  noPaths: 'Silinecek bir yol verilmemiş.',
  decidedAtRun: names => `${names} komut çalışırken belirleniyor; neyin silineceği önceden ölçülemiyor.`,
  cleanFailed: error => `git clean -n çalışmadı: ${error}`,
  statusFailed: error => `git status çalışmadı: ${error}`,
  refMissing: ref => `${ref} yerelde yok; hangi commit'lerin düşeceği bilinemiyor. Önce git fetch çalıştır.`,
  noDroppedCommits: ref => `${ref} üzerinde düşecek commit yok (son fetch'e göre).`,
  cannotListMigrations: 'Bu araç için bekleyen migration\'lar listelenemiyor.',
  migrationsFailed: argv => `Bekleyen migration'lar listelenemedi (${argv} başarısız).`,
  unmeasured: reason => `Ölçülemedi: ${reason}`,
  missingFolder: dir => `${dir} klasörü bulunamadı, bu yüzden ne değişeceği ölçülemedi.`,
}

export const TR: Words = {
  eyebrow: 'Komut bekletildi',
  holder: 'Blast Radius bekletiyor',
  showLess: 'Daha az göster',
  showMore: 'Daha fazla göster',
  cancel: { label: 'Vazgeç', hotkey: 'v' },
  doing: isDelete => (isDelete ? 'Siliniyor…' : 'Çalıştırılıyor…'),
  fullCommand: command => `tam komut: ${command}`,
  kept: 'Tutuldu. Hiçbir şey kaybolmadı.',
  cancelWhy: 'the user pressed Vazgeç (cancel)',
  context: ({ where, folder }) => `${where === null ? '' : `${where} · `}${folder === '' ? '' : `${folder} içinde`}`,
  size: trSize,
  folderCount: count => `${count} dosya`,
  moreFiles: (hidden, bytes) => `+${hidden} dosya daha · ${trSize(bytes)}`,
  moreItems: hidden => `+${hidden} tane daha`,
  moreRows: hidden => `+${hidden} satır daha`,
  headline,
  banner,
  action,
  notes,
}
