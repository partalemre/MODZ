import type { Host } from './host'
import { openCommand } from './open'
import { words } from './words'

export type Os = 'linux' | 'darwin' | 'win32'

const UNAME_MS = 3_000
const APPEARANCE_MS = 2_000
const FONT_MS = 5_000
const VERSION_MS = 3_000
// The herdr version (major·1e6 + minor·1e3 + patch) from which fine pointer events reach the pane.
const HERDR_POINTER = 9_001
const MAJOR = 1e6
const MINOR = 1e3
const FONT_SCRIPT =
  'if command -v fc-list >/dev/null 2>&1; then f=$(fc-list ":charset=$1" file | head -n1 | cut -d: -f1); ' +
  'else f=$(ls "$HOME"/Library/Fonts/*Nerd* /Library/Fonts/*Nerd* 2>/dev/null | head -n1); fi; ' +
  '[ -n "$f" ] || { echo missing; exit 0; }; m=$(stat -c %Z "$f" 2>/dev/null || stat -f %c "$f"); p=$PPID; ' +
  'while [ -n "$p" ] && [ "$p" -gt 1 ]; do c=$(ps -o comm= -p "$p" 2>/dev/null); c=$(basename "$c" 2>/dev/null | tr -d " "); case "$c" in ' +
  'ghostty|kitty|alacritty|Alacritty|foot|footclient|wezterm-gui|konsole|gnome-terminal-|xterm|urxvt|st|Terminal|iTerm2) ' +
  'e=$(ps -o etime= -p "$p" 2>/dev/null | awk -F\'[-:]\' \'{n=NF; s=$n+60*$(n-1); if (n>2) s+=3600*$(n-2); if (n>3) s+=86400*$(n-3); print s}\'); [ -n "$e" ] && [ $(( $(date +%s) - e )) -lt "$m" ] && echo stale || echo ok; exit 0;; esac; ' +
  'p=$(ps -o ppid= -p "$p" 2>/dev/null | tr -d " "); done; echo ok'

let platform: Promise<Os> | null = null

export function osName(h: Host): Promise<Os> {
  platform ??= (async () => {
    if ((await h.osEnv()) === 'Windows_NT') return 'win32'
    try {
      return (await h.run(['uname', '-s'], { timeoutMs: UNAME_MS })).stdout.trim() === 'Darwin' ? 'darwin' : 'linux'
    } catch {
      return 'linux'
    }
  })()
  return platform
}

async function macDark(h: Host): Promise<boolean | undefined> {
  const mac = await h.run(['defaults', 'read', '-g', 'AppleInterfaceStyle'], { timeoutMs: APPEARANCE_MS })
  if (mac.exitCode === 0) return mac.stdout.trim() === 'Dark'
  return /does not exist/.test(mac.stderr) ? false : undefined
}

export async function systemDark(h: Host): Promise<boolean | undefined> {
  const os = await osName(h)
  try {
    if (os === 'darwin') return await macDark(h)
    if (os !== 'linux') return undefined
    const gnome = await h.run(['gsettings', 'get', 'org.gnome.desktop.interface', 'color-scheme'], { timeoutMs: APPEARANCE_MS })
    return gnome.exitCode === 0 ? gnome.stdout.includes('dark') : undefined
  } catch {
    return undefined
  }
}

export async function fontState(h: Host, charset: string): Promise<'ok' | 'stale' | 'missing'> {
  try {
    const out = (await h.run(['sh', '-c', FONT_SCRIPT, 'sh', charset], { timeoutMs: FONT_MS })).stdout.trim()
    return out === 'stale' || out === 'missing' ? out : 'ok'
  } catch {
    return 'missing'
  }
}

export async function finePointerOk(h: Host): Promise<boolean> {
  if (!(await h.herdrEnv())) return true
  try {
    const out = (await h.run([(await h.herdrBin()) || 'herdr', '--version'], { timeoutMs: VERSION_MS })).stdout
    const [major = 0, minor = 0, fix = 0] = (/(\d+)\.(\d+)\.(\d+)/.exec(out) ?? []).slice(1).map(Number)
    return major * MAJOR + minor * MINOR + fix >= HERDR_POINTER
  } catch {
    return false
  }
}

export async function openFile(h: Host, path: string): Promise<void> {
  const { argv, init } = openCommand(await osName(h), path)
  try {
    const run = await h.run(argv, init)
    if (run.exitCode !== 0) h.toast(`${words().notOpened(path, argv[0] ?? '')}: ${run.stderr.trim().split('\n')[0] || words().exitCode(run.exitCode)}`)
  } catch {
    h.toast(words().notOpened(path, argv[0] ?? ''))
  }
}
