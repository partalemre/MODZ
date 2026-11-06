import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import { cardText } from './card'
import type { CardSpec } from './card'
import { makeFilm } from './film'
import { filmLine } from './film-run'
import { linesOf, stateTree } from './states'
import { withHome } from './kit/home'
import { setLang } from './kit/lang'
import { pinned } from './kit/pin'
import { isAskedFor, isOffStage, shownOf } from './kit/stage'
import { copyImage, sharedLine, shareOnX } from './share'
import type { ShareIo } from './share'
import { pagePic, pageWidth, slidesFor } from './story'
import { panelWords } from './story-words'
import { AWK, parseOutput, rootOf, transcriptPaths } from './scan'
import { dayKey, isWrapped, wrappedOf } from './stats'
import { words } from './words'
import type { Film, Shared, Wrapped, WrappedView } from '../types'

const PANE = 'wrapped'
const IDLE: WrappedView = { status: 'idle' }
const SCAN_TIMEOUT_MS = 600_000
const FILM_STEP_TIMEOUT_MS = 180_000
const YEAR = /^20\d\d$/
const DEFAULT_COLUMNS = 40

const viewAtom = atom({ plugin: 'wrapped', key: 'view' } as const, IDLE, { shape: 'view-1' })
const rootAtom = atom({ plugin: 'wrapped', key: 'root' } as const, '')
// On by default: these pages are the person's own; "Hide names" masks them everywhere before anything is shared.
const namedAtom = atom({ plugin: 'wrapped', key: 'isNamed' } as const, true)
const pageAtom = atom({ plugin: 'wrapped', key: 'page' } as const, 0)
const sharedAtom = atom({ plugin: 'wrapped', key: 'shared' } as const, null as Shared | null)
const filmAtom = atom({ plugin: 'wrapped', key: 'film' } as const, null as Film | null)

const keyOf = (year: number): string => `wrapped.${year}`
const why = (error: unknown): string => (error instanceof Error ? error.message : String(error))
const yearOf = (ms: number): number => new Date(ms).getFullYear()

async function writeHub($: EngineInterface, wrapped: Wrapped | null): Promise<void> {
  const t = words()
  await $.state.set(
    { plugin: 'wrapped', key: 'hub' },
    { pane: PANE, detail: wrapped === null ? '' : t.hubDetail(wrapped), tone: wrapped === null ? 'idle' : 'ok', at: await $.clock.now(), title: t.paneTitle, hint: t.hubHint, icon: 'star', section: 'meter' },
  )
}

async function scanYear($: EngineInterface, year: number): Promise<Wrapped | null> {
  const root = await read($, rootAtom)
  if (root === '') throw new Error(words().noRoot)
  const paths = await transcriptPaths(dir => $.fs.list(dir), root, Date.UTC(year, 0, 1))
  // shortcut: needs awk on PATH, so Windows without Git Bash lands in the failed state; a JS reader would need streaming file reads.
  const ran = await $.process.run(['awk', '-v', `YEAR=${year}`, AWK], { stdin: paths.join('\n'), timeoutMs: SCAN_TIMEOUT_MS })
  if (ran.exitCode !== 0) throw new Error(ran.stderr.trim().slice(0, 200) || `awk ended with ${ran.exitCode}`)

  return wrappedOf(parseOutput(ran.stdout), { year, readAt: await $.clock.now() })
}

// In a dispatch of its own: the walk takes minutes on a big archive and the session must stay free.
function readYear($: EngineInterface, year: number): void {
  $.clock.after(1, async () => {
    try {
      const wrapped = await scanYear($, year)
      if (wrapped === null) {
        await update($, viewAtom, () => ({ status: 'empty', year }))

        return
      }
      await $.store.set(keyOf(year), wrapped).catch((error: unknown) => $.ui.log(`wrapped: reading not kept (${why(error)})`, { to: 'debug' }))
      await update($, viewAtom, () => ({ status: 'ready', wrapped }))
      await writeHub($, wrapped)
    } catch (error) {
      await update($, viewAtom, () => ({ status: 'failed', year, reason: why(error) }))
    }
  })
}

async function hubFromStore($: EngineInterface): Promise<void> {
  await writeHub($, await kept($, yearOf(await $.clock.now())))
}

async function kept($: EngineInterface, year: number): Promise<Wrapped | null> {
  const saved = await $.store.get(keyOf(year)).catch(() => undefined)

  return isWrapped(saved) ? saved : null
}

async function clearNotes($: EngineInterface): Promise<void> {
  await update($, sharedAtom, () => null)
  await update($, pageAtom, () => 0)
  await update($, filmAtom, film => (film?.status === 'making' ? film : null))
}

// A year read before shows at once; "Read again" is the person's call, since reading works the disk for minutes.
async function showYear($: EngineInterface, year: number): Promise<void> {
  const current = await read($, viewAtom)
  if (current.status === 'reading') return
  await clearNotes($)
  const wrapped = await kept($, year)
  if (wrapped !== null) {
    await update($, viewAtom, () => ({ status: 'ready', wrapped }))

    return
  }
  await update($, viewAtom, () => ({ status: 'reading', year }))
  readYear($, year)
}

async function openPane($: EngineInterface, year: number): Promise<void> {
  await showYear($, year)
  await $.ui.open({ id: PANE, title: words().paneTitle })
  try {
    if ((await $.state.get({ plugin: 'modz', key: 'isOn' })).value === true) await $.state.set({ plugin: 'wrapped', key: 'shown' }, shownOf(PANE, await $.clock.now()))
  } catch {
    $.ui.log('wrapped: could not tell the hub the pane is shown', { to: 'debug' })
  }
}

function filmIo($: EngineInterface) {
  return {
    write: (path: string, text: string) => $.fs.write(path, text),
    run: (argv: string[]) => $.process.run(argv, { timeoutMs: FILM_STEP_TIMEOUT_MS }),
    progress: (made: number, total: number) => update($, filmAtom, () => ({ status: 'making', made, total })),
  }
}

// Drawing and encoding take half a minute, so it runs in a dispatch of its own; its frames live in a folder of its
// own, removed either way. The person pressed the button, so the finished video opens.
async function runFilm($: EngineInterface, spec: CardSpec): Promise<void> {
  const home = await $.env.get('HOME')
  const temp = await $.env.get('TMPDIR')
  const dir = `${(typeof temp === 'string' && temp !== '' ? temp : '/tmp').replace(/\/+$/, '')}/wrapped-film-${spec.wrapped.year}`
  const out = `${home}/Downloads/wrapped-${spec.wrapped.year}.mp4`
  try {
    await $.process.run(['ffmpeg', '-version']).catch(() => {
      throw new Error(words().filmNoFfmpeg)
    })
    await makeFilm(filmIo($), spec, { dir, out })
    await update($, filmAtom, () => ({ status: 'ready', path: out }))
    await $.process.run(['open', out]).catch(() => $.ui.log('wrapped: the video did not open by itself', { to: 'debug' }))
  } catch (error) {
    await update($, filmAtom, () => ({ status: 'failed', reason: why(error) }))
  } finally {
    await $.process.run(['rm', '-rf', dir]).catch(() => $.ui.log('wrapped: film frames not removed', { to: 'debug' }))
  }
}

async function startFilm($: EngineInterface, spec: CardSpec): Promise<void> {
  if ((await read($, filmAtom))?.status === 'making') return
  await update($, filmAtom, () => ({ status: 'making', made: 0, total: 1 }))
  $.clock.after(1, () => runFilm($, spec))
}

type Table = Record<string, any>
type ReadyView = { spec: CardSpec; page: number; shared: Shared | null; film: Film | null; surface: string; columns: number; rows: number }

// A page comes in as one, in its own frame so the move survives the pane's redraws. A frame's own margin would push
// the page out past its edge.
const ENTER = '<style>:root{color-scheme:dark}body{margin:0}svg{display:block;animation:m-in .32s cubic-bezier(.22,1,.36,1)}@keyframes m-in{from{opacity:0;transform:translateY(10px)}}@media (prefers-reduced-motion: reduce){svg{animation:none}}</style>'

function navTree($: EngineInterface, ui: Table, view: ReadyView, count: number) {
  const { Box, Text, Button } = ui
  const t = panelWords()
  const move = (by: number) => () => update($, pageAtom, page => Math.max(0, Math.min(count - 1, page + by)))

  return (
    <Box flexDirection="row" alignItems="center" columnGap={1}>
      <Button key="back" label={`‹ ${t.back}`} variant="secondary" onPress={move(-1)} />
      <Button key="next" label={`${t.next} ›`} variant="primary" onPress={move(1)} />
      <Text dimColor>{t.page(view.page + 1, count)}</Text>
    </Box>
  )
}

const shareIo = ($: EngineInterface): ShareIo => ({
  home: () => $.env.get('HOME'),
  write: (path, text) => $.fs.write(path, text),
  run: (argv, timeoutMs) => $.process.run(argv, { timeoutMs }),
})

function shareTree($: EngineInterface, ui: Table, view: ReadyView) {
  const { Box, Text, Button } = ui
  const { spec, shared, film } = view
  const t = words()
  const p = panelWords()
  const note = (press: (spec: CardSpec) => Promise<Shared>) => async () => {
    const done = await press(spec)
    await update($, sharedAtom, () => done)
  }

  return (
    <Box flexDirection="column" rowGap={1}>
      <Box flexDirection="row" columnGap={1} flexWrap="wrap">
        <Button key="copy-image" label={p.copyImage} variant="secondary" onPress={note(s => copyImage(shareIo($), s))} />
        <Button key="share-x" label={p.shareX} variant="secondary" onPress={note(s => shareOnX(shareIo($), s))} />
        <Button key="film" label={t.filmMake} variant="secondary" onPress={() => startFilm($, spec)} />
      </Box>
      <Box flexDirection="row" columnGap={1} flexWrap="wrap">
        <Button key="names" label={spec.isNamed ? t.hideNames : t.showNames} plain dimColor onPress={() => update($, namedAtom, is => !is)} />
        <Button key="again" label={t.readAgain} plain dimColor onPress={() => rereadYear($, spec.wrapped.year)} />
      </Box>
      <Text dimColor>{spec.isNamed ? p.namesShown : p.namesHidden}</Text>
      {shared !== null && <Text dimColor>{sharedLine(shared)}</Text>}
      {film !== null && <Text dimColor>{filmLine(film)}</Text>}
    </Box>
  )
}

function readyTree($: EngineInterface, ui: Table, view: ReadyView) {
  const { Box, Text, Svg } = ui
  const { spec, surface, columns, rows } = view
  const canDraw = Svg !== undefined && surface !== 'terminal'
  const count = slidesFor(spec.wrapped).length
  const pic = pagePic(spec, view.page, pageWidth(columns || DEFAULT_COLUMNS, rows))

  return (
    <Box flexDirection="column" rowGap={1}>
      {canDraw ? <Svg key="wrapped-page" {...pic} source={pic.source.replace(/(<svg[^>]*>)/, `$1${ENTER}`)} isInteractive /> : <Text>{cardText(spec)}</Text>}
      {canDraw && navTree($, ui, view, count)}
      {shareTree($, ui, view)}
      <Text dimColor>{words().readAt(dayKey(spec.wrapped.readAt))}</Text>
    </Box>
  )
}

async function rereadYear($: EngineInterface, year: number): Promise<void> {
  await clearNotes($)
  await update($, viewAtom, () => ({ status: 'reading', year }))
  readYear($, year)
}

async function goHome($: EngineInterface): Promise<void> {
  try {
    await $.state.set({ plugin: 'wrapped', key: 'home' }, { at: await $.clock.now() })
  } catch {
    $.ui.log('wrapped: could not go back to the hub', { to: 'debug' })
  }
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    setLang(await $.env.get('MODZ_LANG').catch(() => undefined))
    await $.command.register({ name: 'wrapped', description: words().commandHelp })
    await hubFromStore($).catch(() => $.ui.log('wrapped: no hub card', { to: 'debug' }))

    return next(e)
  })

  on('classic.SessionStart', async ($, e, next) => {
    const root = rootOf(typeof e.transcript_path === 'string' ? e.transcript_path : '')
    if (root !== '') await update($, rootAtom, () => root)

    return next(e)
  }).catch(($, e, next) => next(e))

  on('command.run', { command: 'wrapped' }, async ($, e) => {
    const asked = e.args.trim()
    if (asked !== '' && !YEAR.test(asked)) return { text: words().badYear }
    await openPane($, asked === '' ? yearOf(await $.clock.now()) : Number(asked))

    return { text: words().opened }
  })

  // The hub's row asks for this pane; another pane taking the hub's one panel closes it.
  on('state.set', { plugin: 'modz', key: 'open' } as any, async ($: EngineInterface, e: any, next: any) => {
    const done = await next(e)
    if (isAskedFor(e.value, PANE)) await openPane($, yearOf(await $.clock.now()))

    return done
  }).catch(($: EngineInterface, e: any, next: any) => next(e))
  on('state.set', { plugin: 'modz', key: 'stage' } as any, async ($: EngineInterface, e: any, next: any) => {
    const done = await next(e)
    if (isOffStage(e.value, PANE)) await $.ui.close({ id: PANE })

    return done
  }).catch(($: EngineInterface, e: any, next: any) => next(e))

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const ui = $.ui.resolve(e) as Table
    const view = await read($, viewAtom)
    const isHubOn = (await $.state.get({ plugin: 'modz', key: 'isOn' } as any).catch(() => ({ value: false }))).value === true
    const tree =
      view.status === 'ready'
        ? readyTree($, ui, { spec: { wrapped: view.wrapped, isNamed: await read($, namedAtom) }, page: await read($, pageAtom), shared: await read($, sharedAtom), film: await read($, filmAtom), surface: e.surface, columns: e.props.bodyColumns, rows: e.props.scroll?.bodyRows ?? 0 })
        : stateTree(ui, linesOf(view))

    return pinned(e, withHome(ui, tree, isHubOn ? () => goHome($) : null))
  })
}
