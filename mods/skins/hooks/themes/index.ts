import catppuccin from './catppuccin'
import dracula from './dracula'
import gruvbox from './gruvbox'
import mono from './mono'
import noir from './noir'
import nord from './nord'
import tidemark from './tidemark'
import tokyoNight from './tokyo-night'
import type { Skin } from '../skin'

// A new built-in skin is one file beside these and one line here. The first is the default.
export const SKINS: readonly Skin[] = [tidemark, noir, tokyoNight, dracula, nord, gruvbox, catppuccin, mono]
