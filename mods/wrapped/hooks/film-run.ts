import { words } from './words'
import type { Film } from '../types'

// The film's line under the buttons.
export function filmLine(film: Film): string {
  const t = words()
  if (film.status === 'making') return t.filmMaking(film.made, film.total)

  return film.status === 'ready' ? t.filmReady(film.path) : t.filmFailed(film.reason)
}

