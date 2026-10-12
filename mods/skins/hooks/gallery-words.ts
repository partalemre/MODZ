// The gallery's section titles and notes, in English and Turkish, read at draw time.
import { pick } from './lang'

const EN = {
  prompt: 'Your prompt',
  tools: 'Tool rows: done, running, failed',
  group: 'Folded group of reads and searches',
  diff: 'Edit diff card',
  diffNote: 'Desktop only; the terminal keeps Claude Code’s own diff.',
  shell: 'Shell output card',
  shellNote: 'Desktop only.',
  shellStates: 'Shell output card: passed, failed',
  code: 'Code block card',
  codeNote: 'Desktop only; the terminal keeps Claude Code’s own markdown.',
  table: 'Table',
  spinner: 'Spinner',
  spinnerModes: 'Spinner: thinking, running a tool, writing, waiting',
  band: 'Band above the prompt: normal, then a nudge to compact',
  ask: 'Band above a question',
  footer: 'Turn footer (terminal)',
}

const TR: typeof EN = {
  prompt: 'Senin istemin',
  tools: 'Araç satırları: bitti, çalışıyor, başarısız',
  group: 'Okuma ve aramaların katlanmış grubu',
  diff: 'Düzenleme diff kartı',
  diffNote: "Yalnızca masaüstü; terminal Claude Code'un kendi diff'ini korur.",
  shell: 'Kabuk çıktı kartı',
  shellNote: 'Yalnızca masaüstü.',
  shellStates: 'Kabuk çıktı kartı: başarılı, başarısız',
  code: 'Kod bloğu kartı',
  codeNote: "Yalnızca masaüstü; terminal Claude Code'un kendi markdown'ını korur.",
  table: 'Tablo',
  spinner: 'Spinner',
  spinnerModes: 'Spinner: düşünüyor, araç çalışıyor, yazıyor, bekliyor',
  band: 'İstem üstü bant: normal, sonra sıkıştırma önerisi',
  ask: 'Soru üstü bant',
  footer: 'Tur altbilgisi (terminal)',
}

export const galleryWords = (): typeof EN => pick({ en: EN, tr: TR })
