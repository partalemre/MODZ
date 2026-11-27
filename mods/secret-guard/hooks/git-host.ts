import type { EngineInterface } from 'claude-code'

import type { GitHost } from './git'

const FILE_MAX_BYTES = 1_000_000

async function scanFile($: EngineInterface, path: string): Promise<string> {
  try {
    const stat = await $.fs.stat(path)
    if (stat.kind !== 'file' || stat.size > FILE_MAX_BYTES) return ''

    return await $.fs.read(path)
  } catch {
    return ''
  }
}

// What a git scan reaches the repository through, from `cwd`: git's output (empty when it fails) and the files.
// Output cut at the engine's cap could hide a key past the cut, so it throws: the guard then refuses the call.
export function gitHost($: EngineInterface, cwd: string): GitHost {
  const git = async (argv: string[], dir: string) => {
    const ran = await $.process.run(['git', ...argv], { cwd: dir })
    if (ran.isStdoutTruncated) throw new Error(`git ${argv[0] ?? ''} printed more than secret-guard can read`)

    return ran.exitCode === 0 ? ran.stdout : ''
  }

  return { cwd, git, read: path => scanFile($, path) }
}
