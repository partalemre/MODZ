import { isBridgeState, type BridgeState } from './bridge-protocol'
import type { Host } from './host'
import { authHeaders, bridgeUrl, state } from './session'

// A watcher that stopped (the session unloading, the bridge gone) leaves nothing to talk to:
// the next /browser launches a bridge again instead of posting to a dead port.
export function forgetBridge(cause: unknown): void {
  state.port = null
  state.token = null
  state.last = state.last === null ? null : { ...state.last, alive: false, error: `terminal-browser bağlantısı koptu: ${String(cause)}` }
}

export async function post(host: Host, path: string, body: unknown): Promise<unknown> {
  if (state.port === null) return null
  try {
    const response = await host.fetch(bridgeUrl(path), {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    })
    return response.ok ? JSON.parse(response.text || '{}') : null
  } catch {
    return null
  }
}

export async function fetchState(host: Host, version: number): Promise<BridgeState | null> {
  if (state.port === null) return null
  try {
    const response = await host.fetch(bridgeUrl(`/state?version=${version}`), { headers: authHeaders() })
    const parsed: unknown = response.ok ? JSON.parse(response.text) : null
    return isBridgeState(parsed) ? parsed : null
  } catch {
    return null
  }
}
