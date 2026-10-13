// What a mod reports to the MODZ hub, and what the hub asks a mod to open (DESIGN.md §9).
export type HubTone = 'idle' | 'live' | 'ok' | 'warn' | 'bad'

export type HubSection = 'work' | 'safety' | 'meter'

// One mod's line on the hub, written by that mod under `{ plugin: '<mod>', key: 'hub' }`. A mod the hub
// does not know names its own row with the optional fields; for a known mod the hub's own words win.
export type HubCard = {
  pane: string
  detail: string
  tone: HubTone
  at: number
  title?: string
  hint?: string
  icon?: string
  section?: HubSection
  badge?: string
}

// Written when a hub row is pressed; the mod that owns `pane` opens its own pane.
export type ModzOpen = { pane: string; at: number }

// Written by a mod under `{ plugin: '<mod>', key: 'home' }` when its pane's "MODZ" button is pressed: the hub
// comes forward (and opens again if it was closed).
export type ModzHome = { at: number }

// The person's arrangement of the hub, kept across sessions: rows moved (`order`, by pane) and rows hidden.
export type HubLayout = { hidden: string[]; order: string[] }

declare module 'claude-code' {
  interface PluginState {
    // `isOn` is true while the hub runs: a mod's pane then draws its "← MODZ" button (kit/home.tsx).
    modz: { open: ModzOpen; cards: Record<string, HubCard>; layout: HubLayout; isEditing: boolean; isOn: boolean }
    // Each listed mod's own hub line (hooks/hub.ts BASES), which the hub listens for and keeps.
    'savvy-progress': { hub: HubCard; home: ModzHome }
    filetree: { hub: HubCard; home: ModzHome }
    'plan-steps': { hub: HubCard; home: ModzHome }
    transceiver: { hub: HubCard; home: ModzHome }
    'test-badge': { hub: HubCard; home: ModzHome }
    checkpoint: { hub: HubCard; home: ModzHome }
    'replay-theater': { hub: HubCard; home: ModzHome }
    'hud-pro': { hub: HubCard; home: ModzHome }
    skins: { hub: HubCard; home: ModzHome }
    'effort-router': { hub: HubCard; home: ModzHome }
    handoff: { hub: HubCard; home: ModzHome }
  }
}
