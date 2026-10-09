# MODZ

Claude Code modlarının (hooks plugin'leri: bant, panel, status, toast, guard) tek kaynağı.

- Kaynak burada: `mods/<ad>/`.
- Etkinleştirme: `~/.claude/skills/<ad>` → `MODZ/mods/<ad>` symlink'i. Claude skills klasöründeki plugin'leri
  her oturumda kendiliğinden yükler; kopya yok, kurulum yok.
- `~/AI-Tools/claude-mods/src/<ad>` da buraya bakan symlink; orada yapılan düzenleme buraya yazılır.
- Klasör aynı zamanda `modz` adlı marketplace (`.claude-plugin/marketplace.json`), paylaşmak için.
- Taşıma öncesi yedekler: `~/.claude/mods-backup-20261009/`.

## Modlar (17)

Gruplar `/modz` panelindekiyle aynı (`mods/modz/hooks/meta.ts`).

**Görünüm**

| Mod | Ne yapar |
| --- | --- |
| `filetree` | File tree of what Claude touches: what it is doing now, files touched this turn and git status |
| `modz` | MODZ ana paneli: oturum açılınca sağda açılır; her modun canlı özeti ve paneli tek tıkla, ayrıca tüm modların kataloğu (`/modz`) |
| `replay-theater` | Replay the last turn's file edits step by step: what each step did, which plan step it belongs to, colored diff |
| `skins` | Skins for the transcript: themed tool rows, reply gutters and spinner words; /skin swaps them live |
| `terminal-browser` | A browser that runs in the terminal: preview sites and HTML files, let the agent drive the built-in browser. Terminal only |

**Koruma**

| Mod | Ne yapar |
| --- | --- |
| `blast-radius` | Holds risky shell commands (rm -rf, git reset --hard, git clean, force push, migrations) and shows what they would change, with delete and Vazgeç |
| `cache-tax` | Keeps the one-hour prompt cache warm during breaks and holds a cold send on a card with its estimated rewrite cost. Warming costs tokens |
| `checkpoint` | Silent git snapshot before each turn's first file write; /checkpoints lists turns and undoes one after a confirm |
| `secret-guard` | Scans Write/Edit and git add/commit for keys and tokens, blocks git add of .env; masked card with Anahtarları .env'e taşı, Bir kez izin ver or Vazgeç |
| `session-budget` | A per-session spend budget (% of the 5h limit or $): notice at 80%, Continue anyway / Stop at 100% on a new prompt |

**Ölçüm**

| Mod | Ne yapar |
| --- | --- |
| `hud-pro` | One quiet line at the bottom of the band: 5h limit with reset, 7d, context and session ≈cost; /hud full shows details |
| `savvy-progress` | Progress band above the prompt and the single **Ajanlar** panel: running, finished and planned agents with progress %, cost, time, message and stop |
| `test-badge` | After a turn that edited source files, runs tests and lint in the background and shows a badge (testler 41/42 · lint 2 hata) with a failure pane |

**Akış**

| Mod | Ne yapar |
| --- | --- |
| `done-ping` | A notification when a long turn finishes or Claude waits on you: the desktop app's own notification, else a macOS banner |
| `plan-steps` | Shows the plan's steps when there is one (task list, approved plan or plan file): /steps pane and a quiet status line |
| `reflect-mod` | Finds reusable corrections in your prompts (Turkish and English prefilter, one model check) and saves them to the chosen CLAUDE.md |
| `savvy-flow` | Orchestrated delivery: the session model plans and reviews, five tiered worker subagents implement. Skill and agents only; pairs with savvy-progress |

Ortak çizim kiti `kit/` altında (`bin/kit-sync` modlara dağıtır). `bin/preview <mod>` bir modun test önizlemelerini PNG'ye çizer.

## Yönetim

`bin/modz status | check [ad] | new <ad> "açıklama" | link [ad] | unlink <ad> | list | sync | dev | import <klasör>`.
Oturum açılınca sağda MODZ ana paneli gelir: ajanlar, dosyalar, plan, testler, kontrol noktaları, tekrar, kullanım ve görünüm birer tıkla açılır; "Modlar" satırı tüm modları listeler. Kapatmak için `/config` → modz → "Oturum başında aç". Modlar birbirine `$.state` ile haber verir (DESIGN.md §9).

Akış: `bin/modz new <ad>` → düzenle → `bin/modz check <ad>` → `bin/modz link <ad>`.
Oturumda Claude'a yazdırılan mod `~/.claude/dev-mods/<oturum>/` altına düşer: `bin/modz dev` → `bin/modz import <klasör>` → `bin/modz link <ad>`.

## Paylaşım

Repo GitHub'a gidince başkası şöyle kurar:

```
/plugin install <mod> --marketplace <owner>/MODZ
```
