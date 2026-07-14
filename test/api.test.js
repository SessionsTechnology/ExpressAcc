import assert from 'node:assert/strict'
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { createApplication } from '../index.js'

test('HTTP setup and admin authentication protect private state', async (t) => {
  const directory = await mkdtemp(join(tmpdir(), 'expressacc-api-'))
  const publicPath = join(directory, 'dist')
  await mkdir(join(publicPath, 'assets'), { recursive: true })
  await writeFile(join(publicPath, 'index.html'), '<!doctype html><script src="/assets/app-123.js"></script>')
  await writeFile(join(publicPath, 'assets', 'app-123.js'), 'console.log("test asset")')
  const recoveryLogs = []
  const application = await createApplication({
    databaseFile: join(directory, 'db.json'),
    publicPath,
    recoveryLogger: (message) => recoveryLogs.push(message),
  })
  await new Promise((resolve) => application.server.listen(0, '127.0.0.1', resolve))
  const address = application.server.address()
  const origin = `http://127.0.0.1:${address.port}`
  const base = `${origin}/api`
  t.after(async () => {
    await application.close()
    assert.equal(application.server.listening, false)
    await rm(directory, { recursive: true, force: true })
  })

  const index = await fetch(origin)
  assert.match(index.headers.get('cache-control'), /no-cache/)
  const asset = await fetch(`${origin}/assets/app-123.js`)
  assert.match(asset.headers.get('cache-control'), /max-age=31536000/)
  assert.match(asset.headers.get('cache-control'), /immutable/)

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
  const authorizedState = await authorized.json()
  assert.equal(authorizedState.settings.applicationName, 'API Test')

  const updatedSettings = await fetch(`${base}/admin/settings`, {
    method: 'PATCH', headers: { cookie, 'content-type': 'application/json' },
    body: JSON.stringify({
      ...authorizedState.settings,
      password: '',
      kioskMessage: 'Welcome to the kiosk',
      kioskTimeoutSeconds: 45,
      darkMode: true,
    }),
  })
  assert.equal(updatedSettings.status, 200)
  assert.equal((await updatedSettings.json()).kioskTimeoutSeconds, 45)
  assert.equal((await (await fetch(`${base}/status`)).json()).darkMode, true)
  const publicState = await fetch(`${base}/state`)
  assert.equal((await publicState.json()).kioskMessage, 'Welcome to the kiosk')

  const savedUsers = await fetch(`${base}/admin/users`, {
    method: 'PUT', headers: { cookie, 'content-type': 'application/json' }, body: JSON.stringify([{ name: 'Alex' }]),
  })
  assert.equal(savedUsers.status, 200)
  const user = (await savedUsers.json())[0]
  const publicUsers = await (await fetch(`${base}/state`)).json()
  assert.equal(publicUsers.users.find((entry) => entry.id === user.id).hasPin, false)

  const setTime = await fetch(`${base}/admin/users/${user.id}/time`, {
    method: 'PUT', headers: { cookie, 'content-type': 'application/json' }, body: JSON.stringify({ timeRemainingSeconds: 1800 }),
  })
  assert.equal(setTime.status, 200)
  assert.equal((await setTime.json()).timeRemainingSeconds, 1800)
  const resetTime = await fetch(`${base}/admin/users/${user.id}/time/reset`, { method: 'POST', headers: { cookie } })
  assert.equal(resetTime.status, 200)
  assert.equal((await resetTime.json()).timeRemainingSeconds, 0)

  const savedChores = await fetch(`${base}/admin/chores`, {
    method: 'PUT', headers: { cookie, 'content-type': 'application/json' },
    body: JSON.stringify([{ title: 'Dishes', rewardMinutes: 10, recurrence: 'daily', assignedUserIds: [user.id] }]),
  })
  assert.equal(savedChores.status, 200)
  const chore = (await savedChores.json())[0]
  const savedItems = await fetch(`${base}/admin/items`, {
    method: 'PUT', headers: { cookie, 'content-type': 'application/json' },
    body: JSON.stringify([{ name: 'Board game', isTimed: false, assignedUserIds: [user.id] }]),
  })
  assert.equal(savedItems.status, 200)
  const item = (await savedItems.json())[0]
  const unlock = await fetch(`${base}/users/${user.id}/unlock`, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ pin: '' }),
  })
  const userToken = (await unlock.json()).token
  const blockedCheckout = await fetch(`${base}/users/${user.id}/checkout`, {
    method: 'POST', headers: { authorization: `Bearer ${userToken}`, 'content-type': 'application/json' },
    body: JSON.stringify({ itemId: item.id }),
  })
  assert.equal(blockedCheckout.status, 409)
  assert.match((await blockedCheckout.json()).error, /Dishes/)
  const submitted = await fetch(`${base}/users/${user.id}/chores/${chore.id}/complete`, {
    method: 'POST', headers: { authorization: `Bearer ${userToken}` },
  })
  let completion = await submitted.json()
  const undone = await fetch(`${base}/users/${user.id}/chores/${chore.id}/complete`, {
    method: 'DELETE', headers: { authorization: `Bearer ${userToken}` },
  })
  assert.equal(undone.status, 200)
  assert.equal((await undone.json()).undone, true)
  const resubmitted = await fetch(`${base}/users/${user.id}/chores/${chore.id}/complete`, {
    method: 'POST', headers: { authorization: `Bearer ${userToken}` },
  })
  assert.equal(resubmitted.status, 200)
  completion = await resubmitted.json()
  const approved = await fetch(`${base}/admin/completions/${completion.id}/review`, {
    method: 'POST', headers: { cookie, 'content-type': 'application/json' }, body: JSON.stringify({ status: 'approved' }),
  })
  assert.equal(approved.status, 200)
  const checkout = await fetch(`${base}/users/${user.id}/checkout`, {
    method: 'POST', headers: { authorization: `Bearer ${userToken}`, 'content-type': 'application/json' },
    body: JSON.stringify({ itemId: item.id }),
  })
  assert.equal(checkout.status, 200)
  const resetCompletion = await fetch(`${base}/admin/completions/${completion.id}/reset`, { method: 'POST', headers: { cookie } })
  assert.equal(resetCompletion.status, 200)
  assert.equal((await resetCompletion.json()).reset, true)

  const recoveryRequest = await fetch(`${base}/admin/recovery/request`, { method: 'POST' })
  assert.equal(recoveryRequest.status, 202)
  const recoveryResponse = await recoveryRequest.json()
  assert.deepEqual(recoveryResponse, { requested: true, expiresInSeconds: 600 })
  assert.equal(JSON.stringify(recoveryResponse).includes('Recovery code'), false)
  assert.equal(recoveryLogs.length, 1)
  const recoveryCode = recoveryLogs[0].match(/Recovery code: ([A-F0-9-]+)/)?.[1]
  assert.match(recoveryCode, /^[A-F0-9]{4}(?:-[A-F0-9]{4}){3}$/)

  const wrongRecovery = await fetch(`${base}/admin/recovery/reset`, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ code: '0000-0000-0000-0000', password: 'new-password-123' }),
  })
  assert.equal(wrongRecovery.status, 401)

  const recovered = await fetch(`${base}/admin/recovery/reset`, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ code: recoveryCode.toLowerCase(), password: 'new-password-123' }),
  })
  assert.equal(recovered.status, 200)
  assert.deepEqual(await recovered.json(), { reset: true })

  const oldSession = await fetch(`${base}/admin/state`, { headers: { cookie } })
  assert.equal(oldSession.status, 401)
  const oldPassword = await fetch(`${base}/admin/login`, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ password: 'password123' }),
  })
  assert.equal(oldPassword.status, 401)
  const newPassword = await fetch(`${base}/admin/login`, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ password: 'new-password-123' }),
  })
  assert.equal(newPassword.status, 200)

  const reusedRecovery = await fetch(`${base}/admin/recovery/reset`, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ code: recoveryCode, password: 'another-password-123' }),
  })
  assert.equal(reusedRecovery.status, 401)
})
