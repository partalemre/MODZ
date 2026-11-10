import { expect, test } from 'claude-code/testing'

import { findSecrets } from '../hooks/detect'

// Key shapes the scan must know, and look-alikes it must leave alone (each was once a hard deny for a subagent).

// Built from pieces so this file never holds a literal that a scanner would take for a real key.
const BODY = 'Zx9Qw7Er5Ty3Ui1Op8As6Df4Gh2Jk7Lm'
const join = (...parts: string[]) => parts.join('')
const kindsOf = (text: string) => findSecrets(text).map(secret => secret.kind)

test('Slack, Google, GitLab, Hugging Face, SendGrid, Supabase and Stripe test keys are found', () => {
  const cases: [string, string][] = [
    [join('xox', 'b-', '123456789012-', '1234567890123-', BODY), 'slack'],
    [join('xox', 'p-', '123456789012-', '1234567890123-', BODY), 'slack'],
    [join('https://hooks.', 'slack.com/services/', 'T0123ABCD/', 'B0123ABCD/', BODY), 'slack-webhook'],
    [join('AI', 'za', 'Sy', BODY, 'aB3_dE5'), 'google'],
    [join('gl', 'pat-', BODY), 'gitlab'],
    [join('hf', '_', 'ZxQwErTyUiOpAsDfGhJkLmNbVcXzQwErTy'), 'huggingface'],
    [join('S', 'G.', 'Zx9Qw7Er5Ty3Ui1Op8', '.', BODY), 'sendgrid'],
    [join('sb', '_secret_', BODY), 'supabase-secret'],
    [join('sk', '_test_', BODY), 'stripe'],
  ]
  for (const [value, kind] of cases) expect([value, kindsOf(`const v = "${value}"`)]).toEqual([value, [kind]])
})

test('a database URL with a real password is found; a default or variable password is not', () => {
  const url = join('postgres', 'ql://app:', 'Hq7kd92LmX0pz', '@db.internal:5432/main')
  expect(kindsOf(`DATABASE_URL="${url}"`)).toEqual(['database-url'])
  expect(kindsOf(`url = '${join('mysql', '://root:', 'Hq7kd92LmX0pz', '@localhost/app')}'`)).toEqual(['database-url'])
  expect(kindsOf('DATABASE_URL=postgres://postgres:postgres@localhost:5432/dev')).toEqual([])
  expect(kindsOf('DATABASE_URL=postgres://app:${DB_PASSWORD}@db:5432/main')).toEqual([])
})

test('a literal bearer token and a PGP private key block are found', () => {
  expect(kindsOf(`headers: { Authorization: "Bearer ${BODY}" }`)).toEqual(['bearer'])
  expect(kindsOf('headers: { Authorization: `Bearer ${token}` }')).toEqual([])
  expect(kindsOf(join('-----BEGIN PGP ', 'PRIVATE KEY BLOCK-----'))).toEqual(['private-key'])
})

test('secret names not ending in KEY or TOKEN, and bare password/token/secret keys, are found', () => {
  expect(findSecrets(`TWILIO_AUTH=${BODY}`).map(secret => secret.envName)).toEqual(['TWILIO_AUTH'])
  expect(findSecrets(`DB_PASS=${BODY}`).map(secret => secret.envName)).toEqual(['DB_PASS'])
  expect(findSecrets(`password: ${BODY}`).map(secret => secret.envName)).toEqual(['PASSWORD'])
  expect(findSecrets(`{ "token": "${BODY}" }`).map(secret => secret.envName)).toEqual(['TOKEN'])
  expect(findSecrets(`secret: '${BODY}'`).map(secret => secret.envName)).toEqual(['SECRET'])
})

test('CSS class names and slugs that start with sk- are not keys', () => {
  expect(kindsOf(join('<div class="', 'sk', '-spinner-circle-bounce-delay">'))).toEqual([])
  expect(kindsOf(join('href="/', 'sk', '-proj-dashboard-settings-overview"'))).toEqual([])
  expect(kindsOf(`const k = "${join('sk', '-proj-', BODY, BODY)}"`)).toEqual(['openai'])
})

test('hex cache keys, git SHAs, file paths and placeholders are not secrets', () => {
  const sha = join('ff9d7240ac5b4a3f', '2e1d0c9b8a7f6e5d4c3b2a19')
  const sha256 = join('9f86d081884c7d659a2feaa0c55ad015', 'a3bf4f1b2b0b822cd15d6c15b0f00a08')
  const placeholder = join('⟦', 'secret:123', '⟧')
  expect(kindsOf(`const CACHE_KEY = "${sha256}"`)).toEqual([])
  expect(kindsOf(`cacheKey: '${sha}'`)).toEqual([])
  expect(kindsOf(`const BASE_TOKEN = '${sha}'`)).toEqual([])
  expect(kindsOf('SSH_KEY=~/.ssh/id_ed25519_deploy2')).toEqual([])
  expect(kindsOf('TLS_KEY = "/etc/ssl/private/server2024.key"')).toEqual([])
  expect(kindsOf('signingKey: "keys/release-2024.pem"')).toEqual([])
  expect(kindsOf(`API_TOKEN = "${placeholder}"`)).toEqual([])
  // A hex value under a name that says it is secret still counts.
  expect(kindsOf(`JWT_SECRET = "${sha}"`)).toEqual(['generic'])
})
