import { isLaunchReport } from './bridge-protocol'
import { forgetBridge } from './bridge-client'
import type { Host } from './host'
import { state } from './session'
import { watchBridge } from './watch'
import { word } from './words'

const INSTALL_URL = 'https://terminal-browser.sh'
const REQUIRED_CAPABILITIES = ['embedding', 'image-frames']
const CAPABILITIES_TIMEOUT_MS = 10_000
const LAUNCH_TIMEOUT_MS = 20_000

async function terminalBrowserCommand(host: Host): Promise<string[]> {
  const checkoutCli = `${host.root}/../cli/dist/main.js`
  if (await host.exists(checkoutCli)) return ['node', checkoutCli] // dev case
  return ['terminal-browser']
}

async function checkCapabilities(host: Host, command: string[]): Promise<{ ok: true } | { ok: false; installed: boolean }> {
  let result: { stdout: string; exitCode: number }
  try {
    result = await host.run([...command, 'capabilities'], { timeoutMs: CAPABILITIES_TIMEOUT_MS })
  } catch {
    return { ok: false, installed: false }
  }
  let capabilities: string[] = []
  if (result.exitCode === 0) {
    const line = result.stdout.split('\n').find((text: string) => text.startsWith('{'))
    try {
      const parsed = line ? JSON.parse(line) : null
      if (parsed && Array.isArray(parsed.capabilities)) capabilities = parsed.capabilities
    } catch (err) {
      host.log(`terminal-browser: capabilities yanıtı okunamadı: ${err}`, { to: 'debug' })
    }
  }
  const ok = REQUIRED_CAPABILITIES.every(need => capabilities.includes(need))
  return ok ? { ok: true } : { ok: false, installed: true }
}

async function launchReport(host: Host, command: string[]): Promise<unknown> {
  try {
    const { stdout, stderr, exitCode } = await host.run([...command, 'claude-bridge', 'launch'], { timeoutMs: LAUNCH_TIMEOUT_MS })
    const line = stdout.split('\n').find((text: string) => text.startsWith('{'))
    return line ? JSON.parse(line) : { error: stderr.trim() || `exit ${exitCode}`, code: 'start' }
  } catch (err) {
    return { error: String(err), code: 'start' }
  }
}

export async function startBridge(host: Host): Promise<{ ok: true } | { ok: false; error: string }> {
  const command = await terminalBrowserCommand(host)
  const check = await checkCapabilities(host, command)
  if (!check.ok) {
    return {
      ok: false,
      error: check.installed
        ? word('upgrade')
        : `${word('install')}: ${INSTALL_URL}`,
    }
  }
  const report = await launchReport(host, command)
  if (!isLaunchReport(report) || !('port' in report)) {
    const detail = isLaunchReport(report) && 'error' in report ? report.error : word('noStart')
    return { ok: false, error: `${detail}` }
  }
  state.port = report.port
  state.token = report.token
  void watchBridge(host).catch(cause => forgetBridge(cause))
  return { ok: true }
}
