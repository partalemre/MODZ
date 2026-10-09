import type { BridgeState, Frame } from './bridge-protocol'

export const PANE = 'browser'
export const IMAGE_KEY = 'view'
export const START_URL = 'terminal-browser://start'

export type Grid = { cols: number; rows: number }

export const state = {
  port: null as number | null,
  token: null as string | null,
  open: false,
  pendingUrl: null as string | null,
  // The address last asked for, which the pane names until the first frame lands.
  requestedUrl: null as string | null,
  region: null as Grid | null,
  last: null as BridgeState | null,
  frame: null as Frame | null,
  mounted: null as Grid | null,
  watcher: 0,
  // a hack to programatically trigger agent input focus
  viewGeneration: 0,
  // A session drawn only off the terminal (the desktop app) gets no /browser and no pane.
  isOffTerminal: false,
}

export const bridgeUrl = (path: string) => `http://127.0.0.1:${state.port}${path}`
export const authHeaders = () => ({ authorization: `Bearer ${state.token}` })
export const viewKey = () => `view${state.viewGeneration}`
