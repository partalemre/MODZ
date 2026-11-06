// scan.ts's AWK in plain TypeScript, for a system with no awk (a stock Windows): one transcript's text to the same
// rows, so parseOutput treats both alike. It must stay a line-for-line twin of AWK, its string matching included.
// shortcut: the whole file is read into memory, unlike awk; stream it if the engine's read ever takes a range.

const USAGE = '"usage":{"input_tokens":'
const MODEL = /"model":"([^"]*)","id":"(msg_[A-Za-z0-9]+)"/
const COUNTS = /"usage":\{"input_tokens":(\d+),"cache_creation_input_tokens":(\d+),"cache_read_input_tokens":(\d+),"output_tokens":(\d+)/
const CWD = /"cwd":"([^"]*)"/
const CUSTOM_TITLE = /"customTitle":"([^"]*)"/
const AI_TITLE = /"aiTitle":"([^"]*)"/
const STAMP = '"timestamp":"'
const STAMP_LENGTH = 24

type Reply = { model: string; counts: [number, number, number, number] }

const grab = (line: string, pattern: RegExp): string => pattern.exec(line)?.[1] ?? ''

function replyOf(line: string): { id: string; reply: Reply } | null {
  const at = line.indexOf(USAGE)
  if (at < 0) return null
  const named = MODEL.exec(line)
  const counts = COUNTS.exec(line.slice(at))
  if (named === null || counts === null) return null

  return { id: named[2] ?? '', reply: { model: named[1] ?? '', counts: [Number(counts[1]), Number(counts[2]), Number(counts[3]), Number(counts[4])] } }
}

// One U row per model: a reply is written once per content block with the same id, so an id counts once, at its last.
function usageRows(path: string, replies: ReadonlyMap<string, Reply>): string[] {
  const models = new Map<string, number[]>()
  for (const { model, counts } of replies.values()) {
    const sum = models.get(model) ?? [0, 0, 0, 0, 0]
    counts.forEach((count, index) => { sum[index] = (sum[index] ?? 0) + count })
    sum[4] = (sum[4] ?? 0) + 1
    models.set(model, sum)
  }

  return [...models].map(([model, sum]) => ['U', path, model, ...sum].join('\t'))
}

export function plainRows(path: string, text: string): string {
  if (text === '') return ''
  const replies = new Map<string, Reply>()
  const fact = { cwd: '', title: '', first: '', last: '', tools: 0 }
  for (const line of text.split('\n')) {
    if (fact.cwd === '' && line.includes('"cwd":"')) fact.cwd = grab(line, CWD)
    const stamp = line.indexOf(STAMP)
    if (stamp >= 0) {
      const at = line.slice(stamp + STAMP.length, stamp + STAMP.length + STAMP_LENGTH)
      if (fact.first === '') fact.first = at
      fact.last = at
    }
    if (line.includes('"type":"custom-title"')) fact.title = grab(line, CUSTOM_TITLE)
    else if (fact.title === '' && line.includes('"type":"ai-title"')) fact.title = grab(line, AI_TITLE)
    if (!line.includes('"type":"assistant"')) continue
    if (line.includes('"type":"tool_use"')) fact.tools += 1
    const found = replyOf(line)
    if (found !== null) replies.set(found.id, found.reply)
  }

  return [['F', path, fact.cwd, fact.title, fact.first, fact.last, fact.tools].join('\t'), ...usageRows(path, replies)].join('\n') + '\n'
}
