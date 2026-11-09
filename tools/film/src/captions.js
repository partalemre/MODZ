// Screen-space captions: one short line at a time, word by word into focus; leaving, the line softens as one.
import { presence } from './motion.js'
import { overlay } from './ui.js'

const STAGGER = 0.05

export function makeCaptions(lines) {
  const items = lines.map(line => {
    const el = document.createElement('div')
    el.className = 'cap'
    // *word* marks the one word that carries the accent.
    el.innerHTML = line.text.split(' ').map(w => (w.startsWith('*')
      ? `<span class="w"><em>${w.replace(/\*/g, '')}</em></span>` : `<span class="w">${w}</span>`)).join(' ')
    if (line.top) el.style.bottom = 'auto', el.style.top = `${line.top}px`
    overlay().appendChild(el)
    return { el, words: [...el.querySelectorAll('.w')], ...line }
  })
  return t => {
    for (const it of items) {
      const isLive = t > it.in - 0.1 && t < it.out + 0.5
      it.el.style.display = isLive ? '' : 'none'
      if (!isLive) continue
      it.words.forEach((w, i) => {
        const s = presence(t, it.in + i * STAGGER, it.out, { rise: 18, blur: 10, out: 0.3 })
        w.style.opacity = s.opacity.toFixed(3)
        w.style.transform = `translateY(${s.y.toFixed(2)}px)`
        w.style.filter = s.blur > 0.05 ? `blur(${s.blur.toFixed(2)}px)` : 'none'
      })
    }
  }
}
