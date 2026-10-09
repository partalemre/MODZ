import type { Skin } from '../skin'

// The MODZ design language's role colours (DESIGN.md §2), on dark and on light.
const skin: Skin = {
  name: 'tidemark',
  label: 'Tidemark',
  palette: {
    read: '#7fb6e8',
    write: '#e58a5f',
    run: '#b19cf3',
    search: '#7fb6e8',
    web: '#e07bc0',
    mcp: '#6fc593',
    other: '#c2beb4',
    user: '#e58a5f',
    fg: '#f0eee8',
    muted: '#8e8a80',
    surface: '#1f1f1c',
    zebra: '#1a1a18',
    ok: '#6fc593',
    err: '#f2727f',
    warn: '#e9b949',
  },
  light: {
    read: '#2464a0',
    write: '#a94a26',
    run: '#6243c4',
    search: '#2464a0',
    web: '#a8337f',
    mcp: '#1f6e43',
    other: '#4f4b44',
    user: '#a94a26',
    fg: '#1c1b19',
    muted: '#77726a',
    surface: '#f6f4ef',
    zebra: '#faf8f3',
    ok: '#1f6e43',
    err: '#c0263a',
    warn: '#8a6000',
  },
  spinner: ['Düşünüyor', 'Tartıyor', 'Örüyor', 'Yazıyor', 'Deniyor'],
  done: ['Bitti', 'Tamamlandı', 'Yerleşti'],
}

export default skin
