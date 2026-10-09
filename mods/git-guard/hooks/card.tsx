import type { GuardPending } from '../types'

export type CardSpec = GuardPending & { width: number; theme: 'light' | 'dark' | 'auto'; surface: string }

// The resolved element table of the surface that draws the dialog.
export type Ui = Record<string, any>

const RED = '#f87171'
const AMBER = '#fbbf24'
const MUTED = '#94a3b8'
const MONO_PIXELS = 7.3
const CHIP_PIXELS = 7
const CHIP_PAD = 20
const CHIP_GAP = 8
const PAD = 20
const MIN_WIDTH = 320
const MAX_LINES = 3
const COMMAND_MAX_TERMINAL = 100
const TITLE_HEIGHT = 40
const CHIP_ROW = 30
const LINE_HEIGHT = 17
const FOOTER_HEIGHT = 22

function esc(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function wrapCommand(command: string, perLine: number): string[] {
  const lines: string[] = []
  let rest = command.replace(/\s+/g, ' ').trim()
  while (rest.length > 0 && lines.length < MAX_LINES) {
    const space = rest.length > perLine ? rest.lastIndexOf(' ', perLine) : -1
    const cut = space > 0 ? space : perLine
    lines.push(rest.slice(0, cut))
    rest = rest.slice(cut).trimStart()
  }
  if (rest.length > 0) lines[lines.length - 1] = `${lines[lines.length - 1].slice(0, perLine - 1)}…`

  return lines
}

function chipsBlock(risks: string[], y: number): string {
  let x = PAD
  return risks
    .map(risk => {
      const label = risk.toUpperCase()
      const width = label.length * CHIP_PIXELS + CHIP_PAD
      const chip = `<rect x="${x}" y="${y}" width="${width}" height="20" rx="10" fill="${RED}" fill-opacity=".14" stroke="${RED}" stroke-opacity=".5"/><text class="chip" x="${x + width / 2}" y="${y + 14}" text-anchor="middle">${esc(label)}</text>`
      x += width + CHIP_GAP

      return chip
    })
    .join('')
}

export function cardSvg(spec: CardSpec): { source: string; alt: string; height: number } {
  const width = Math.max(MIN_WIDTH, spec.width)
  const perLine = Math.floor((width - PAD * 2 - 24) / MONO_PIXELS)
  const lines = wrapCommand(spec.command, perLine)
  const codeHeight = lines.length * LINE_HEIGHT + 14
  const footer = spec.branch === null ? 0 : FOOTER_HEIGHT
  const height = TITLE_HEIGHT + CHIP_ROW + codeHeight + footer + 14
  const codeY = TITLE_HEIGHT + CHIP_ROW
  const code = lines
    .map((line, index) => `<text class="mono" x="${PAD + 12}" y="${codeY + 20 + index * LINE_HEIGHT}">${index === 0 ? '<tspan class="dim">$ </tspan>' : '<tspan class="dim">  </tspan>'}${esc(line)}</text>`)
    .join('')
  const branch =
    spec.branch === null
      ? ''
      : `<text class="dim11" x="${PAD}" y="${codeY + codeHeight + 18}">on branch <tspan class="strong">${esc(spec.branch)}</tspan></text>`
  const source = `<svg xmlns="http://www.w3.org/2000/svg" class="t-${spec.theme}" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><style>
svg{--bg:rgba(248,113,113,.07);--line:rgba(220,38,38,.45);--code:rgba(15,23,42,.06);--muted:#64748b;--strong:#0f172a;--chip:#b91c1c}
svg.t-dark{--bg:rgba(248,113,113,.09);--line:rgba(248,113,113,.5);--code:rgba(0,0,0,.28);--muted:#94a3b8;--strong:#e2e8f0;--chip:#fca5a5}
@media (prefers-color-scheme: dark){svg.t-auto{--bg:rgba(248,113,113,.09);--line:rgba(248,113,113,.5);--code:rgba(0,0,0,.28);--muted:#94a3b8;--strong:#e2e8f0;--chip:#fca5a5}}
text{font-family:ui-sans-serif,system-ui,-apple-system,"SF Pro Text","Segoe UI",sans-serif}
.title{font-size:13px;font-weight:700;fill:var(--strong);letter-spacing:.02em}
.tag{font-size:10px;font-weight:650;letter-spacing:.1em;fill:var(--muted)}
.chip{font-size:10.5px;font-weight:700;letter-spacing:.07em;fill:var(--chip)}
.mono{font-family:ui-monospace,"SF Mono",Menlo,Consolas,monospace;font-size:12px;fill:var(--strong)}
.dim{fill:var(--muted)}
.dim11{font-size:11px;fill:var(--muted)}
.strong{fill:var(--strong);font-weight:650}
</style>
<rect x=".5" y=".5" width="${width - 1}" height="${height - 1}" rx="10" fill="var(--bg)" stroke="var(--line)"/>
<rect x="0" y="12" width="3.5" height="${height - 24}" rx="1.75" fill="${RED}"/>
<g fill="none" stroke="${RED}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M${PAD + 7} 11 L${PAD + 15} 26 H${PAD - 1} Z"><animate attributeName="stroke-opacity" values="1;.35;1" dur="1.8s" repeatCount="indefinite"/></path><path d="M${PAD + 7} 17.5 V21"/><path d="M${PAD + 7} 23.2 V23.4"/></g>
<text class="title" x="${PAD + 28}" y="24">Risky command</text>
<text class="tag" x="${width - PAD}" y="24" text-anchor="end">GIT-GUARD</text>
${chipsBlock(spec.risks, TITLE_HEIGHT - 6)}
<rect x="${PAD - 4}" y="${codeY}" width="${width - PAD * 2 + 8}" height="${codeHeight}" rx="6" fill="var(--code)"/>
${code}${branch}</svg>`

  return { source, alt: `Risky command: ${spec.risks.join(', ')}. ${spec.command}`, height }
}

export function cardTree(ui: Ui, spec: CardSpec) {
  const { Box, Text, Svg } = ui
  if (spec.surface === 'desktop') {
    const drawing = cardSvg(spec)

    return <Svg source={drawing.source} alt={drawing.alt} width={Math.max(MIN_WIDTH, spec.width)} height={drawing.height} />
  }
  const command = spec.command.length > COMMAND_MAX_TERMINAL ? `${spec.command.slice(0, COMMAND_MAX_TERMINAL - 1)}…` : spec.command

  return (
    <Box flexDirection="column" borderStyle="round" borderColor={RED} paddingX={1}>
      <Box flexDirection="row" columnGap={1}>
        <Text bold color={RED}>⚠ RISKY COMMAND</Text>
        {spec.risks.map(risk => (
          <Text backgroundColor={RED} color="#1b1d23">{` ${risk} `}</Text>
        ))}
      </Box>
      <Text color={AMBER} wrap="truncate">{`$ ${command}`}</Text>
      {spec.branch !== null && <Text color={MUTED}>{`on branch ${spec.branch}`}</Text>}
    </Box>
  )
}
