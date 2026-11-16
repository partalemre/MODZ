// shortcut: the plugin-authoring skill's own make-colors.d.ts names `ThemeColors`, which the engine types laid here
// (Claude Code 2.1.296) do not have; copy the skill's file over this one once the CLI is 2.1.324 or later.
type Anchors = Partial<Record<'surface-0' | 'surface-1' | 'surface-2' | 'surface-3' | 'text-primary' | 'text-secondary' | 'text-muted', string>>
type Mode = { roles?: Record<string, string>; gray: { anchors: Anchors } }

export function makeColors(definition: { label: string; roles?: Record<string, string>; light?: Mode; dark?: Mode }): { theme: unknown; problems: string[] }
