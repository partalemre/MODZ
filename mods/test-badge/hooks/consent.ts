import { words } from './words'

// Before the first automatic run in a folder, the person is asked once, shown the exact commands; the answer is
// kept per folder and command, so a changed command asks again. A press or /test-badge run is their own ask.

// The engine's store, dialog and debug log, as closures: only runs.ts holds `$`.
export type ConsentIo = {
  get: () => Promise<unknown>
  set: (value: Record<string, boolean>) => Promise<void>
  ask: (question: string, options: { options: string[]; header: string }) => Promise<string>
  log: (line: string) => void
}

// A question dismissed (or a session with no one to ask) runs nothing and is not put again this session.
const dismissed = new Set<string>()

type Asked = { root: string; commands: string[][] }

const commandText = (argv: string[]): string => argv.join(' ')

export async function isAllowed(io: ConsentIo, asked: Asked): Promise<boolean> {
  const key = `${asked.root}\n${asked.commands.map(commandText).join('\n')}`
  const saved = await io.get()
  const answers = typeof saved === 'object' && saved !== null ? (saved as Record<string, boolean>) : {}
  if (typeof answers[key] === 'boolean') return answers[key]
  if (dismissed.has(key)) return false
  const says = words().consent
  let answer: string
  try {
    answer = await io.ask(says.question(asked.commands.map(commandText), asked.root), { options: [says.yes, says.no], header: says.header })
  } catch (error) {
    dismissed.add(key)
    io.log(`test-badge: the run question went unanswered (${String(error)})`)

    return false
  }
  const isYes = answer === says.yes
  await io.set({ ...answers, [key]: isYes })

  return isYes
}
