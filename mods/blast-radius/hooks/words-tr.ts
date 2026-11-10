// The card in Turkish: the words it had before English became the default.

import { formatSize } from './report'
import type { Report } from './report'
import type { Banner, View } from './view'
import type { EditWords, HouseWords, Notes, Words } from './words'

const house: HouseWords = {
  banner: rule => `Ev kuralı: ${rule}`,
  anyRule: 'ev kuralları',
  action: { label: 'Yine de çalıştır', hotkey: 'c' },
}

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
  if (report.kind === 'changes') {
    const lines = report.added + report.removed === 0 ? '' : ` (+${report.added} −${report.removed} satır)`

    return { tone: 'danger', text: `Commit edilmemiş değişiklikler${lines} geri getirilemez.${report.note === null ? '' : ` ${report.note}`}` }
  }
  // Only a push lands on a remote branch; branch -D and reset drop commits locally.
  if (report.kind === 'commits') return { tone: 'danger', text: report.where?.includes('/') ? 'Bu commit\'ler uzak daldan silinir; yerelde kopyası yoksa geri gelmez.' : `Bu commit'ler ${report.where ?? 'daldan'} dalından düşer; başka bir dalda yoksa geri gelmez.` }
  if (report.kind === 'migrations') return { tone: 'danger', text: 'Migration\'lar veritabanını değiştirir; geri almak ayrı bir iş.' }
  if (report.kind === 'overwrites') return { tone: 'danger', text: 'Bu dosyaların şimdiki içeriği git\'te yok; üzerine yazılırsa geri getirilemez.' }
  if (report.kind === 'stashes') return { tone: 'danger', text: 'Silinen bir stash\'i geri getirmek zordur.' }
  if (report.kind === 'removals') return { tone: 'danger', text: 'Listelenenler kaldırılır; buradan geri getirilemez.' }

  return report.note === null ? null : { tone: 'warn', text: report.note }
}

const HEADLINES: Partial<Record<Report['kind'], (report: Report) => { payload: string; tail: string }>> = {
  files: report => ({ payload: report.bytes === null ? `${report.count} yol` : `${report.count} dosya · ${trSize(report.bytes)}`, tail: ' silinecek' }),
  changes: report => ({ payload: `${report.count} dosyadaki değişiklik`, tail: ' silinecek' }),
  commits: report => ({ payload: `${report.count} commit`, tail: ' düşecek' }),
  overwrites: report => ({ payload: `${report.count} dosya · ${trSize(report.bytes ?? 0)}`, tail: ' üzerine yazılacak' }),
  stashes: report => ({ payload: `${report.count} stash`, tail: ' silinecek' }),
  removals: report => ({ payload: `${report.count} öğe`, tail: ' kaldırılacak' }),
}

function headline(report: Report): { payload: string; tail: string } {
  if (report.count === 0) return { payload: 'önceden ölçülemedi', tail: '' }

  return HEADLINES[report.kind]?.(report) ?? { payload: `${report.count} migration`, tail: ' uygulanacak' }
}

function action(report: Report): View['action'] {
  if (report.count === 0) return { label: 'Yine de çalıştır', hotkey: 'c' }
  if (report.kind === 'files') return { label: `${report.count} dosyayı sil`, hotkey: 's' }
  if (report.kind === 'changes') return { label: 'Değişiklikleri sil', hotkey: 's' }
  if (report.kind === 'commits' && report.where?.includes('/')) return { label: 'Zorla gönder', hotkey: 'z' }
  if (report.kind === 'migrations') return { label: `${report.count} migration'ı uygula`, hotkey: 'u' }

  return { label: 'Yine de çalıştır', hotkey: 'c' }
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
  fromInput: label => `${label} girdisindeki yollara uygulanıyor; neyi değiştireceği önceden ölçülemiyor.`,
  findUnmeasured: 'Bu find silmenin yanında başka bir işlem de yapıyor; ne sileceğini görmek için denenemez.',
  device: path => `Bu komut doğrudan ${path} aygıtına yazıyor; bütün bir diski silebilir.`,
  database: statement => `Bu komut veritabanında ${statement} çalıştırıyor. İçindekiler buradan ölçülemiyor ve buradan geri alınamaz.`,
  toolFailed: argv => `Neyin kaldırılacağı listelenemedi (${argv} başarısız).`,
  alsoDrops: (count, branch) => `Ayrıca ${branch} dalı ${count} commit geri gider.`,
}

const edit: EditWords = {
  eyebrow: 'Düzenleme bekletildi',
  headline: (name, minutes) => `Başka bir sohbet ${name} dosyasını ${minutes < 1 ? 'az önce' : `${minutes} dk önce`} düzenledi`,
  context: project => (project === '' ? 'Seni bekliyor' : `${project} · Seni bekliyor`),
  banner: 'Şimdi düzenlemek o sohbetin değişikliğinin üstüne yazabilir.',
  action: { label: 'Yine de düzenle', hotkey: 'y' },
  cancel: { label: 'Bu düzenlemeyi atla', hotkey: 'a' },
  skipped: 'Atlandı. Dosyaya dokunulmadı.',
  cancelWhy: 'the user pressed Bu düzenlemeyi atla (skip this edit)',
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
  hubWaiting: command => `${command} bekliyor`,
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
  edit,
  house,
}
