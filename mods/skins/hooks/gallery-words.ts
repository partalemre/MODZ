// The gallery's section titles and notes, in English and Turkish, read at draw time.
import { pick } from './lang'

const EN = {
  back: '← Looks',
  prompt: 'Your message',
  tools: 'Tool rows: done, running, failed',
  group: 'Folded group of reads and searches',
  diff: 'Card for a file’s changes',
  diffNote: 'Desktop only; the terminal keeps Claude Code’s own view of the changes.',
  shell: 'Command output card',
  shellNote: 'Desktop only.',
  shellStates: 'Command output card: passed, failed',
  code: 'Code block card',
  codeNote: 'Desktop only; the terminal keeps Claude Code’s own formatting (markdown).',
  table: 'Table',
  spinner: 'Busy words (spinner)',
  spinnerModes: 'Busy words: thinking, running a tool, writing, waiting',
  band: 'Band above your message box: normal, then a nudge to summarize the chat',
  ask: 'Band above a question',
  footer: 'Line under each turn (terminal)',
}

const TR: typeof EN = {
  back: '← Görünüm',
  prompt: 'Senin mesajın',
  tools: 'Araç satırları: bitti, çalışıyor, başarısız',
  group: 'Okuma ve aramaların katlanmış grubu',
  diff: 'Dosya değişiklikleri kartı',
  diffNote: "Yalnızca masaüstü; terminal Claude Code'un kendi değişiklik görünümünü korur.",
  shell: 'Komut çıktısı kartı',
  shellNote: 'Yalnızca masaüstü.',
  shellStates: 'Komut çıktısı kartı: başarılı, başarısız',
  code: 'Kod bloğu kartı',
  codeNote: "Yalnızca masaüstü; terminal Claude Code'un kendi biçimlendirmesini (markdown) korur.",
  table: 'Tablo',
  spinner: 'Meşgul sözcükleri (spinner)',
  spinnerModes: 'Meşgul sözcükleri: düşünüyor, araç çalışıyor, yazıyor, bekliyor',
  band: 'Mesaj kutusu üstü bant: normal, sonra sohbeti özetleme önerisi',
  ask: 'Soru üstü bant',
  footer: 'Tur altı satırı (terminal)',
}

export const galleryWords = (): typeof EN => pick({ en: EN, tr: TR })
