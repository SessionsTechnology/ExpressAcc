import { createHmac, randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'

const scrypt = promisify(scryptCallback)

export async function hashSecret(secret) {
  const salt = randomBytes(16)
  const derived = await scrypt(String(secret), salt, 64)
  return `scrypt$${salt.toString('base64url')}$${Buffer.from(derived).toString('base64url')}`
}

export async function verifySecret(secret, stored) {
  const parts = String(stored || '').split('$')
  if (parts.length !== 3 || parts[0] !== 'scrypt' || !parts[1] || !parts[2]) return false
  try {
    const salt = Buffer.from(parts[1], 'base64url')
    const expected = Buffer.from(parts[2], 'base64url')
    if (salt.length !== 16 || expected.length !== 64) return false
    const actual = Buffer.from(await scrypt(String(secret), salt, expected.length))
    return timingSafeEqual(expected, actual)
  } catch {
    return false
  }
}

export function createToken(payload, secret, lifetimeSeconds) {
  const body = Buffer.from(JSON.stringify({ ...payload, exp: Date.now() + lifetimeSeconds * 1000 })).toString('base64url')
  const signature = createHmac('sha256', secret).update(body).digest('base64url')
  return `${body}.${signature}`
}

export function verifyToken(token, secret, expectedScope) {
  if (!token || !secret) return null
  const parts = String(token).split('.')
  if (parts.length !== 2 || !parts[0] || !parts[1]) return null
  const [body, signature] = parts
  const expected = createHmac('sha256', secret).update(body).digest()
  const actual = Buffer.from(signature, 'base64url')
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString())
    return payload && Number.isFinite(payload.exp) && payload.exp > Date.now() && payload.scope === expectedScope ? payload : null
  } catch {
    return null
  }
}

export function readCookie(header, name) {
  const pair = String(header || '').split(';').map((value) => value.trim()).find((value) => value.startsWith(`${name}=`))
  if (!pair) return null
  try {
    return decodeURIComponent(pair.slice(name.length + 1))
  } catch {
    return null
  }
}
