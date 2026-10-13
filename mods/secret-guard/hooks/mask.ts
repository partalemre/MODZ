import { findSecrets } from './detect'

// Recording mode's masking: what the screen shows, never what the transcript keeps.

const DOTS = '●●●●'
// A value this long keeps its last two characters, so the person can still tell two keys apart.
const REVEAL_FROM = 8
const REVEAL_KEEP = 2
const PEM = /(-----BEGIN (?:[A-Z]+ )*PRIVATE KEY-----)[\s\S]*?(-----END (?:[A-Z]+ )*PRIVATE KEY-----)/g
// `NAME=value` with an upper-case name, as a shell line or an env file writes it.
const ENV_ASSIGNMENT = /(^|[\s;(`'"])((?:export\s+)?[A-Z][A-Z0-9_]+)=(["']?)([^\s"'`;)]+)\3/gm
const EMAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}/g

export function maskValue(value: string): string {
  return value.length >= REVEAL_FROM ? `${DOTS}${value.slice(-REVEAL_KEEP)}` : DOTS
}

const isMasked = (value: string): boolean => value.startsWith(DOTS) || value.startsWith('⟦')

function replaceValues(text: string, values: string[]): string {
  return [...new Set(values)]
    .filter(value => value !== '')
    .sort((a, b) => b.length - a.length)
    .reduce((out, value) => out.split(value).join(maskValue(value)), text)
}

// `known` are values this session holds behind placeholders: masked even where no detector would see them.
export function maskText(text: string, known: readonly string[] = []): string {
  if (text === '') return text
  let out = replaceValues(text, [...known])
  out = out.replace(PEM, (_, begin: string, end: string) => `${begin}${DOTS}${end}`)
  out = replaceValues(out, findSecrets(out).filter(secret => secret.kind !== 'private-key').map(secret => secret.value))
  out = out.replace(ENV_ASSIGNMENT, (whole, lead: string, name: string, quote: string, value: string) =>
    (isMasked(value) ? whole : `${lead}${name}=${quote}${maskValue(value)}${quote}`))

  return out.replace(EMAIL, maskValue)
}

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

// Every string inside plain data, masked; the same object back when nothing changed.
export function maskDeep<T>(value: T, known: readonly string[]): T {
  if (typeof value === 'string') return maskText(value, known) as T
  if (Array.isArray(value)) {
    const items = value.map(item => maskDeep(item, known))

    return (items.some((item, index) => item !== value[index]) ? items : value) as T
  }
  if (!isPlainObject(value)) return value
  const entries = Object.entries(value).map(([key, item]) => [key, maskDeep(item, known)] as const)

  return (entries.some(([key, item]) => item !== value[key]) ? Object.fromEntries(entries) : value) as T
}

// The text props each element draws besides its children.
const TEXT_PROPS: Record<string, readonly string[]> = { Markdown: ['text'], Code: ['source'], Svg: ['alt', 'source'] }

type Node = { type?: unknown; props?: Record<string, unknown>; children?: unknown[] }

function maskElement(node: Node, known: readonly string[]): Node {
  const keys = TEXT_PROPS[String(node.type)] ?? []
  const props = node.props === undefined ? undefined : { ...node.props }
  let isChanged = false
  for (const key of keys) {
    const before = props?.[key]
    if (props === undefined || typeof before !== 'string') continue
    props[key] = maskText(before, known)
    isChanged ||= props[key] !== before
  }
  const children = node.children?.map(child => maskTree(child, known))
  isChanged ||= children?.some((child, index) => child !== node.children?.[index]) ?? false
  if (!isChanged) return node

  return { ...node, ...(props === undefined ? {} : { props }), ...(children === undefined ? {} : { children }) }
}

// The tree another hook (or the engine) drew, its strings masked; an engine node is left whole: its props
// were masked on the way down.
export function maskTree<T>(node: T, known: readonly string[]): T {
  if (typeof node === 'string') return maskText(node, known) as T
  if (!isPlainObject(node) || node.type === 'engine') return node

  return maskElement(node as Node, known) as T
}
