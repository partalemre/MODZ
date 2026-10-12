import type { RenderElement } from 'claude-code'

import { cardsSection, headersSection, typeSection } from './cards'
import type { Ctx } from './ctx'
import { filesSection, loadingSection, pillsSection, stepsSection } from './lists'
import { dataSection, iconsSection, metersSection } from './visuals'

export type { Ctx } from './ctx'

export type GallerySection = { id: string; draw: (ctx: Ctx) => RenderElement }

export const SECTIONS: readonly GallerySection[] = [
  { id: 'cards', draw: cardsSection },
  { id: 'headers', draw: headersSection },
  { id: 'type', draw: typeSection },
  { id: 'icons', draw: iconsSection },
  { id: 'data', draw: dataSection },
  { id: 'meters', draw: metersSection },
  { id: 'steps', draw: stepsSection },
  { id: 'files', draw: filesSection },
  { id: 'pills', draw: pillsSection },
  { id: 'loading', draw: loadingSection },
]
