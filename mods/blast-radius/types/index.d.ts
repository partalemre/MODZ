// The one-line card the MODZ main panel collects from every mod (DESIGN.md §9). This mod has no pane: what it
// holds is answered on its card above the prompt, so the card says `isBandOnly` and its row shows only while it waits.
export type HubCard = { pane: string; detail: string; tone: 'idle' | 'warn'; at: number; title: string; icon: string; section: 'safety'; isBandOnly: true }

declare module 'claude-code' {
  interface PluginState {
    'blast-radius': { hub: HubCard }
  }
}
