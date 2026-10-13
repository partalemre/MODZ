import { maskDeep } from './mask'

// Recording mode: while on, the transcript's rows draw with secrets, env values and e-mail addresses masked.
// Display only: the stored rows and what the model reads stay as they were.

// The rows recording mode masks, and the props each draws its text from (rewritable ones only: a
// UserMessage's `origin` and `from` are read-only).
const SITES: Readonly<Record<string, readonly string[]>> = {
  UserMessage: ['text'],
  AssistantMessage: ['text'],
  ToolUse: ['input', 'output'],
  ToolResult: ['output'],
}

// The site's props with their text masked; the same object back when nothing changed.
export function maskedProps<P extends object>(component: string, props: P, known: readonly string[]): P {
  let out: Record<string, unknown> = props as Record<string, unknown>
  for (const key of SITES[component] ?? []) {
    if (!(key in props)) continue
    const before = (props as Record<string, unknown>)[key]
    const masked = maskDeep(before, known)
    if (masked !== before) out = { ...out, [key]: masked }
  }

  return out as P
}
