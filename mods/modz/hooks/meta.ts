// What a manifest does not say: each mod's group, the surfaces it draws on and, for a mod built on
// another project, where it came from. A mod missing here lands in "Diğer" with both surfaces.
export type Group = 'Görünüm' | 'Koruma' | 'Ölçüm' | 'Akış' | 'Diğer'

export type Surface = 'masaüstü' | 'terminal'

// `summary` is the catalog's one Turkish line (≤50 characters, so a narrow pane shows it whole); manifests keep their own (often English) description.
type Meta = { group: Group; surfaces?: Surface[]; upstream?: string; summary?: string }

export const GROUPS: Group[] = ['Görünüm', 'Koruma', 'Ölçüm', 'Akış', 'Diğer']
export const BOTH: Surface[] = ['masaüstü', 'terminal']

export const META: Record<string, Meta> = {
  skins: { group: 'Görünüm', summary: "Transkripti temalarla çizer; /skin ile değişir" },
  filetree: { group: 'Görünüm', summary: "Claude'un dokunduğu dosyalar ve git durumu" },
  'replay-theater': { group: 'Görünüm', upstream: 'anthropics/claude-code-playground', summary: "Son turun düzenlemelerini adım adım oynatır" },
  'terminal-browser': { group: 'Görünüm', surfaces: ['terminal'], summary: "Terminalde çalışan tarayıcı" },
  modz: { group: 'Görünüm', summary: "Bu panel: ana sayfa ve tüm modların kataloğu" },
  'blast-radius': { group: 'Koruma', upstream: 'anthropics/claude-code-playground', summary: "Riskli komutları tutar, neyi sileceğini gösterir" },
  'secret-guard': { group: 'Koruma', summary: "Anahtarları diske ya da git'e düşmeden yakalar" },
  checkpoint: { group: 'Koruma', summary: "Her turdan önce sessiz git anlık görüntüsü" },
  'session-budget': { group: 'Koruma', summary: "Oturum bütçesi: %80'de uyarır, %100'de sorar" },
  'cache-tax': { group: 'Koruma', upstream: 'karanb192/cache-tax', summary: "Molada önbelleği sıcak tutar, bedeli gösterir" },
  'hud-pro': { group: 'Ölçüm', summary: "Tek satır: 5 saat, 7 gün, bağlam ve maliyet" },
  'test-badge': { group: 'Ölçüm', summary: "Kaynak değişince test ve lint çalıştırır" },
  'savvy-progress': { group: 'Ölçüm', summary: "Görev bandı ve Ajanlar paneli: ilerleme, maliyet" },
  'savvy-flow': { group: 'Akış', summary: "Planlayan model ve beş katmanlı işçi ajan akışı" },
  'plan-steps': { group: 'Akış', summary: "Planın adımları ve işin nerede olduğu" },
  'reflect-mod': { group: 'Akış', summary: "Düzeltmelerini CLAUDE.md kuralına çevirir" },
  'done-ping': { group: 'Akış', summary: "Uzun tur bitince ya da Claude beklerken bildirim" },
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
