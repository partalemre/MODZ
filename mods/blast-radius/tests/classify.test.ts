import { expect, test } from 'claude-code/testing'

import { classify } from '../hooks/classify'
import { redirectTargets, splitCommands } from '../hooks/shell'

// What the classifier holds and lets pass, command by command. Measuring decides later whether
// anything would be lost; these only say whether the command is looked at.

const kindOf = (command: string): string | null => classify(command)?.kind ?? null

test('wrappers: the command inside bash -c, sh -c, eval and xargs is the one read', () => {
  expect(classify('bash -c "rm -rf build"')).toMatchObject({ kind: 'rm', targets: ['build'] })
  expect(classify("sh -c 'cd app && rm -rf out'")).toMatchObject({ kind: 'rm', targets: ['out'], dir: 'app' })
  expect(classify('bash -lc "git reset --hard"')).toMatchObject({ kind: 'git-reset' })
  expect(classify('eval "rm -rf build"')).toMatchObject({ kind: 'rm', targets: ['build'] })
  expect(classify('ls | xargs rm')).toMatchObject({ kind: 'rm', isFromInput: true })
  expect(classify('xargs rm -rf < list')).toMatchObject({ kind: 'rm', isFromInput: true })
  expect(classify('find . -name "*.o" -print0 | xargs -0 -n 10 rm -f')).toMatchObject({ kind: 'rm', isFromInput: true })
  expect(classify('git branch --merged | xargs git branch -D')).toMatchObject({ kind: 'git-branch-delete' })
  expect(kindOf('bash -c "ls -la"')).toBeNull()
})

test('find deletes are dry-run with the action swapped for -print', () => {
  expect(classify('find . -delete')).toMatchObject({ kind: 'find', args: ['.', '-print'] })
  expect(classify('find . -name x -exec rm {} +')).toMatchObject({ kind: 'find', args: ['.', '-name', 'x', '-print'] })
  expect(classify('find src -name "*.pyc" -exec rm -f {} \\;')).toMatchObject({ kind: 'find', args: ['src', '-name', '*.pyc', '-print'] })
  expect(kindOf('find . -name "*.ts"')).toBeNull()
  expect(kindOf('find . -exec grep -l x {} +')).toBeNull()
})

test('prefixes that only change how a command runs are looked through', () => {
  for (const prefix of ['timeout 10', 'timeout -s KILL 5', 'ionice -c3', 'ionice -c 2 -n 7', 'nice', 'nice -10', 'sudo', 'sudo -u me --', 'FOO=1', 'env -i', 'env -u HOME A=1', 'nohup', 'time -p', 'if', 'command']) {
    expect(classify(`${prefix} rm -rf build`)).toMatchObject({ kind: 'rm', targets: ['build'] })
  }
})

test('git: every way to throw away work is read', () => {
  expect(classify('git checkout -- src/a.ts')).toMatchObject({ kind: 'git-checkout', paths: ['src/a.ts'], dropsStaged: false })
  expect(classify('git checkout main -- src/a.ts')).toMatchObject({ kind: 'git-checkout', paths: ['src/a.ts'], dropsStaged: true })
  expect(classify('git checkout .')).toMatchObject({ kind: 'git-checkout', paths: ['.'] })
  expect(classify('git restore src/a.ts')).toMatchObject({ kind: 'git-checkout', paths: ['src/a.ts'], dropsStaged: false })
  expect(classify('git restore -SW src')).toMatchObject({ kind: 'git-checkout', paths: ['src'], dropsStaged: true })
  expect(classify('git checkout -f')).toMatchObject({ kind: 'git-checkout', paths: [], dropsStaged: true })
  expect(classify('git switch -f main')).toMatchObject({ kind: 'git-checkout', paths: [], dropsStaged: true })
  expect(classify('git switch --discard-changes main')).toMatchObject({ kind: 'git-checkout', dropsStaged: true })
  expect(classify('git stash drop')).toMatchObject({ kind: 'git-stash', args: ['drop'] })
  expect(classify('git stash clear')).toMatchObject({ kind: 'git-stash', args: ['clear'] })
  expect(classify('git branch -D old')).toMatchObject({ kind: 'git-branch-delete', args: ['old'] })
  expect(classify('git branch --delete --force a b')).toMatchObject({ kind: 'git-branch-delete', args: ['a', 'b'] })
  expect(classify('git push --delete origin old')).toMatchObject({ kind: 'git-push-delete', args: ['origin', 'old'] })
  expect(classify('git push origin :old')).toMatchObject({ kind: 'git-push-delete', args: ['origin', 'old'] })
  expect(classify('git worktree remove --force ../wt')).toMatchObject({ kind: 'git-worktree', args: ['../wt'] })
  expect(classify('git reset --hard origin/main')).toMatchObject({ kind: 'git-reset', args: ['--hard', 'origin/main'] })
})

test('git: what cannot lose work passes', () => {
  for (const command of ['git checkout -b new', 'git switch main', 'git restore --staged src/a.ts', 'git branch -d old', 'git worktree remove ../wt', 'git stash list', 'git clean -n', 'git clean --dry-run -d', 'git clean -nfd', 'git push origin main']) {
    expect([command, kindOf(command)]).toEqual([command, null])
  }
})

test('non-git commands that overwrite or remove what exists', () => {
  expect(classify('> notes.md')).toMatchObject({ kind: 'overwrite', paths: ['notes.md'] })
  expect(classify('echo hi > existing.txt 2>/dev/null')).toMatchObject({ kind: 'overwrite', paths: ['existing.txt'] })
  expect(classify('mv a.txt b.txt')).toMatchObject({ kind: 'overwrite', paths: ['b.txt', 'b.txt/a.txt'] })
  expect(classify('cp -r src lib/')).toMatchObject({ kind: 'overwrite', paths: ['lib/', 'lib/src'] })
  expect(classify('truncate -s 0 app.db')).toMatchObject({ kind: 'overwrite', paths: ['app.db'] })
  expect(classify('dd if=/dev/zero of=disk.img bs=1m')).toMatchObject({ kind: 'overwrite', paths: ['disk.img'] })
  expect(classify('shred -u secrets.txt')).toMatchObject({ kind: 'overwrite', paths: ['secrets.txt'] })
  expect(classify('echo x | tee out.txt')).toMatchObject({ kind: 'overwrite', paths: ['out.txt'] })
  expect(classify('docker volume rm pgdata')).toMatchObject({ kind: 'tool', tool: 'docker-volume', args: ['pgdata'] })
  expect(classify('docker system prune -af')).toMatchObject({ kind: 'tool', tool: 'docker-prune' })
  expect(classify('docker compose down -v')).toMatchObject({ kind: 'tool', tool: 'docker-compose' })
  expect(classify('psql -c "DROP TABLE users"')).toMatchObject({ kind: 'tool', tool: 'database', label: 'DROP TABLE users' })
  expect(classify('psql mydb -c "truncate orders"')).toMatchObject({ kind: 'tool', tool: 'database' })
  expect(classify('supabase db reset')).toMatchObject({ kind: 'tool', tool: 'database' })
  expect(classify('npx prisma migrate reset --force')).toMatchObject({ kind: 'tool', tool: 'database' })
  expect(classify('terraform destroy -auto-approve')).toMatchObject({ kind: 'tool', tool: 'terraform' })
  expect(classify('kubectl delete pod web -n prod')).toMatchObject({ kind: 'tool', tool: 'kubectl', args: ['pod', 'web', '-n', 'prod'] })
  expect(classify('rsync -a --delete a/ b/')).toMatchObject({ kind: 'tool', tool: 'rsync' })
})

test('what only looks destructive passes', () => {
  const quiet = [
    'echo hi >> log.txt', 'make 2>&1', 'ls > /dev/null', 'cmd &> /dev/null', 'mv -n a b', 'cp -i a b', 'mv a', 'npx prisma migrate status', 'python manage.py migrate --plan',
    'cat <<EOF\nrm -rf build\nEOF', "cat <<'EOF' > /dev/null\nrm -rf /\nEOF", 'echo "a; rm -rf build"', 'git commit -m "x && rm -rf y"', "grep 'rm -rf' notes.md",
    'docker volume ls', 'psql -c "select 1"', 'kubectl get pods', 'rsync -a a/ b/', 'echo "DROP TABLE x"', 'terraform plan', 'docker compose down',
  ]
  for (const command of quiet) expect([command, kindOf(command)]).toEqual([command, null])
})

test('the shell reader keeps quotes, heredocs and redirects apart from commands', () => {
  expect(splitCommands('a && b || c; d | e & f\ng')).toEqual(['a ', ' b ', ' c', ' d ', ' e ', ' f', 'g'])
  expect(splitCommands('echo "x; y" && z')).toEqual(['echo "x; y" ', ' z'])
  expect(splitCommands('cat <<EOF > f\nrm -rf x\nEOF\nls')).toEqual(['cat <<EOF > f', 'ls'])
  expect(splitCommands('make 2>&1 | tee log')).toEqual(['make 2>&1 ', ' tee log'])
  expect(redirectTargets('echo a > "my file" 2>&1 >> log >| x &> /dev/null')).toEqual(['my file', 'x'])
  expect(redirectTargets('echo "a > b"')).toEqual([])
})
