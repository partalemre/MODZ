/* @jsx h */
import type { EngineInterface, Register } from 'claude-code'
import type { Browser } from './browser'
import { post } from './bridge-client'
import { imageGrid, imageSource, paneStatus } from './frame'
import type { Host } from './host'
import { browserClosed, closeBrowser, openBrowser } from './pane-control'
import { IMAGE_KEY, START_URL, state, viewKey } from './session'
import { statusView } from './status'
import { isInputMessage, isSizeMessage } from './bridge-protocol'
import { setLang } from './lang'
import { openedText, word } from './words'

// Hook filters stay literal here (session.ts holds the same id): the scan follows literals, not imports.
const PANE = 'browser'
const IMAGE_ALT = ''
const OPEN_TOOL = 'mcp__terminal-browser__open'
const CLOSE_TOOL = 'mcp__terminal-browser__close'
const MIN_BODY_ROWS = 8
const PANE_CHROME_ROWS = 8
const FALLBACK_VIEWPORT_ROWS = 30
const FALLBACK_VIEWPORT_COLUMNS = 80
const MAX_SCROLL_TICKS = 10

type On = Parameters<Register>[0]

function hostOf($: EngineInterface): Host {
  return {
    root: $.plugin.root,
    exists: path => $.fs.exists(path),
    run: (argv, init) => $.process.run(argv, init),
    fetch: (url, init) => $.http.fetch(url, init),
    sleep: ms => $.clock.sleep(ms),
    log: (text, init) => $.ui.log(text, init),
    redraw: () => $.ui.invalidate('ui.render'),
    open: request => $.ui.open(request),
    close: request => $.ui.close(request),
    blit: request => $.ui.blit(request),
    fill: request => $.prompt.fill(request),
  }
}

function onBrowserNoun(on: On): void {
// this is a hack because the plugin api does not allow $ or the result of next to be passed to functions
  on('engine.create', async ($, e, next) => {
    const built = await next(e)
    const servedByHooks = () => { throw new Error('the browser noun is served by its hooks') }
    const browser: Browser = { open: servedByHooks, close: servedByHooks }
    return { ...built, browser }
  })

  on('browser.open', async ($, e) => {
    const opened = await openBrowser(hostOf($), e.url ?? null)
    return { value: opened }
  })

  on('browser.close', async ($) => {
    return { value: await closeBrowser(hostOf($)) }
  })
}

function onSessionStart(on: On, agentToolEnabled: boolean): void {
  on('session.start', async ($, e, next) => {
    // The interface language (kit/lang.ts). Spelled out: the engine admits an env read by a literal name only.
    setLang(await $.env.get('MODZ_LANG').catch(() => undefined))
    const r = await next(e)
    let surfaces: readonly string[] = []
    try {
      surfaces = await $.session.surfaces()
    } catch (err) {
      $.ui.log(`terminal-browser: yüzeyler okunamadı, terminal yok sayılıyor: ${err}`, { to: 'debug' })
    }
    // The desktop has a browser of its own: register nothing there, so /browser never clashes.
    state.isOffTerminal = !surfaces.includes('terminal') || surfaces.includes('desktop')
    if (state.isOffTerminal) return r
    await $.command.register({
      name: 'browser',
      description: word('command'),
      argumentHint: '[url]',
      immediate: true,
    }).catch(err => $.ui.log(`terminal-browser: /browser kaydedilemedi: ${err}`))
    if (agentToolEnabled) {
      await $.tool.register({
        name: 'open',
        description: 'Open terminal-browser directly inside claude code. Control the open page with the terminal-browser action CLI.',
        inputSchema: { type: 'object', properties: { url: { type: 'string', description: 'The page to open, as a full url or a host name' } } },
      }).catch(err => $.ui.log(`terminal-browser: open aracı kaydedilemedi: ${err}`))
      await $.tool.register({ name: 'close', description: 'Close the terminal-browser pane.' }).catch(err => $.ui.log(`terminal-browser: close aracı kaydedilemedi: ${err}`))
    }
    return r
  })
}

function onCommands(on: On): void {
  on('command.run', { command: 'browser' }, async ($, e) => {
    const arg = e.args.trim()
    if (arg === 'close' || (!arg && state.open)) {
      const wasOpen = await closeBrowser(hostOf($))
      return { text: word(wasOpen ? 'closed' : 'alreadyClosed') }
    }
    const opened = await openBrowser(hostOf($), arg || null)
    return { text: opened.ok ? openedText(opened.url, opened.url === START_URL) : opened.error }
  })

  on('tool.call', { tool: new RegExp(`^${OPEN_TOOL}$`) }, async ($, e) => {
    const url = (e as { url?: unknown }).url
    const opened = await openBrowser(hostOf($), typeof url === 'string' ? url : null)
    if (!opened.ok) return { deny: `could not open the browser: ${opened.error}` }
    return { result: [{ type: 'text', text: `opened ${opened.url} ` }] }
  })

  on('tool.call', { tool: new RegExp(`^${CLOSE_TOOL}$`) }, async ($) => {
    const closed = await closeBrowser(hostOf($))
    return { result: [{ type: 'text', text: closed ? 'browser pane closed' : 'no browser pane was open (maybe the user closed it?)' }] }
  })
}

function onPaneRender(on: On): void {
  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    if (e.surface !== 'terminal') {
      const { Box } = await $.ui.resolve(e)
      return <Box />
    }
    const { Box, Client, Image, Text } = await $.ui.resolve(e)
    const rows = e.props.scroll.bodyRows > 0 ? e.props.scroll.bodyRows : Math.max(MIN_BODY_ROWS, (e.viewport?.rows ?? FALLBACK_VIEWPORT_ROWS) - PANE_CHROME_ROWS)
    const cols = Math.max(1, e.props.bodyColumns > 0 ? e.props.bodyColumns : (e.viewport?.columns ?? FALLBACK_VIEWPORT_COLUMNS))
    const frame = state.frame
    const grid = frame ? imageGrid(frame, cols, rows) : null
    state.mounted = grid
    return (
      <Box flexDirection="column" width={cols} height={rows}>
        {frame && grid ? (
          <Image key={IMAGE_KEY} source={imageSource(frame)} columns={grid.cols} rows={grid.rows} alt={IMAGE_ALT} />
        ) : statusView({ Box, Text }, paneStatus())}
        <Box position="absolute" top={0} left={0} width={cols} height={rows}>
          <Client key={viewKey()} module="./surface.tsx" width={cols} height={rows} />
        </Box>
      </Box>
    )
  })
}

function onPaneInput(on: On): void {
  on('ui.message', async ($, e, next) => {
    if (e.requestId !== PANE || state.port === null) return next(e)
    if (isSizeMessage(e.data)) {
      state.region = { cols: e.data.cols, rows: e.data.rows }
      if (state.pendingUrl) {
        const url = state.pendingUrl
        state.pendingUrl = null
        await post(hostOf($), '/open', { url, ...state.region })
      } else {
        await post(hostOf($), '/size', state.region)
      }
    } else if (isInputMessage(e.data)) {
      await post(hostOf($), '/input', { events: e.data.events })
    }
    return next(e)
  })

  on('ui.scroll', { requestId: PANE }, async ($, e) => {
    if (state.port === null || !state.open || e.by === 0) return {}
    const kind = e.by < 0 ? 'scrollup' : 'scrolldown'
    const ticks = Math.min(Math.round(Math.abs(e.by)) || 1, MAX_SCROLL_TICKS)
    const x = e.pointer?.column ?? Math.floor((state.region?.cols ?? 0) / 2)
    const y = e.pointer?.row ?? Math.floor((state.region?.rows ?? 0) / 2)
    const events = Array.from({ length: ticks }, () => ({ type: 'mouse', kind, x, y }))
    await post(hostOf($), '/input', { events })
    return {}
  })
}

export const register: Register = (on, options) => {
  const agentToolEnabled = options.agentTool === true
  onBrowserNoun(on)
  onSessionStart(on, agentToolEnabled)
  onCommands(on)
  onPaneRender(on)
  onPaneInput(on)
  on('ui.close', { id: PANE }, async ($, e, next) => {
    const r = await next(e)
    await browserClosed(hostOf($))
    return r
  })
}
