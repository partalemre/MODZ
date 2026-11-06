import type { Failure } from '../types'

export type OpenTarget = { path: string; line: number | null }

export function pathOf(failure: Failure, root: string): string | null {
  if (failure.file === null) return null

  return /^([A-Za-z]:)?\//.test(failure.file) ? failure.file : `${root}/${failure.file}`
}

export function placeOf(failure: Failure): string {
  return failure.line === null ? (failure.file ?? '') : `${failure.file}:${failure.line}`
}

// The commands tried in order: the configured one alone, else VS Code at the line, then the OS opener.
export function openCandidates(template: string, target: OpenTarget, isWindows = false): string[][] {
  const line = String(target.line ?? 1)
  if (template.trim() !== '') return [template.trim().split(/\s+/).map(arg => arg.replace('{file}', target.path).replace('{line}', line))]

  // VS Code is a .cmd script there, so only cmd starts it; a path from test output that cmd would read as more
  // commands is not handed to it, and the caller copies the place instead.
  if (isWindows) return /[&|<>^"%]/.test(target.path) ? [] : [['cmd', '/c', 'code', '-g', `${target.path}:${line}`], ['cmd', '/c', 'start', '', target.path]]

  return [['code', '-g', `${target.path}:${line}`], ['open', target.path], ['xdg-open', target.path]]
}
