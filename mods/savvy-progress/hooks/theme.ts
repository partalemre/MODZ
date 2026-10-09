import { CRAB_CSS } from './crabs'

// Every colour the drawings use, light first and dark under the media query, in one place.

export const FONT = "-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif"
export const ACCENT = '#8f8cf4'
export const DONE = '#5fbf8f'
export const WARN = '#d49a3a'
export const FAIL = '#D0453F'
export const CHECK = '#3B9C5F'

// Tier words need more contrast than the bars: a deeper shade on light, a lighter one on dark.
const WORDS_LIGHT = '.w-fable{fill:#5e55c7}.w-heavy{fill:#b8452a}.w-careful{fill:#8f5a0f}.w-medium{fill:#2a6db8}.w-light{fill:#14785a}.w-other{fill:#6b6b68}'
const WORDS_DARK = '.w-fable{fill:#a29bf0}.w-heavy{fill:#e58466}.w-careful{fill:#d9a24a}.w-medium{fill:#6aa6e6}.w-light{fill:#4cc48f}.w-other{fill:#a8a8a4}'

const PANE_CSS = `<style>
.t{fill:#1c1b19}.s{fill:#57544e}.m{fill:#8a867e}.k{fill:#e6e3dc}.ln{stroke:#e4e4e1}.tile{fill:#f4f2ec}.chip{fill:#f1eee7}.rk{stroke:#dcd8cf}${WORDS_LIGHT}
@media (prefers-color-scheme: dark){.t{fill:#f0eee8}.s{fill:#c2beb4}.m{fill:#8e8a80}.k{fill:#34332f}.ln{stroke:#333331}.tile{fill:#1f1f1c}.chip{fill:#262522}.rk{stroke:#3a3934}${WORDS_DARK}}
.live{animation:p 1s ease-in-out infinite}@keyframes p{50%{opacity:.3}}
@media (prefers-reduced-motion: reduce){.live{animation:none}}
</style>`

export const paneSvg = (W: number, H: number, body: string): string =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${PANE_CSS}${CRAB_CSS}${body}</svg>`

// The band's track twinkles in four out-of-phase groups; a finished track settles to a slow glow.
export const bandCss = (isFinished: boolean): string => `<style>
.t{fill:#1f1f1f}.m{fill:#6b6b68}.k{fill:#e4e4e2}.tk{fill:#b4b4b0}
@media (prefers-color-scheme: dark){.t{fill:#ececec}.m{fill:#9a9a9a}.k{fill:#2c2c2c}.tk{fill:#5a5a5a}}
.t0,.t1,.t2,.t3{animation:tw ${isFinished ? 3.2 : 2.2}s ease-in-out infinite}
.t1{animation-duration:${isFinished ? 3.8 : 2.8}s;animation-delay:-.7s}.t2{animation-duration:${isFinished ? 4.4 : 1.9}s;animation-delay:-1.3s}.t3{animation-duration:${isFinished ? 3.5 : 3.3}s;animation-delay:-.4s}
@keyframes tw{0%,100%{opacity:1}50%{opacity:${isFinished ? 0.8 : 0.3}}}
@media (prefers-reduced-motion: reduce){.t0,.t1,.t2,.t3{animation:none}}
</style>`
