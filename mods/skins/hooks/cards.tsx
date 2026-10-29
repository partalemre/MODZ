import type { Look, SvgElement } from './look'
import type { Code, Segment, Table } from './markdown'
import { copyButton, copyRow, tableMarkdown, tableRows } from './row-table'
import { codeSvg } from './svg-code'
import { diffSvg } from './svg-diff'
import type { DiffInput } from './svg-diff'
import { cardWidth } from './svg-kit'
import { tableSvg } from './svg-table'
import { say } from './words'
import { terminalSvg } from './svg-terminal'
import type { ShellOutput } from './svg-terminal'

type Built = { source: string; alt: string }

type Copyable = { Svg: SvgElement; built: Built; key: string; text: string }

// A card drawn as an image, with its Copy button laid over the top-right corner the card
// left free. The image cannot be pressed, so the button is a real one on top of it; the
// box hugs the image so the corner is the card's, not the column's. The image takes the
// markup's own size, so one drawn wider than the reply column is scaled down to fit it.
function cardWithCopy(look: Look, { Svg, built, key, text }: Copyable) {
  const { Box, Button } = look.ui
  const copy = look.copy

  return (
    <Box marginY={1} alignSelf="flex-start">
      <Svg source={built.source} alt={built.alt} />
      {copy === undefined ? (
        ''
      ) : (
        <Box position="absolute" top={1} right={3}>
          <Button key={key} label={say().copy} plain dimColor onPress={() => copy(text)} />
        </Box>
      )}
    </Box>
  )
}

type Placed = { Svg: SvgElement; columns: number; key: string }

function tableCard(look: Look, table: Table, { Svg, columns, key }: Placed) {
  const card = tableSvg(table, { palette: look.skin.palette, width: cardWidth(columns), hasControl: look.copy !== undefined })

  return cardWithCopy(look, { Svg, built: card, key, text: tableMarkdown(table) })
}

// A vector card in a reply or under a tool row, a line's breath above and below it.
function card(look: Look, Svg: SvgElement, built: { source: string; alt: string }) {
  const { Box } = look.ui

  return (
    <Box marginY={1}>
      <Svg source={built.source} alt={built.alt} />
    </Box>
  )
}

export type CodeCard = { lang: string; code: string; Svg: SvgElement; columns: number; key?: string }

export function codeCard(look: Look, { lang, code, Svg, columns, key = 'copy-code' }: CodeCard) {
  const built = codeSvg(code, lang, { palette: look.skin.palette, width: cardWidth(columns), hasControl: look.copy !== undefined })

  return cardWithCopy(look, { Svg, built, key, text: code })
}

export type DiffCard = { Svg: SvgElement; input: DiffInput; shownPath: string; columns: number }

export function diffCard(look: Look, { Svg, input, shownPath, columns }: DiffCard) {
  return card(look, Svg, diffSvg(input, shownPath, { palette: look.skin.palette, width: cardWidth(columns) }))
}

export type TerminalCard = { Svg: SvgElement; output: ShellOutput; isErrored: boolean; columns: number }

export function terminalCard(look: Look, { Svg, output, isErrored, columns }: TerminalCard) {
  const text = [output.stdout, output.stderr].filter(part => part.trim() !== '').join('\n')
  const withCopy = text === '' ? { ...look, copy: undefined } : look
  const built = terminalSvg(output, isErrored, { palette: look.skin.palette, width: cardWidth(columns), hasControl: withCopy.copy !== undefined })

  return cardWithCopy(withCopy, { Svg, built, key: 'copy-output', text })
}

function codeSegment(look: Look, segment: Code, { Svg, maxWidth, key }: { Svg?: SvgElement; maxWidth: number; key: string }) {
  const { Box, Markdown } = look.ui

  return Svg === undefined ? (
    <Box flexDirection="column">
      <Markdown text={segment.raw} />
      {copyRow(look, key, segment.code)}
    </Box>
  ) : (
    codeCard(look, { lang: segment.lang, code: segment.code, Svg, columns: maxWidth, key })
  )
}

export type Reply = { segments: readonly Segment[]; maxWidth: number; Svg?: SvgElement }

export function replyRows(look: Look, { segments, maxWidth, Svg }: Reply) {
  const { Box, Markdown } = look.ui

  return (
    <Box flexDirection="column">
      {segments.map((segment, i) => {
        if (segment.kind === 'text') {
          return <Markdown text={segment.text} />
        }

        if (segment.kind === 'code') {
          return codeSegment(look, segment, { Svg, maxWidth, key: `copy-${i}` })
        }

        return Svg === undefined ? (
          tableRows(look, segment, { maxWidth, control: copyButton(look, `copy-${i}`, tableMarkdown(segment)) })
        ) : (
          tableCard(look, segment, { Svg, columns: maxWidth, key: `copy-${i}` })
        )
      })}
    </Box>
  )
}
