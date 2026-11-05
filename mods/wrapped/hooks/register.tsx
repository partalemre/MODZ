import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import { cardPic, cardText, standalone } from './card'
import type { CardSpec } from './card'
import { makeFilm } from './film'
import { withHome } from './kit/home'
import { setLang } from './kit/lang'
import { isAskedFor, isOffStage, shownOf } from './kit/stage'
import { AWK, parseOutput, rootOf, transcriptPaths } from './scan'
import { dayKey, isWrapped, wrappedOf } from './stats'
import { words } from './words'
import type { Film, Saved, Wrapped, WrappedView } from '../types'

const PANE = 'wrapped'
const IDLE: WrappedView = { status: 'idle' }
const SCAN_TIMEOUT_MS = 600_000
const CONVERT_TIMEOUT_MS = 30_000
const FILM_STEP_TIMEOUT_MS = 180_000
const YEAR = /^20\d\d$/
// How much wider than the drawing the saved image is.
const IMAGE_SCALE = 3

const viewAtom = atom({ plugin: 'wrapped', key: 'view' } as const, IDLE, { shape: 'view-1' })
const rootAtom = atom({ plugin: 'wrapped', key: 'root' } as const, '')
// Off by default: a project or file name may be private, and the card is made to be posted.
const namedAtom = atom({ plugin: 'wrapped', key: 'isNamed' } as const, false)
const savedAtom = atom({ plugin: 'wrapped', key: 'saved' } as const, null as Saved | null)
const copiedAtom = atom({ plugin: 'wrapped', key: 'copied' } as const, false)
const filmAtom = atom({ plugin: 'wrapped', key: 'film' } as const, null as Film | null)

const keyOf = (year: number): string => `wrapped.${year}`
const why = (error: unknown): string => (error instanceof Error ? error.message : String(error))
const yearOf = (ms: number): number => new Date(ms).getFullYear()

async function writeHub($: EngineInterface, wrapped: Wrapped | null): Promise<void> {
  const t = words()
  await $.state.set(
    { plugin: 'wrapped', key: 'hub' },
    { pane: PANE, detail: wrapped === null ? '' : t.hubDetail(wrapped), tone: wrapped === null ? 'idle' : 'ok', at: await $.clock.now(), title: t.paneTitle, hint: t.hubHint, icon: 'sparkle', section: 'meter' },
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
  await update($, savedAtom, () => null)
  await update($, copiedAtom, () => false)
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

// PNG through macOS's own `sips` where it exists; otherwise the SVG the conversion started from stays.
async function saveImage($: EngineInterface, spec: CardSpec): Promise<Saved> {
  const home = await $.env.get('HOME')
  if (typeof home !== 'string' || home === '') return { error: 'HOME is not set' }
  const stem = `${home}/Downloads/wrapped-${spec.wrapped.year}`
  const pic = cardPic(spec)
  const svgPath = `${stem}.svg`
  await $.fs.write(svgPath, standalone(pic))
  const size = [String(pic.height * IMAGE_SCALE), String(pic.width * IMAGE_SCALE)]
  const png = `${stem}.png`
  const ran = await $.process.run(['sips', '-s', 'format', 'png', '-z', ...size, svgPath, '--out', png], { timeoutMs: CONVERT_TIMEOUT_MS }).catch(() => null)

  return ran?.exitCode === 0 ? { path: png, isImage: true } : { path: svgPath, isImage: false }
}

async function onSave($: EngineInterface, spec: CardSpec): Promise<void> {
  const saved = await saveImage($, spec).catch((error: unknown): Saved => ({ error: why(error) }))
  await update($, savedAtom, () => saved)
}

async function onCopy($: EngineInterface, spec: CardSpec, surface: string): Promise<void> {
  const copied = await $.ui.copy({ text: cardText(spec), surface: surface as never }).catch(() => ({ isCopied: false }))
  await update($, copiedAtom, () => copied.isCopied)
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

function filmLine(film: Film): string {
  const t = words()
  if (film.status === 'making') return t.filmMaking(film.made, film.total)

  return film.status === 'ready' ? t.filmReady(film.path) : t.filmFailed(film.reason)
}

const savedLine = (saved: Saved): string => {
  const t = words()
  if ('error' in saved) return t.saveFailed(saved.error)

  return saved.isImage ? t.savedImage(saved.path) : t.savedSvg(saved.path)
}

type Table = Record<string, any>

function readyTree($: EngineInterface, ui: Table, o: { spec: CardSpec; saved: Saved | null; copied: boolean; film: Film | null; surface: string }) {
  const { Box, Text, Button, Svg } = ui
  const { spec, saved, copied, film, surface } = o
  const t = words()
  const canDraw = Svg !== undefined && surface !== 'terminal'

  return (
    <Box flexDirection="column" rowGap={1}>
      {canDraw ? <Svg key="wrapped-card" {...cardPic(spec)} /> : <Text>{cardText(spec)}</Text>}
      <Text dimColor>{spec.isNamed ? t.namesOn : t.namesOff}</Text>
      <Box flexDirection="row" columnGap={1} flexWrap="wrap">
        <Button key="film" label={t.filmMake} variant="primary" onPress={() => startFilm($, spec)} />
        <Button key="save" label={t.save} variant="secondary" onPress={() => onSave($, spec)} />
        <Button key="copy" label={t.copy} variant="secondary" onPress={(press: { surface: string }) => onCopy($, spec, press.surface)} />
        <Button key="names" label={spec.isNamed ? t.hideNames : t.showNames} plain dimColor onPress={() => update($, namedAtom, is => !is)} />
        <Button key="again" label={t.readAgain} plain dimColor onPress={() => rereadYear($, spec.wrapped.year)} />
      </Box>
      {film !== null && <Text dimColor>{filmLine(film)}</Text>}
      {saved !== null && <Text dimColor>{savedLine(saved)}</Text>}
      {copied && <Text dimColor>{t.copied}</Text>}
      <Text dimColor>{t.readAt(dayKey(spec.wrapped.readAt))}</Text>
    </Box>
  )
}

async function rereadYear($: EngineInterface, year: number): Promise<void> {
  await clearNotes($)
  await update($, viewAtom, () => ({ status: 'reading', year }))
  readYear($, year)
}

function stateTree(ui: Table, lines: { title: string; hint?: string }) {
  const { Box, Text } = ui

  return (
    <Box flexDirection="column" rowGap={1}>
      <Text bold>{lines.title}</Text>
      {lines.hint !== undefined && <Text dimColor>{lines.hint}</Text>}
    </Box>
  )
}

function linesOf(view: Exclude<WrappedView, { status: 'ready' }>): { title: string; hint?: string } {
  const t = words()
  if (view.status === 'reading') return { title: t.reading(view.year), hint: t.readingHint }
  if (view.status === 'empty') return { title: t.empty(view.year), hint: t.emptyHint }
  if (view.status === 'failed') return { title: t.failed, hint: view.reason }

  return { title: t.idle }
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
        ? readyTree($, ui, { spec: { wrapped: view.wrapped, isNamed: await read($, namedAtom) }, saved: await read($, savedAtom), copied: await read($, copiedAtom), film: await read($, filmAtom), surface: e.surface })
        : stateTree(ui, linesOf(view))

    return withHome(ui, tree, isHubOn ? () => goHome($) : null)
  })
}
