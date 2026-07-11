import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { createApplication } from '../index.js'

test('HTTP setup and admin authentication protect private state', async (t) => {
  const directory = await mkdtemp(join(tmpdir(), 'expressacc-api-'))
  const application = await createApplication({ databaseFile: join(directory, 'db.json') })
  await new Promise((resolve) => application.server.listen(0, '127.0.0.1', resolve))
  const address = application.server.address()
  const base = `http://127.0.0.1:${address.port}/api`
  t.after(async () => {
    application.close()
    await new Promise((resolve) => application.server.close(resolve))
    await rm(directory, { recursive: true, force: true })
  })

  const health = await fetch(`${base}/health`)
  assert.equal(health.status, 200)
  assert.equal((await health.json()).ok, true)

  const unauthorized = await fetch(`${base}/admin/state`)
  assert.equal(unauthorized.status, 401)
  const missing = await fetch(`${base}/not-a-route`)
  assert.equal(missing.status, 404)
  assert.equal((await missing.json()).error, 'API endpoint not found.')

  const setup = await fetch(`${base}/setup`, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ applicationName: 'API Test', password: 'password123', timeZone: 'UTC' }),
  })
  assert.equal(setup.status, 200)

  const login = await fetch(`${base}/admin/login`, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ password: 'password123' }),
  })
  assert.equal(login.status, 200)
  const cookie = login.headers.get('set-cookie').split(';')[0]
  const authorized = await fetch(`${base}/admin/state`, { headers: { cookie } })
  assert.equal(authorized.status, 200)
  assert.equal((await authorized.json()).settings.applicationName, 'API Test')
})
