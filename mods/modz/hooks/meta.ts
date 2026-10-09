// What a manifest does not say: each mod's group, the surfaces it draws on and, for a mod built on
// another project, where it came from. A mod missing here lands in "Diğer" with both surfaces.
export type Group = 'Görünüm' | 'Koruma' | 'Ölçüm' | 'Akış' | 'Diğer'

export type Surface = 'masaüstü' | 'terminal'

// `summary` is the catalog's one Turkish line; manifests keep their own (often English) description.
type Meta = { group: Group; surfaces?: Surface[]; upstream?: string; summary?: string }

export const GROUPS: Group[] = ['Görünüm', 'Koruma', 'Ölçüm', 'Akış', 'Diğer']
export const BOTH: Surface[] = ['masaüstü', 'terminal']

export const META: Record<string, Meta> = {
  skins: { group: 'Görünüm', summary: "Transkripti temalarla yeniden çizer; /skin ile canlı değiştirilir" },
  filetree: { group: 'Görünüm', summary: "Claude'un dokunduğu dosyaların ağacı: şu an ne yaptığı, git durumu" },
  'replay-theater': { group: 'Görünüm', upstream: 'anthropics/claude-code-playground', summary: "Son turun düzenlemelerini adım adım, renkli diff ile oynatır" },
  'terminal-browser': { group: 'Görünüm', surfaces: ['terminal'], summary: "Terminalde çalışan tarayıcı; yalnızca terminal" },
  modz: { group: 'Görünüm', summary: "Bu panel: ana sayfa ve tüm modların kataloğu" },
  'blast-radius': { group: 'Koruma', upstream: 'anthropics/claude-code-playground', summary: "Riskli komutları tutar, neyi sileceğini gösterir" },
  'secret-guard': { group: 'Koruma', summary: "Anahtar ve token'ları diske ya da git'e düşmeden yakalar" },
  checkpoint: { group: 'Koruma', summary: "Her turdan önce sessiz git anlık görüntüsü; geri alınabilir" },
  'session-budget': { group: 'Koruma', summary: "Oturum başına harcama bütçesi: %80'de uyarır, %100'de sorar" },
  'cache-tax': { group: 'Koruma', upstream: 'karanb192/cache-tax', summary: "Molada önbelleği sıcak tutar, soğuk gönderimin bedelini gösterir" },
  'hud-pro': { group: 'Ölçüm', summary: "Prompt altında tek satır: 5 saat, 7 gün, bağlam ve oturum maliyeti" },
  'test-badge': { group: 'Ölçüm', summary: "Kaynak değişince testleri ve lint'i çalıştırır, sonucu rozetle gösterir" },
  'savvy-progress': { group: 'Ölçüm', summary: "Prompt üstünde görev bandı ve tek Ajanlar paneli: ilerleme yüzdesi, maliyet, mesaj, durdur" },
  'savvy-flow': { group: 'Akış', summary: "Planlayan oturum modeli ve beş katmanlı işçi ajanla teslim akışı" },
  'plan-steps': { group: 'Akış', summary: "Planın adımlarını ve işin nerede olduğunu gösterir" },
  'reflect-mod': { group: 'Akış', summary: "Düzeltmelerini CLAUDE.md kuralına çevirir" },
  'done-ping': { group: 'Akış', summary: "Uzun tur bitince ya da Claude seni beklerken bildirim" },
}

const GITHUB = /github\.com\/([\w.-]+)(?:\/([\w.-]+))?/

// "owner/repo" from a GitHub address, or the owner alone from a profile address.
export function githubName(url: unknown): string | null {
  const match = typeof url === 'string' ? GITHUB.exec(url) : null
  if (match === null) return null

  return match[2] === undefined ? (match[1] ?? null) : `${match[1]}/${match[2].replace(/\.git$/, '')}`
}

// Two letters for the monogram tile: the initials of a two-part name, else its first two letters.
export function monogram(name: string): string {
  const parts = name.split('-').filter(part => part !== '')
  const letters = parts.length > 1 ? `${parts[0]?.[0] ?? ''}${parts[1]?.[0] ?? ''}` : name.slice(0, 2)

  // Mod names are English: a dotless I, never İ.
  return letters.toUpperCase()
}
