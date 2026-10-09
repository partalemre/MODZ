import type { PluginOptions } from 'claude-code'

// The commands the person set in the plugin's options; an empty one means "detect it here".
export type Overrides = { test: string; lint: string; open: string }

export function overridesOf(options: PluginOptions): Overrides {
  return { test: String(options.testCommand ?? ''), lint: String(options.lintCommand ?? ''), open: String(options.openCommand ?? '') }
}
