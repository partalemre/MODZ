import { expect } from 'claude-code/testing'
import { test } from './fixtures'

import { plainCall, plainShell } from '../hooks/kit/plain'

// The plain-language layer (kit/plain.ts): a tool call said so that someone who has never coded follows it,
// by rules alone. These are the calls of a real session's transcript.

const bash = (command: string, lang: 'en' | 'tr' = 'tr') => plainCall('Bash', { command }, lang)

test('a shell line is told by what its steps do, not by its words', () => {
  expect(bash('cd /w && claude plugin test mods/skins 2>&1 | grep -E "enters once|^ *[0-9]+ (pass|fail)"')).toBe('Modun testlerini çalıştırıyor')
  expect(bash('git status')).toBe('Hangi dosyaların değiştiğine bakıyor')
  expect(bash('npm run build')).toBe('Projeyi derliyor (çalışır hale getiriyor)')
  expect(bash('npx tsc --noEmit -p .')).toBe('Kodda tip hatası var mı diye denetliyor')
  expect(bash('python -m pytest tests/ -k foo')).toBe('Testleri çalıştırıyor')
  expect(bash('curl -s https://api.github.com/repos/x/y | jq .name')).toBe('İnternetten veri alıyor: api.github.com')
  expect(bash('git status', 'en')).toBe('Checking which files have changed')
})

test('the first two steps are named, the rest counted; a step that tells nothing is left out', () => {
  expect(bash('grep -n "AssistantMessage" -B3 -A22 tests/rows.test.tsx | sed -n 1,80p; cat tsconfig.json; grep -n "tables" hooks/x')).toBe(
    'Dosyaların içinde “AssistantMessage” arıyor, sonra bir dosyayı okuyor: tsconfig.json (+1 adım daha)',
  )
  expect(bash('cd /w && git checkout -q -b fix/card && cat >> tests/motion.test.ts')).toBe(
    'Yeni bir çalışma dalı (branch) açıyor: fix/card, sonra bir dosyaya yazıyor: motion.test.ts',
  )
  // Moving folders, setting a variable and a loop's frame are not steps a person needs told.
  expect(bash('for m in mods/*/; do n=$(basename $m); [ -d x ] && cp -R a b ; done; ls mods')).toBe('Dosya kopyalıyor, sonra bir klasördeki dosyaları listeliyor')
  expect(bash('cd /tmp')).toBe('Başka bir klasöre geçiyor')
  expect(bash('git add -A && git commit -m "x" && git push', 'en')).toBe('Picking the changes to save, then saving the changes as a new version (commit) (+1 more)')
})

test('a command that can lose work says so plainly', () => {
  expect(bash('rm -rf node_modules dist')).toBe('Bir klasörü içindekilerle birlikte siliyor: dist')
  expect(bash('git reset --hard HEAD~1')).toBe('Henüz kaydedilmemiş değişiklikleri siliyor')
  expect(bash('git push --force-with-lease')).toBe('Ortak kopyanın üzerine kendi kayıtlarını yazıyor')
  expect(bash("sed -i '' 's/a/b/' file.ts")).toBe('Bir dosyayı kurala göre değiştiriyor: file.ts')
  expect(bash('git checkout -- src/a.ts')).toBe('Dosyaları eski haline döndürüyor (kaydedilmemiş değişiklikler silinir)')
  expect(bash('git stash drop')).toBe('Kenara konmuş değişiklikleri siliyor')
  expect(bash('git branch -D old-idea')).toBe('Bir çalışma dalını (branch) siliyor: old-idea')
  // Moving to another branch loses nothing, and is not told as if it did.
  expect(bash('git checkout main')).toBe('Başka bir çalışma dalına (branch) geçiyor')
})

test('a script written on the spot, a script of the project and an unknown command are each named for what they are', () => {
  expect(bash("cd hooks && python3 - <<'EOF'\nimport re\nprint(1)\nEOF")).toBe('O an yazdığı kısa bir betiği çalıştırıyor')
  expect(bash('ROOT="$(pwd)" FOO=1 python3 tools/build.py --fast out.json')).toBe('Bir betik (küçük program) çalıştırıyor: build.py')
  expect(bash('bin/modz check skins')).toBe('Projenin kendi betiğini çalıştırıyor: modz check')
  expect(bash('weirdtool --x')).toBe('“weirdtool” komutunu çalıştırıyor')
  expect(bash('npx some-unknown-cli init')).toBe('“some-unknown-cli” aracını çalıştırıyor')
})

test('every other tool reads as a sentence: files, searches, agents, connected services', () => {
  expect(plainCall('Read', { file_path: '/a/b/client.ts' }, 'tr')).toBe('client.ts dosyasını okuyor')
  expect(plainCall('Edit', { file_path: '/a/b/x.tsx' }, 'en')).toBe('Changing the file x.tsx')
  expect(plainCall('Grep', { pattern: 'ToolGroup', path: 'mods' }, 'tr')).toBe('Dosyaların içinde “ToolGroup” arıyor')
  expect(plainCall('Agent', { description: 'Survey the tests', prompt: 'x' }, 'tr')).toBe('Bir yardımcı ajana iş veriyor: Survey the tests')
  expect(plainCall('WebFetch', { url: 'https://docs.example.com/x' }, 'tr')).toBe('Bir internet sayfasını okuyor: docs.example.com')
  expect(plainCall('mcp__Claude_Browser__navigate', { url: 'x' }, 'tr')).toBe('Tarayıcıda bir sayfa açıyor')
  expect(plainCall('mcp__supabase__execute_sql', {}, 'tr')).toBe('Bağlı “supabase” servisini kullanıyor')
  // A server named by an id says nothing: its tool's own name stands.
  expect(plainCall('mcp__1a59c906-04da-521d-bda7-7f71b9f9e01c__batch', {}, 'en')).toBe('Using the “batch” tool')
})

test('input it cannot read still gives a sentence, never a throw or a broken one', () => {
  expect(plainCall('Read', {}, 'tr')).toBe('“Read” aracını kullanıyor')
  expect(plainCall('Frobnicate', null, 'en')).toBe('Using the “Frobnicate” tool')
  expect(plainCall('Bash', { command: '' }, 'tr')).toBe('Bir terminal komutu çalıştırıyor')
  for (const odd of ['&& ;; |', '"unclosed', '$(', 'echo "a && b"', '# only a comment', 'npm', '\\\n']) {
    expect(plainShell(odd, 'tr').length).toBeGreaterThan(0)
    expect(plainShell(odd, 'en')).not.toContain('{x}')
  }
})

test('a subagent handing its report back is said in words', () => {
  expect(plainCall('SubagentHandback', { message: 'done' }, 'tr')).toBe('Bitirdiği işin raporunu kendisini başlatan sohbete teslim ediyor')
})
