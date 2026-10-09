import type { BridgeState, Frame } from './bridge-protocol'
import { fetchState } from './bridge-client'
import { fitsMounted, imageSource } from './frame'
import type { Host } from './host'
import { deliverAgentText } from './inbox'
import { IMAGE_KEY, PANE, state } from './session'

const WATCH_RETRY_MS = 250
const DENIED_REDRAW_MS = 500
const DENIALS_BEFORE_LOGGING = 3
const TITLE_MAX_CHARS = 40

type Denials = { count: number; lastRedraw: number }

async function refreshPane(host: Host, previous: BridgeState | null, fresh: BridgeState): Promise<void> {
  const pictureGone = fresh.frame === null && state.frame !== null
  if (pictureGone) state.frame = null
  const paneChanged =
    !previous
    || pictureGone
    || previous.title !== fresh.title
    || previous.alive !== fresh.alive
    || previous.error !== fresh.error
  if (paneChanged) {
    host.redraw()
    if (fresh.title) await host.open({ id: PANE, title: fresh.title.slice(0, TITLE_MAX_CHARS) })
  }
}

async function drawFrame(host: Host, frame: Frame, denials: Denials): Promise<void> {
  const result = await host.blit({ requestId: PANE, key: IMAGE_KEY, source: imageSource(frame) })
  if (!result.deny) {
    denials.count = 0
    return
  }
  denials.count += 1
  if (denials.count === DENIALS_BEFORE_LOGGING) host.log(`terminal-browser: kare çizimi reddedildi: ${result.deny}`)
  const now = Date.now()
  if (now - denials.lastRedraw >= DENIED_REDRAW_MS) {
    denials.lastRedraw = now
    host.redraw()
  }
}

export async function watchBridge(host: Host): Promise<void> {
  const watcher = ++state.watcher
  const live = () => state.watcher === watcher && state.port !== null
  let version = -1
  const denials: Denials = { count: 0, lastRedraw: 0 }
  while (live()) {
    const fresh = await fetchState(host, version)
    if (!live()) return
    if (!fresh) {
      await host.sleep(WATCH_RETRY_MS)
      continue
    }
    version = fresh.version
    const previous = state.last
    state.last = fresh
    if (fresh.inbox > 0) await deliverAgentText(host)
    if (!state.open) continue
    await refreshPane(host, previous, fresh)
    const frame = fresh.frame
    if (!frame || frame.generation === state.frame?.generation) continue
    state.frame = frame
    if (!fitsMounted(frame)) {
      host.redraw()
      continue
    }
    await drawFrame(host, frame, denials)
  }
}
