# MODZ

Claude Code modlarının (hooks plugin'leri: pane, band, status, toast, guard) tek kaynağı.
Bu klasör aynı zamanda `modz` adlı bir **yerel marketplace**: Claude modları doğrudan buradan okur,
kopya yok. Bir dosyayı düzenle, oturumda `/reload-plugins` de, değişiklik gelir.

## Modlar

| Mod | Ne yapar |
| --- | --- |
| `agent-deck` | Tüm agent'ları canlı gösteren panel: ne yapıyor, ne kadar sürdü, token, transcript, mesaj, iş verme (`/deck`) |
| `git-guard` | Force push, main'e push, hard reset, `git clean -f`, `rm -r` öncesi sorar, risk kartı gösterir |
| `hud` | Prompt üstünde bant: plan limitleri, context doluluğu, oturum maliyeti, tur token akışı |
| `modz` | `/modz`: bu marketplace'teki modları panelde listeler |

## Yapı

```
.claude-plugin/marketplace.json   marketplace (bin/modz sync üretir)
mods/<ad>/                        her mod: .claude-plugin/plugin.json, hooks/, tests/, types/
templates/blank/                  yeni mod şablonu
bin/modz                          yönetim CLI'ı
```

## Yönetim

```bash
bin/modz list
```

```bash
bin/modz new benim-modum "Ne yaptığı tek satır"
```

```bash
bin/modz check
```

```bash
bin/modz install
```

Diğerleri: `bin/modz check <ad>`, `bin/modz install <ad>`, `bin/modz uninstall <ad>`, `bin/modz sync`,
`bin/modz dev` (oturumların `~/.claude/dev-mods` klasöründe yazılmış modlar), `bin/modz import <klasör>`.

## Akış

1. Claude'a mod yazdırınca oturumun `~/.claude/dev-mods/<oturum>/` klasörüne yazar (hot reload orada).
2. Beğendiğinde `bin/modz dev` ile bul, `bin/modz import <klasör>` ile buraya al.
3. `bin/modz check` → `bin/modz install <ad>`; sonra düzenlemeler burada, `/reload-plugins` ile yüklenir.

Geliştirme sırasında tek oturumda denemek için: `claude --plugin-dir ~/Projects/MODZ/mods/<ad>`.

## Paylaşım

Repo GitHub'a gidince başkası şöyle kurar:

```
/plugin install <mod> --marketplace <owner>/MODZ
```
