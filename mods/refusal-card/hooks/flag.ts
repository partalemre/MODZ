// What the card knows of a flagged turn, and the /feedback line it offers. Pure: no `$`.

export type Flag = { request: string; category: string | null; explanation: string | null }

// How much of the request the card and the report quote: enough to recognise it, short enough for one line.
const QUOTE_CHARS = 240

/** The request on one line, cut at QUOTE_CHARS with an ellipsis. */
export function excerpt(text: string): string {
  const line = text.replace(/\s+/g, ' ').trim()

  return line.length > QUOTE_CHARS ? `${line.slice(0, QUOTE_CHARS - 1)}…` : line
}

/** The report the button puts in the prompt box: `/feedback` first, so Enter opens Claude Code's own form. */
export function feedbackLine(flag: Flag): string {
  const quoted = excerpt(flag.request)
  const parts = [
    '/feedback False positive: the safeguards flagged a normal request and the turn stopped.',
    quoted === '' ? '' : `Request: "${quoted}"`,
    flag.category === null ? '' : `Category: ${flag.category}.`,
  ]

  return parts.filter(part => part !== '').join(' ')
}
