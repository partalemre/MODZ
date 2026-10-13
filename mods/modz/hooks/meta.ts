// What a manifest does not say: each mod's group, the surfaces it draws on and, for a mod built on
// another project, where it came from. A mod missing here lands in "other" with both surfaces.
// Groups and surfaces are ids; words.ts names them in the interface language.
import type { Lang } from './kit/lang'

export type Group = 'look' | 'safety' | 'meter' | 'flow' | 'other'

export type Surface = 'desktop' | 'terminal'

// `summary` is the catalog's one line per language (≤50 characters, so a narrow pane shows it whole); manifests keep their own description.
type Meta = { group: Group; surfaces?: Surface[]; upstream?: string; summary?: Record<Lang, string> }

export const GROUPS: Group[] = ['look', 'safety', 'meter', 'flow', 'other']
export const BOTH: Surface[] = ['desktop', 'terminal']

export const META: Record<string, Meta> = {
  skins: { group: 'look', summary: { en: 'Themes the transcript; /skin switches it', tr: "Transkripti temalarla çizer; /skin ile değişir" } },
  filetree: { group: 'look', summary: { en: 'Files Claude touches and their git status', tr: "Claude'un dokunduğu dosyalar ve git durumu" } },
  'replay-theater': { group: 'look', upstream: 'anthropics/claude-code-playground', summary: { en: "Replays the last turn's edits step by step", tr: "Son turun düzenlemelerini adım adım oynatır" } },
  'terminal-browser': { group: 'look', surfaces: ['terminal'], summary: { en: 'A browser that runs in the terminal', tr: "Terminalde çalışan tarayıcı" } },
  modz: { group: 'look', summary: { en: 'This pane: the hub and a catalog of every mod', tr: "Bu panel: ana sayfa ve tüm modların kataloğu" } },
  'blast-radius': { group: 'safety', upstream: 'anthropics/claude-code-playground', summary: { en: "Holds risky commands, shows what they'd delete", tr: "Riskli komutları tutar, neyi sileceğini gösterir" } },
  'secret-guard': { group: 'safety', summary: { en: 'Catches keys before they reach disk or git', tr: "Anahtarları diske ya da git'e düşmeden yakalar" } },
  checkpoint: { group: 'safety', summary: { en: 'A quiet git snapshot before every turn', tr: "Her turdan önce sessiz git anlık görüntüsü" } },
  'session-budget': { group: 'safety', summary: { en: 'Session budget: warns at 80%, asks at 100%', tr: "Oturum bütçesi: %80'de uyarır, %100'de sorar" } },
  'cache-tax': { group: 'safety', upstream: 'karanb192/cache-tax', summary: { en: 'Keeps the cache warm on breaks, shows the cost', tr: "Molada önbelleği sıcak tutar, bedeli gösterir" } },
  'hud-pro': { group: 'meter', summary: { en: 'One line: 5h, 7d, context and cost', tr: "Tek satır: 5 saat, 7 gün, bağlam ve maliyet" } },
  'effort-router': { group: 'meter', summary: { en: "Each turn's effort; can lower it for light asks", tr: "Her turun eforu; hafif işte düşürebilir" } },
  handoff: { group: 'flow', summary: { en: 'A handoff note before the context fills', tr: "Bağlam dolmadan bir devir notu" } },
  'test-badge': { group: 'meter', summary: { en: 'Runs tests and lint when source changes', tr: "Kaynak değişince test ve lint çalıştırır" } },
  'savvy-progress': { group: 'meter', summary: { en: 'Task band and Agents pane: progress, cost', tr: "Görev bandı ve Ajanlar paneli: ilerleme, maliyet" } },
  'savvy-flow': { group: 'flow', summary: { en: 'A planning model and five tiers of worker agents', tr: "Planlayan model ve beş katmanlı işçi ajan akışı" } },
  'plan-steps': { group: 'flow', summary: { en: "The plan's steps and where the work is", tr: "Planın adımları ve işin nerede olduğu" } },
  'reflect-mod': { group: 'flow', summary: { en: 'Turns your corrections into CLAUDE.md rules', tr: "Düzeltmelerini CLAUDE.md kuralına çevirir" } },
  'done-ping': { group: 'flow', summary: { en: 'A ping when a long turn ends or Claude waits', tr: "Uzun tur bitince ya da Claude beklerken bildirim" } },
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
