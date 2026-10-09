import type { Skin } from '../skin'

const skin: Skin = {
  name: 'tokyo-night',
  label: 'Tokyo Night',
  palette: {
    read: '#7dcfff',
    write: '#ff9e64',
    run: '#e0af68',
    search: '#bb9af7',
    web: '#7aa2f7',
    mcp: '#73daca',
    other: '#a9b1d6',
    user: '#7aa2f7',
    fg: '#c0caf5',
    muted: '#737aa2',
    surface: '#1f2335',
    zebra: '#1d2030',
    ok: '#9ece6a',
    err: '#f7768e',
    warn: '#e0af68',
  },
  spinner: ['Neon-ing', 'Drizzling', 'Glowing', 'Wiring', 'Night-driving', 'Rain-checking'],
  done: ['Lit up', 'Wired', 'Shipped', 'Landed'],
}

export default skin
