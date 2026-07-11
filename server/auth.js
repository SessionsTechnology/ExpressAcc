import { createHmac, randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'

const scrypt = promisify(scryptCallback)

export async function hashSecret(secret) {
  const salt = randomBytes(16)
  const derived = await scrypt(String(secret), salt, 64)
  return `scrypt$${salt.toString('base64url')}$${Buffer.from(derived).toString('base64url')}`
}

export async function verifySecret(secret, stored) {
  if (!stored || !stored.startsWith('scrypt$')) return false
  const [, saltValue, hashValue] = stored.split('$')
  const expected = Buffer.from(hashValue, 'base64url')
  const actual = Buffer.from(await scrypt(String(secret), Buffer.from(saltValue, 'base64url'), expected.length))
  return expected.length === actual.length && timingSafeEqual(expected, actual)
}

export function createToken(payload, secret, lifetimeSeconds) {
  const body = Buffer.from(JSON.stringify({ ...payload, exp: Date.now() + lifetimeSeconds * 1000 })).toString('base64url')
  const signature = createHmac('sha256', secret).update(body).digest('base64url')
  return `${body}.${signature}`
}

export function verifyToken(token, secret, expectedScope) {
  if (!token || !secret) return null
  const [body, signature] = token.split('.')
  if (!body || !signature) return null
  const expected = createHmac('sha256', secret).update(body).digest()
  const actual = Buffer.from(signature, 'base64url')
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString())
    return payload.exp > Date.now() && payload.scope === expectedScope ? payload : null
  } catch {
    return null
  }
}

export function readCookie(header, name) {
  const pair = String(header || '').split(';').map((value) => value.trim()).find((value) => value.startsWith(`${name}=`))
  return pair ? decodeURIComponent(pair.slice(name.length + 1)) : null
}
