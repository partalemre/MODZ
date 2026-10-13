import { newTalkOf } from './ci-state'
import { cardHeadSvg, checkRowSvg, ciHeadSvg } from './ci-svg'
import type { Drawing } from './ci-svg'
import { CHECK_ROLE, cardHeadline, ciLine, ciRole } from './ci-text'
import { ago } from './parse'
import { svgWidth, upper } from './svg'
import { THEME_KEY, cardColors } from './tidemark'
import type { Role, Theme } from './tidemark'
import { words } from './words'
import type { CiCard, CiCheck, CiWatch } from '../types'

// The Tests pane's CI section and the band's one-time card for a red finish, on the desktop (Svg) and the
// terminal (text in theme colors). Check links and the PR are Links: a click opens them, nothing runs here.
type Ui = Record<string, any>

export type CiView = { ci: CiWatch; now: number; columns: number; theme: Theme; isRich: boolean }
export type CardView = { card: CiCard; title: string; columns: number; theme: Theme; isRich: boolean; onAsk: () => void; onDismiss: () => void }

const WIDTH = { min: 300, max: 880 }
// Columns a "Logs" link takes beside a check row.
const ROW_WIDTH = { min: 220, max: 860, reserve: 8 }
// Columns the card's border and padding take.
const CARD_WIDTH = { min: 260, max: 1200, reserve: 8 }
const GLYPH: Record<CiCheck['state'], string> = { pending: '◐', pass: '✓', fail: '✕', skipped: '–' }

const look = (role: Role | 'lo') => (role === 'lo' ? { dimColor: true } : { color: THEME_KEY[role] })

function picture(ui: Ui, drawing: Drawing, key: string) {
  const { Svg } = ui

  return <Svg key={key} source={drawing.source} alt={drawing.alt} width={drawing.width} height={drawing.height} />
}

const logsLink = (ui: Ui, check: CiCheck, index: number) => {
  const { Link } = ui

  return check.link === null ? null : <Link key={`tb-ci-link-${index}`} href={check.link} label={words().ci.logs} />
}

function richSection(ui: Ui, view: CiView) {
  const { Box, Link } = ui
  const frame = { width: svgWidth(view.columns, WIDTH), mode: view.theme.mode }
  const rowFrame = { width: svgWidth(view.columns, ROW_WIDTH), mode: view.theme.mode }
  const { checks } = view.ci

  return (
    <Box key="tb-ci" flexDirection="column" rowGap={1}>
      {picture(ui, ciHeadSvg(frame, { watch: view.ci, now: view.now }), 'tb-ci-head')}
      {checks.length > 0 && (
        <Box key="tb-ci-checks" flexDirection="column">
          {checks.map((check, index) => (
            <Box key={`tb-ci-row-${index}`} flexDirection="row" alignItems="center" columnGap={1}>
              {picture(ui, checkRowSvg(rowFrame, { check, isFirst: index === 0, isLast: index === checks.length - 1 }), `tb-ci-svg-${index}`)}
              {logsLink(ui, check, index)}
            </Box>
          ))}
        </Box>
      )}
      <Box flexDirection="row">
        <Link key="tb-ci-pr" href={view.ci.url} label={words().ci.openPr} />
      </Box>
    </Box>
  )
}

function textSection(ui: Ui, view: CiView) {
  const { Box, Text, Link } = ui
  const { ci } = view
  const talk = newTalkOf(ci)
  const summary = [ciLine(ci) || words().ci.noChecks, talk > 0 ? words().ci.newTalk(talk) : ''].filter(part => part !== '').join(' · ')

  return (
    <Box key="tb-ci" flexDirection="column">
      <Box flexDirection="row" justifyContent="space-between" columnGap={1}>
        <Text bold {...look(ciRole(ci))}>{`${ci.phase === 'watching' ? '◐' : '●'} ${upper(words().ci.eyebrow)} · #${ci.number}`}</Text>
        <Text dimColor>{ci.checkedAt === null ? '' : ago(view.now - ci.checkedAt)}</Text>
      </Box>
      <Text bold wrap="truncate">{ci.title}</Text>
      <Text dimColor wrap="truncate">{summary}</Text>
      {ci.checks.map((check, index) => (
        <Box key={`tb-ci-row-${index}`} flexDirection="row" columnGap={1} paddingLeft={2}>
          <Text {...look(CHECK_ROLE[check.state])}>{GLYPH[check.state]}</Text>
          <Box flexShrink={1}>
            <Text wrap="truncate" dimColor={check.state === 'skipped'}>{check.name}</Text>
          </Box>
          <Text dimColor>{words().ci.states[check.state]}</Text>
          {logsLink(ui, check, index)}
        </Box>
      ))}
      <Box flexDirection="row">
        <Link key="tb-ci-pr" href={ci.url} label={words().ci.openPr} />
      </Box>
    </Box>
  )
}

// The CI section closes the Tests pane on both surfaces, below the local checks it does not replace.
export function ciPart(ui: Ui, view: Omit<CiView, 'ci'> & { ci: CiWatch | null }) {
  const { ci } = view
  if (ci === null) return null

  return view.isRich ? richSection(ui, { ...view, ci }) : textSection(ui, { ...view, ci })
}

// Ask Claude to fix (the suggested way), Open PR (a link), Dismiss last.
function cardActions(ui: Ui, view: CardView) {
  const { Box, Button, Link } = ui

  return (
    <Box key="tb-ci-actions" flexDirection="row" columnGap={2} alignItems="center" flexWrap="wrap">
      <Button key="tb-ci-ask" variant="primary" hotkey="f" label={words().ci.askFix} onPress={view.onAsk} />
      <Link key="tb-ci-open" href={view.card.url} label={words().ci.openPr} />
      <Box flexGrow={1} />
      <Button key="tb-ci-dismiss" plain label={words().ci.dismiss} onPress={view.onDismiss} />
    </Box>
  )
}

export function ciCardTree(ui: Ui, view: CardView, theirs: unknown) {
  const { Box, Text } = ui
  const colors = cardColors(view.theme, 'flare')
  const frame = { width: svgWidth(view.columns, CARD_WIDTH), mode: view.theme.mode }
  const head = view.isRich ? picture(ui, cardHeadSvg(frame, { card: view.card, title: view.title }), 'tb-ci-card-head') : (
    <Box key="tb-ci-card-head" flexDirection="row" columnGap={1}>
      <Text color={THEME_KEY.flare} bold>{`✕ ${upper(words().ci.eyebrow)} · #${view.card.number}`}</Text>
      <Text bold wrap="truncate">{cardHeadline(view.card)}</Text>
    </Box>
  )
  const frameProps = view.isRich ? { borderColor: colors?.line, backgroundColor: colors?.card, paddingX: 2, paddingY: 1 } : { borderDimColor: true, paddingX: 1 }

  return (
    <Box flexDirection="column">
      <Box key="tb-ci-card" flexDirection="column" borderStyle="round" gap={1} {...frameProps}>
        {head}
        {cardActions(ui, view)}
      </Box>
      {theirs}
    </Box>
  )
}
