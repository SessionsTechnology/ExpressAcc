import assert from 'node:assert/strict'
import test from 'node:test'
import { createToken, hashSecret, verifySecret, verifyToken } from '../server/auth.js'

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
})
