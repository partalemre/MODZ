// What a mod reports to the MODZ hub, and what the hub asks a mod to open (DESIGN.md §9).
export type HubTone = 'idle' | 'live' | 'ok' | 'warn' | 'bad'

// One mod's line on the hub, written by that mod under `{ plugin: '<mod>', key: 'hub' }`.
export type HubCard = { pane: string; detail: string; tone: HubTone; at: number }

// Written when a hub row is pressed; the mod that owns `pane` opens its own pane.
export type ModzOpen = { pane: string; at: number }

declare module 'claude-code' {
  interface PluginState {
    modz: { open: ModzOpen; cards: Record<string, HubCard> }
    // Each listed mod's own hub line (hooks/hub.ts ENTRIES), which the hub listens for and keeps.
    'savvy-progress': { hub: HubCard }
    filetree: { hub: HubCard }
    'plan-steps': { hub: HubCard }
    transceiver: { hub: HubCard }
    'test-badge': { hub: HubCard }
    checkpoint: { hub: HubCard }
    'replay-theater': { hub: HubCard }
    'hud-pro': { hub: HubCard }
    skins: { hub: HubCard }
  }
}
