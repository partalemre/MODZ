import type { Skin } from '../skin'

const skin: Skin = {
  name: 'gruvbox',
  label: 'Gruvbox',
  palette: {
    read: '#83a598',
    write: '#fe8019',
    run: '#b8bb26',
    search: '#d3869b',
    web: '#8ec07c',
    mcp: '#fabd2f',
    other: '#ebdbb2',
    user: '#fabd2f',
    fg: '#ebdbb2',
    muted: '#928374',
    surface: '#32302f',
    zebra: '#2f2c2a',
    ok: '#b8bb26',
    err: '#fb4934',
    warn: '#fe8019',
  },
  spinner: ['Brewing', 'Roasting', 'Simmering', 'Toasting', 'Percolating', 'Kindling'],
  done: ['Brewed', 'Roasted', 'Toasted', 'Served'],
}

export default skin
