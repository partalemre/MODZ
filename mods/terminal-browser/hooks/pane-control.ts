import { post } from './bridge-client'
import { startBridge } from './bridge-launch'
import type { Host } from './host'
import { PANE, START_URL, state } from './session'
import { normalizeUrl } from './urls'

const PANE_TITLE = 'Tarayıcı'
const PANE_ROWS = 24
const TERMINAL_ONLY = 'terminal-browser yalnızca terminalde çalışır'

function targetUrl(raw: string | null): string {
  if (raw) return normalizeUrl(raw)
  const alive = state.last?.alive === true
  return alive && state.last?.url ? state.last.url : START_URL
}

export async function openBrowser(host: Host, raw: string | null): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  if (state.isOffTerminal) return { ok: false, error: TERMINAL_ONLY }
  if (state.port === null) {
    const started = await startBridge(host)
    if (!started.ok) return started
  }
  const url = targetUrl(raw)
  state.pendingUrl = url
  state.requestedUrl = url
  state.open = true
  await host.open({ id: PANE, title: PANE_TITLE, focus: true, rows: PANE_ROWS })
  host.redraw()
  if (state.region) {
    state.pendingUrl = null
    await post(host, '/open', { url, ...state.region })
  }
  return { ok: true, url }
}

export async function closeBrowser(host: Host): Promise<boolean> {
  if (!state.open) return false
  await host.close({ id: PANE })
  return true
}

export async function browserClosed(host: Host): Promise<void> {
  state.open = false
  state.pendingUrl = null
  state.requestedUrl = null
  state.region = null
  state.frame = null
  state.mounted = null
  await post(host, '/browser/close', {})
}
