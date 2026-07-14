import assert from 'node:assert/strict'
import test from 'node:test'
import { createRecoveryCode, createToken, hashSecret, readCookie, recoveryCodeDigest, recoveryCodeMatches, verifySecret, verifyToken } from '../server/auth.js'

test('secrets are salted and verified without storing plaintext', async () => {
  const first = await hashSecret('correct horse battery staple')
  const second = await hashSecret('correct horse battery staple')
  assert.notEqual(first, second)
  assert.equal(first.includes('correct horse'), false)
  assert.equal(await verifySecret('correct horse battery staple', first), true)
  assert.equal(await verifySecret('incorrect', first), false)
})

test('signed tokens reject tampering and the wrong scope', () => {
  const token = createToken({ scope: 'user', userId: 'user-1' }, 'test-secret', 60)
  assert.equal(verifyToken(token, 'test-secret', 'user').userId, 'user-1')
  assert.equal(verifyToken(token, 'test-secret', 'admin'), null)
  assert.equal(verifyToken(`${token}x`, 'test-secret', 'user'), null)
  assert.equal(verifyToken(`${token}.extra`, 'test-secret', 'user'), null)
})

test('malformed credentials fail closed instead of throwing', async () => {
  assert.equal(await verifySecret('secret', 'scrypt$invalid$invalid'), false)
  assert.equal(await verifySecret('secret', { algorithm: 'scrypt' }), false)
  assert.equal(readCookie('routioneer_admin=%E0%A4%A', 'routioneer_admin'), null)
})

test('recovery codes are strong, readable, and compared safely', () => {
  const code = createRecoveryCode()
  assert.match(code, /^[A-F0-9]{4}(?:-[A-F0-9]{4}){3}$/)
  const digest = recoveryCodeDigest(code)
  assert.equal(recoveryCodeMatches(code.toLowerCase(), digest), true)
  assert.equal(recoveryCodeMatches('0000-0000-0000-0000', digest), false)
  assert.equal(recoveryCodeMatches(code, 'not-a-buffer'), false)
})
