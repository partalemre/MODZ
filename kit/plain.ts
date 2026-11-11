// MODZ kit — the plain-language layer: any tool call said in one sentence that someone who has never coded
// follows ("Dosyaların içinde “login” arıyor"), worked out from the call's own name and input by rules. No model
// is asked and nothing is run, so it costs no tokens and can be drawn on every row. The language is passed in.
import type { Lang } from './lang'
import { plainShell } from './plain-shell'
import { fill, textOf } from './plain-words'
import type { Entry } from './plain-words'

const NAME_MAX = 48

type Fields = Readonly<Record<string, unknown>>
// Which input field `{x}` names, and whether it is a path (its file name is kept) or an address (its host).
type Tool = readonly [entry: Entry, field?: string, as?: 'file' | 'host']

const EDIT: Tool = [['Changing the file {x}', '{x} dosyasını değiştiriyor'], 'file_path', 'file']
const TASKS: Tool = [['Updating its to-do list', 'Yapılacaklar listesini güncelliyor']]
const HELPER: Tool = [['Handing a job to a helper agent[: {x}]', 'Bir yardımcı ajana iş veriyor[: {x}]'], 'description']
const BACKGROUND: Tool = [['Checking on a command running in the background', 'Arka planda çalışan komutun durumuna bakıyor']]
const STOP: Tool = [['Stopping a command running in the background', 'Arka planda çalışan komutu durduruyor']]
const TIMER: Tool = [['Setting up work to run later', 'Daha sonra çalışacak bir iş ayarlıyor']]

const TOOLS: Readonly<Record<string, Tool>> = {
  Read: [['Reading the file {x}', '{x} dosyasını okuyor'], 'file_path', 'file'],
  Write: [['Writing the file {x}', '{x} dosyasını yazıyor'], 'file_path', 'file'],
  Edit: EDIT, MultiEdit: EDIT,
  NotebookEdit: [['Changing the notebook {x}', '{x} not defterini değiştiriyor'], 'notebook_path', 'file'],
  Glob: [['Looking for files named like “{x}”', 'Adı “{x}” kalıbına uyan dosyaları arıyor'], 'pattern'],
  Grep: [['Searching inside files for “{x}”', 'Dosyaların içinde “{x}” arıyor'], 'pattern'],
  LS: [['Listing the files in a folder', 'Bir klasördeki dosyaları listeliyor']],
  WebSearch: [['Searching the web for “{x}”', 'İnternette “{x}” arıyor'], 'query'],
  WebFetch: [['Reading a web page[: {x}]', 'Bir internet sayfasını okuyor[: {x}]'], 'url', 'host'],
  Agent: HELPER, Task: HELPER,
  SendMessage: [['Sending a message to another agent', 'Başka bir ajana mesaj gönderiyor']],
  TodoWrite: TASKS, TaskCreate: TASKS, TaskUpdate: TASKS, TaskList: TASKS, TaskGet: TASKS, update_plan: TASKS,
  Skill: [['Loading a ready-made set of instructions[: {x}]', 'Hazır bir talimat paketini (skill) yüklüyor[: {x}]'], 'skill'],
  ToolSearch: [['Looking for the right tool for the job', 'İş için gereken aracı arıyor']],
  AskUserQuestion: [['Asking you a question', 'Sana bir soru soruyor']],
  EnterPlanMode: [['Starting to write a plan before it acts', 'İşe başlamadan önce plan yazmaya geçiyor']],
  ExitPlanMode: [['Showing you its plan for approval', 'Hazırladığı planı onayına sunuyor']],
  BashOutput: BACKGROUND, TaskOutput: BACKGROUND, Monitor: BACKGROUND,
  KillShell: STOP, TaskStop: STOP,
  Artifact: [['Publishing a page you can open', 'Açabileceğin bir sayfa yayımlıyor']],
  ScheduleWakeup: TIMER, CronCreate: TIMER,
  EnterWorktree: [['Making a separate copy of the project to work in', 'Çalışmak için projenin ayrı bir kopyasını açıyor']],
}

const BROWSER: Entry = ['Using the browser', 'Tarayıcıyı kullanıyor']
// Connected services (MCP servers) by a word in their name; the first that fits wins.
const SERVERS: ReadonlyArray<readonly [RegExp, Entry]> = [
  [/browser|chrome|playwright/i, BROWSER],
  [/computer/i, ['Using the mouse and keyboard on this computer', 'Bu bilgisayarda fareyi ve klavyeyi kullanıyor']],
  [/github/i, ['Working on GitHub', 'GitHub üzerinde çalışıyor']],
  [/context7/i, ['Reading a library’s up-to-date manual', 'Bir kütüphanenin güncel kılavuzunu okuyor']],
  [/\brea\b/i, ['Taking an app apart to see how it works', 'Bir uygulamanın içini açıp nasıl çalıştığına bakıyor']],
  [/simulator/i, ['Using the iPhone simulator', 'iPhone simülatörünü kullanıyor']],
  [/terminal/i, ['Looking at your terminal', 'Terminaline bakıyor']],
  [/ccd_|savvy|modz|skins|transceiver/i, ['Updating what the app shows you', 'Uygulamanın sana gösterdiklerini güncelliyor']],
]

// What a browser call does, by a word in the tool's name.
const BROWSER_ACTS: ReadonlyArray<readonly [RegExp, Entry]> = [
  [/navigate|open_url|preview_start/, ['Opening a page in the browser', 'Tarayıcıda bir sayfa açıyor']],
  [/screenshot/, ['Taking a picture of the page', 'Sayfanın görüntüsünü alıyor']],
  [/read_page|get_page|page_text|snapshot|find/, ['Reading the page in the browser', 'Tarayıcıdaki sayfayı okuyor']],
  [/click|press|hover|drag/, ['Clicking on the page', 'Sayfada bir yere tıklıyor']],
  [/type|fill|form_input|select/, ['Typing into the page', 'Sayfaya yazı yazıyor']],
  [/console|network|javascript|evaluate/, ['Checking how the page runs', 'Sayfanın nasıl çalıştığını denetliyor']],
]

const OTHER = {
  service: ['Using the connected “{x}” service', 'Bağlı “{x}” servisini kullanıyor'],
  tool: ['Using the “{x}” tool', '“{x}” aracını kullanıyor'],
  command: ['Running a terminal command', 'Bir terminal komutu çalıştırıyor'],
} as const satisfies Record<string, Entry>

const fieldsOf = (input: unknown): Fields => (typeof input === 'object' && input !== null ? (input as Fields) : {})
const clip = (text: string): string => (text.length > NAME_MAX ? `${text.slice(0, NAME_MAX - 1)}…` : text)
const firstLine = (text: string): string => text.split('\n')[0]?.trim() ?? ''

function namedOf(value: unknown, as: Tool[2]): string {
  const text = typeof value === 'string' ? firstLine(value) : ''
  if (as === 'file') return text.split('/').filter(Boolean).at(-1) ?? ''
  if (as === 'host') return /^[a-z]+:\/\/([^/?#]+)/i.exec(text)?.[1] ?? ''

  return clip(text)
}

// `mcp__github__search_code` is the server `github` and the tool `search_code`.
function serviceSay(tool: string, lang: Lang): string {
  const [, server = '', ...rest] = tool.split('__')
  const name = rest.join(' ')
  const known = SERVERS.find(([pattern]) => pattern.test(server))?.[1]
  if (known === BROWSER) return textOf(BROWSER_ACTS.find(([pattern]) => pattern.test(name))?.[1] ?? BROWSER, lang)
  if (known !== undefined) return textOf(known, lang)
  // A server named by an id says nothing; its tool's own name says more.
  const isId = /^[0-9a-f-]{20,}$/i.test(server)

  return fill(textOf(isId ? OTHER.tool : OTHER.service, lang), clip((isId ? name : server).replace(/[_-]+/g, ' ')))
}

/**
 * A tool call in one plain sentence, in `lang`.
 *
 * @example plainCall('Bash', { command: 'git checkout -b fix/x' }, 'tr') // "Yeni bir çalışma dalı (branch) açıyor: fix/x"
 */
export function plainCall(tool: string, input: unknown, lang: Lang): string {
  const fields = fieldsOf(input)
  if (tool === 'Bash' || tool === 'PowerShell') {
    const command = typeof fields.command === 'string' ? fields.command : ''

    return command.trim() === '' ? textOf(OTHER.command, lang) : plainShell(command, lang)
  }
  if (tool.startsWith('mcp__')) return serviceSay(tool, lang)
  const known = TOOLS[tool]
  if (known === undefined) return fill(textOf(OTHER.tool, lang), clip(tool))
  const [entry, field, as] = known
  const named = field === undefined ? '' : namedOf(fields[field], as)
  // A sentence built around a name it does not have would read broken: the tool's own name stands in.
  const template = textOf(entry, lang)

  return named === '' && /(^|[^[])\{x\}/.test(template.replace(/\[[^\]]*\]/g, '')) ? fill(textOf(OTHER.tool, lang), tool) : fill(template, named)
}

export { plainShell } from './plain-shell'
