// Renders the film frame by frame: headless Chrome draws window.FILM.render(t) for each moment and ffmpeg encodes
// the screenshots. No screen recording, so no dropped frames; motion blur comes from several sub-frames per frame,
// averaged over a 180° shutter. Uses only Node 22 (built-in WebSocket) and the Chrome and ffmpeg already installed.
//
//   node tools/film/render.mjs                         the whole film → tools/film/out/modz-film.mp4
//   node tools/film/render.mjs --still 1.5,9,14        stills → tools/film/out/still-<t>.png
//   node tools/film/render.mjs --from 0 --to 21 --sub 1 --workers 6   a quick draft of a range
import { spawn, execFileSync } from 'node:child_process'
import { createServer } from 'node:http'
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { extname, join } from 'node:path'
import { tmpdir } from 'node:os'

const DIR = new URL('.', import.meta.url).pathname
const OUT = join(DIR, 'out')
const CHROME = process.env.CHROME ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const FPS = 60, SHUTTER = 0.5 // of a frame
const arg = (name, fallback) => { const i = process.argv.indexOf(`--${name}`); return i > 0 ? process.argv[i + 1] : fallback }

const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json' }
function serve() {
  const server = createServer((req, res) => {
    const file = join(DIR, decodeURIComponent(new URL(req.url, 'http://x').pathname))
    if (!file.startsWith(DIR) || !existsSync(file)) { res.writeHead(404).end(); return }
    res.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' }).end(readFileSync(file))
  })
  return new Promise(ok => server.listen(0, '127.0.0.1', () => ok(server)))
}

async function browser(port, id) {
  const profile = join(tmpdir(), `modz-film-${process.pid}-${id}`)
  const proc = spawn(CHROME, ['--headless=new', '--hide-scrollbars', '--mute-audio', '--no-first-run', '--force-color-profile=srgb',
    '--disable-background-timer-throttling', '--disable-renderer-backgrounding', `--user-data-dir=${profile}`,
    '--remote-debugging-port=0', 'about:blank'], { stdio: ['ignore', 'ignore', 'pipe'] })
  const wsUrl = await new Promise((ok, fail) => {
    let log = ''
    proc.stderr.on('data', d => { log += d; const m = log.match(/ws:\/\/[^\s]+/); if (m) ok(m[0]) })
    proc.on('exit', () => fail(new Error(`chrome exited: ${log.slice(-400)}`)))
  })
  const ws = new WebSocket(wsUrl)
  await new Promise(ok => ws.addEventListener('open', ok, { once: true }))
  let next = 0
  const waiting = new Map()
  ws.addEventListener('message', e => {
    const msg = JSON.parse(e.data)
    if (msg.id && waiting.has(msg.id)) { const w = waiting.get(msg.id); waiting.delete(msg.id); msg.error ? w.fail(new Error(JSON.stringify(msg.error))) : w.ok(msg.result) }
  })
  const send = (method, params = {}, sessionId) => new Promise((ok, fail) => {
    const id = ++next
    waiting.set(id, { ok, fail })
    ws.send(JSON.stringify({ id, method, params, sessionId }))
  })
  const { targetId } = await send('Target.createTarget', { url: 'about:blank' })
  const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true })
  const page = (m, p) => send(m, p, sessionId)
  await page('Emulation.setDeviceMetricsOverride', { width: 1920, height: 1080, deviceScaleFactor: 1, mobile: false })
  await page('Page.enable')
  await page('Page.navigate', { url: `http://127.0.0.1:${port}/index.html` })
  const evaluate = async expr => {
    const r = await page('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true })
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description ?? r.exceptionDetails.text)
    return r.result.value
  }
  for (let i = 0; i < 100 && !(await evaluate('!!window.FILM').catch(() => false)); i++) await new Promise(r => setTimeout(r, 100))
  await evaluate('window.FILM.ready.then(() => true)')
  const shot = async t => {
    await evaluate(`window.FILM.render(${t})`)
    const { data } = await page('Page.captureScreenshot', { format: 'png', clip: { x: 0, y: 0, width: 1920, height: 1080, scale: 1 } })
    return Buffer.from(data, 'base64')
  }
  const close = async () => {
    ws.close(); proc.kill()
    await new Promise(ok => (proc.exitCode !== null ? ok() : proc.once('exit', ok)))
    // Chrome may still flush its profile after exit; a leftover temp folder is harmless, so say so and go on.
    try { rmSync(profile, { recursive: true, force: true, maxRetries: 5 }) } catch (e) { console.warn(`left ${profile}: ${e.code}`) }
  }
  return { shot, evaluate, close }
}

function encoder(file, sub) {
  // Sub-frames arrive in order; tmix averages each frame's own group, select keeps one output per frame.
  const vf = sub > 1 ? `tmix=frames=${sub},select='eq(mod(n\\,${sub})\\,${sub - 1})',setpts=N/${FPS}/TB` : `setpts=N/${FPS}/TB`
  const ff = spawn('ffmpeg', ['-v', 'error', '-y', '-f', 'image2pipe', '-framerate', String(FPS * sub), '-c:v', 'png', '-i', '-',
    '-vf', vf, '-r', String(FPS), '-c:v', 'ffv1', '-level', '3', '-pix_fmt', 'yuv444p', file], { stdio: ['pipe', 'inherit', 'inherit'] })
  const write = buf => new Promise(ok => (ff.stdin.write(buf) ? ok() : ff.stdin.once('drain', ok)))
  const done = new Promise((ok, fail) => ff.on('exit', c => (c === 0 ? ok() : fail(new Error(`ffmpeg ${c}`)))))
  return { write, end: () => { ff.stdin.end(); return done } }
}

async function main() {
  mkdirSync(OUT, { recursive: true })
  execFileSync('bun', [join(DIR, 'assets.ts')], { stdio: 'inherit' })
  const server = await serve()
  const port = server.address().port
  const still = arg('still')
  if (still) {
    const b = await browser(port, 0)
    for (const t of still.split(',').map(Number)) writeFileSync(join(OUT, `still-${t}.png`), await b.shot(t))
    await b.close(); server.close(); return
  }
  const probe = await browser(port, 'probe')
  const film = await probe.evaluate('({ duration: FILM.duration, cues: FILM.cues })')
  await probe.close()
  writeFileSync(join(OUT, 'cues.json'), JSON.stringify(film, null, 1))
  execFileSync('python3', ['-I', join(DIR, 'score.py')], { stdio: 'inherit' })
  const from = Number(arg('from', 0)), to = Number(arg('to', film.duration))
  const sub = Number(arg('sub', 4)), workers = Number(arg('workers', 6))
  const first = Math.round(from * FPS), last = Math.round(to * FPS)
  const per = Math.ceil((last - first) / workers)
  const started = Date.now()
  let made = 0
  const parts = await Promise.all(Array.from({ length: workers }, async (_, w) => {
    const a = first + w * per, z = Math.min(last, a + per)
    const file = join(OUT, `part-${w}.mkv`)
    if (a >= z) return null
    const b = await browser(port, w), enc = encoder(file, sub)
    for (let f = a; f < z; f++) {
      for (let s = 0; s < sub; s++) await enc.write(await b.shot((f + (s / sub - 0.5) * SHUTTER * (sub > 1 ? 1 : 0)) / FPS))
      if (++made % 120 === 0) console.log(`${made}/${last - first} frames · ${((Date.now() - started) / 1000).toFixed(0)}s`)
    }
    await b.close()
    await enc.end()
    return file
  }))
  server.close()
  const list = join(OUT, 'parts.txt')
  writeFileSync(list, parts.filter(Boolean).map(p => `file '${p}'`).join('\n'))
  const video = arg('out', join(OUT, 'modz-film.mp4'))
  const score = join(OUT, 'score.wav')
  const hasScore = existsSync(score) && from === 0
  const audio = hasScore ? ['-map', '1:a', '-af', 'loudnorm=I=-16:TP=-1.5:LRA=11', '-ar', '48000', '-c:a', 'aac', '-b:a', '160k', '-shortest'] : ['-an']
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', list, ...(hasScore ? ['-i', score] : []), '-map', '0:v',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', arg('crf', '18'), '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-r', String(FPS),
    '-movflags', '+faststart', ...audio, video], { stdio: 'inherit' })
  console.log(`${video} · ${((Date.now() - started) / 1000).toFixed(0)}s`)
}

main().catch(e => { console.error(e); process.exit(1) })
