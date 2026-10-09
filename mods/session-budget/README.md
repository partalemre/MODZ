# session-budget

Sets a spending budget for the current session and warns before you go past it. Zero tokens: it reads the same usage data the status line and `hud` use (`session.measure` / `$.session.usage()`).

## Budgets

| Command | Budget |
| --- | --- |
| `/budget 20%` (or `/budget 20`) | 20 points of the **5-hour rate limit**, counted from now |
| `/budget $5` (or `5usd`) | ≈$5 of session cost (the `/cost` ledger), counted from now |
| `/budget` / `/budget status` | Show spend so far |
| `/budget off` | Clear the budget |
| `/session-budget [on\|off]` | Toggle the notice and confirm; saved across sessions |

- **%80:** bant satırı (paylaşılan bildirim sırasında): bütçenin *tidemark* çizgisi olduğu ölçer + `Bütçe %80 · $4,00 / $5,00 · bu hızla ~25 dk` (Amber). Masaüstünde Svg, terminalde `━━━━━━━━┃─` ölçer + metin. Bütçe başına bir kez; 20 sn sonra ya da ✕ ile kapanır.
- **%100:** yazdığın sıradaki prompt bekletilir ve soru açılır; sorunun üstünde Amber kart (dolu halka, "Bütçe doldu", harcanan / bütçe). Seçenekler **Dur** (önerilen, ilk) ve **Devam et (+$1)** (yüzde bütçede `+%n`, bütçenin beşte biri). Dur prompt'u düşürür ve Flare satırı gösterir: `Durduruldu: bütçe doldu · $5,10 / $5,00 · /budget ile artır`. Devam et bütçeyi harcanandan bir adım yukarı taşır ve prompt'u geçirir; adım dolunca yeniden sorar.
- Only prompts you type (terminal, Remote Control, or the desktop app's Code tab, whose prompts arrive as `sdk` while a surface is attached) are held. Prompts from plugins, peers, schedules and task notifications always go through.
- If no one can answer (a `-p` run) or the dialog is dismissed, the prompt goes through. A budget never blocks a turn it can't ask about.

## Notes and limits

- The 5h figure is account-wide: other sessions running in the same window count toward it too. A session that outlives a 5h reset keeps what it spent before the reset and counts from 0 in the new window.
- Rate-limit data exists only on a subscription, and only after the first response of the session. A `%` budget set before that starts counting at the first reading. With API-key auth, use a `$` budget.
- The budget lives for the session only. The on/off toggle is the only setting that persists.
- Shared notice line rank 1 (of: cache-tax 4, you-should-know 3, reflect 2, session-budget 1): the line is drawn above the other band rows and hides while any of those three shows a live notice.

## Files

- `hooks/budget.ts`: argument parsing and spend math (pure)
- `hooks/register.tsx`: hooks, commands, notice band
- `tests/session-budget.test.ts`: `claude plugin test .`
