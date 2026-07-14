import assert from 'node:assert/strict'
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { createApplication } from '../index.js'

async function fixture(t) {
  const directory = await mkdtemp(join(tmpdir(), 'routioneer-record-settings-'))
  const publicPath = join(directory, 'dist')
  await mkdir(publicPath, { recursive: true })
  await writeFile(join(publicPath, 'index.html'), '<!doctype html><title>Routioneer test</title>')
  const application = await createApplication({ databaseFile: join(directory, 'db.json'), publicPath })
  await new Promise((resolve) => application.server.listen(0, '127.0.0.1', resolve))
  const address = application.server.address()
  const base = `http://127.0.0.1:${address.port}/api`
  t.after(async () => {
    await application.close()
    await rm(directory, { recursive: true, force: true })
  })

  const setup = await fetch(`${base}/setup`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ applicationName: 'Record API Test', password: 'password123', timeZone: 'UTC' }),
  })
  assert.equal(setup.status, 200)
  const login = await fetch(`${base}/admin/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ password: 'password123' }),
  })
  assert.equal(login.status, 200)
  const cookie = login.headers.get('set-cookie').split(';')[0]
  return { application, base, cookie }
}

function request(base, cookie, path, method, body) {
  const headers = cookie ? { cookie } : {}
  if (body !== undefined) headers['content-type'] = 'application/json'
  return fetch(`${base}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  })
}

test('admin record APIs save one entity at a time and support safe toggle patches', async (t) => {
  const { application, base, cookie } = await fixture(t)

  const unauthorized = await request(base, '', '/admin/users', 'POST', { name: 'No access' })
  assert.equal(unauthorized.status, 401)

  const settingsResponse = await request(base, cookie, '/admin/settings', 'PATCH', { darkMode: true })
  assert.equal(settingsResponse.status, 200)
  const settings = await settingsResponse.json()
  assert.equal(settings.darkMode, true)
  assert.equal(settings.applicationName, 'Record API Test')
  assert.equal(settings.timeZone, 'UTC')
  assert.deepEqual(settings.dailyTimeMinutes, {
    Sunday: 0, Monday: 0, Tuesday: 0, Wednesday: 0, Thursday: 0, Friday: 0, Saturday: 0,
  })
  assert.equal((await request(base, cookie, '/admin/settings', 'PATCH', {})).status, 400)

  let response = await request(base, cookie, '/admin/users', 'POST', { name: 'Alex', pin: '1234' })
  assert.equal(response.status, 200)
  const alex = await response.json()
  assert.equal(alex.hasPin, true)
  assert.equal('pinHash' in alex, false)

  response = await request(base, cookie, `/admin/users/${alex.id}`, 'PATCH', { name: 'Alexandra' })
  assert.equal(response.status, 200)
  assert.equal((await response.json()).name, 'Alexandra')
  assert.equal((await application.service.unlockUser(alex.id, '1234')).id, alex.id)

  response = await request(base, cookie, `/admin/users/${alex.id}`, 'PATCH', { pin: '5678' })
  assert.equal(response.status, 200)
  await assert.rejects(() => application.service.unlockUser(alex.id, '1234'), (error) => error.status === 401)
  assert.equal((await application.service.unlockUser(alex.id, '5678')).id, alex.id)

  response = await request(base, cookie, `/admin/users/${alex.id}`, 'PATCH', { clearPin: true })
  assert.equal(response.status, 200)
  assert.equal((await response.json()).hasPin, false)

  response = await request(base, cookie, '/admin/users', 'POST', { name: 'Sam', disabled: false })
  assert.equal(response.status, 200)
  const sam = await response.json()
  response = await request(base, cookie, `/admin/users/${alex.id}`, 'PATCH', { checkoutEnabled: false })
  assert.equal(response.status, 200)
  const toggledUser = await response.json()
  assert.equal(toggledUser.checkoutEnabled, false)
  assert.equal(toggledUser.name, 'Alexandra')
  let state = await (await fetch(`${base}/admin/state`, { headers: { cookie } })).json()
  assert.equal(state.users.find((user) => user.id === sam.id).name, 'Sam')
  await request(base, cookie, `/admin/users/${alex.id}`, 'PATCH', { checkoutEnabled: true })

  response = await request(base, cookie, '/admin/items', 'POST', {
    name: 'Console', description: 'Shared system', isTimed: false, assignedUserIds: [alex.id],
  })
  assert.equal(response.status, 200)
  const consoleItem = await response.json()
  response = await request(base, cookie, '/admin/items', 'POST', { name: 'Tablet', isTimed: true })
  assert.equal(response.status, 200)
  const tablet = await response.json()
  response = await request(base, cookie, `/admin/items/${consoleItem.id}`, 'PATCH', { disabled: true })
  assert.equal(response.status, 200)
  const toggledItem = await response.json()
  assert.equal(toggledItem.disabled, true)
  assert.equal(toggledItem.name, 'Console')
  assert.equal(toggledItem.description, 'Shared system')
  state = await (await fetch(`${base}/admin/state`, { headers: { cookie } })).json()
  assert.equal(state.items.find((item) => item.id === tablet.id).name, 'Tablet')
  await request(base, cookie, `/admin/items/${consoleItem.id}`, 'PATCH', { disabled: false })

  response = await request(base, cookie, '/admin/chores', 'POST', {
    title: 'Dishes', rewardMinutes: 10, recurrence: 'daily', assignedUserIds: [alex.id],
  })
  assert.equal(response.status, 200)
  const dishes = await response.json()
  response = await request(base, cookie, '/admin/chores', 'POST', {
    title: 'Laundry', rewardMinutes: 5, recurrence: 'weekly', disabled: true,
  })
  assert.equal(response.status, 200)
  const laundry = await response.json()
  response = await request(base, cookie, `/admin/chores/${dishes.id}`, 'PATCH', { disabled: true })
  assert.equal(response.status, 200)
  const toggledChore = await response.json()
  assert.equal(toggledChore.disabled, true)
  assert.equal(toggledChore.title, 'Dishes')
  assert.equal(toggledChore.rewardMinutes, 10)
  state = await (await fetch(`${base}/admin/state`, { headers: { cookie } })).json()
  assert.equal(state.chores.find((chore) => chore.id === laundry.id).title, 'Laundry')

  assert.equal((await request(base, cookie, '/admin/users/missing', 'PATCH', { disabled: true })).status, 404)
  assert.equal((await request(base, cookie, '/admin/items/missing', 'DELETE')).status, 404)
  assert.equal((await request(base, cookie, '/admin/chores/missing', 'PATCH', { disabled: true })).status, 404)
  assert.equal((await request(base, cookie, `/admin/items/${consoleItem.id}`, 'PATCH', {})).status, 400)

  await application.service.checkout(alex.id, consoleItem.id)
  const checkedOutState = structuredClone(application.database.read())
  response = await request(base, cookie, `/admin/users/${alex.id}`, 'PATCH', { checkoutEnabled: false })
  assert.equal(response.status, 409)
  assert.match((await response.json()).error, /check in/)
  assert.deepEqual(application.database.read(), checkedOutState)
  response = await request(base, cookie, `/admin/users/${alex.id}`, 'PATCH', { disabled: true })
  assert.equal(response.status, 409)
  assert.match((await response.json()).error, /check in/)
  assert.deepEqual(application.database.read(), checkedOutState)
  assert.equal((await request(base, cookie, `/admin/users/${alex.id}`, 'DELETE')).status, 409)
  assert.deepEqual(application.database.read(), checkedOutState)
  assert.equal((await request(base, cookie, `/admin/items/${consoleItem.id}`, 'DELETE')).status, 409)
  assert.deepEqual(application.database.read(), checkedOutState)
  await application.service.checkin(alex.id)

  response = await request(base, cookie, `/admin/users/${sam.id}`, 'DELETE')
  assert.equal(response.status, 200)
  assert.deepEqual(await response.json(), { deleted: true })
  response = await request(base, cookie, `/admin/items/${tablet.id}`, 'DELETE')
  assert.equal(response.status, 200)
  assert.deepEqual(await response.json(), { deleted: true })
  response = await request(base, cookie, `/admin/chores/${laundry.id}`, 'DELETE')
  assert.equal(response.status, 200)
  assert.deepEqual(await response.json(), { deleted: true })

  state = await (await fetch(`${base}/admin/state`, { headers: { cookie } })).json()
  assert.deepEqual(state.users.map((user) => user.id), [alex.id])
  assert.deepEqual(state.items.map((item) => item.id), [consoleItem.id])
  assert.deepEqual(state.chores.map((chore) => chore.id), [dishes.id])
  assert.equal(JSON.stringify(state).includes('pinHash'), false)
})

test('users cannot be deleted while items or chores still reference them', async (t) => {
  const { application, base, cookie } = await fixture(t)
  let response = await request(base, cookie, '/admin/users', 'POST', { name: 'Alex' })
  const user = await response.json()
  response = await request(base, cookie, '/admin/items', 'POST', {
    name: 'Console', assignedUserIds: [user.id],
  })
  const item = await response.json()
  response = await request(base, cookie, '/admin/chores', 'POST', {
    title: 'Dishes', rewardMinutes: 0, recurrence: 'daily', assignedUserIds: [user.id],
  })
  const chore = await response.json()
  const before = structuredClone(application.database.read())

  response = await request(base, cookie, `/admin/users/${user.id}`, 'DELETE')
  assert.equal(response.status, 409)
  const error = (await response.json()).error
  assert.match(error, /still assigned/i)
  assert.match(error, /remove the user/i)
  assert.deepEqual(application.database.read(), before)
  assert.deepEqual(application.database.read().items[0].assignedUserIds, [user.id])
  assert.deepEqual(application.database.read().chores[0].assignedUserIds, [user.id])

  assert.equal((await request(base, cookie, `/admin/items/${item.id}`, 'PATCH', { assignedUserIds: [] })).status, 200)
  assert.equal((await request(base, cookie, `/admin/chores/${chore.id}`, 'PATCH', { assignedUserIds: [] })).status, 200)
  response = await request(base, cookie, `/admin/users/${user.id}`, 'DELETE')
  assert.equal(response.status, 200)
  assert.deepEqual(await response.json(), { deleted: true })
})

test('pending chore submissions block referenced user and chore deletion', async (t) => {
  const { application, base, cookie } = await fixture(t)
  let response = await request(base, cookie, '/admin/users', 'POST', { name: 'Alex' })
  const user = await response.json()
  response = await request(base, cookie, '/admin/chores', 'POST', {
    title: 'Dishes', rewardMinutes: 0, recurrence: 'daily', assignedUserIds: [],
  })
  const chore = await response.json()
  const completion = await application.service.completeChore(user.id, chore.id)
  const before = structuredClone(application.database.read())

  response = await request(base, cookie, `/admin/users/${user.id}`, 'DELETE')
  assert.equal(response.status, 409)
  assert.match((await response.json()).error, /pending chore submission/i)
  assert.deepEqual(application.database.read(), before)

  response = await request(base, cookie, `/admin/chores/${chore.id}`, 'DELETE')
  assert.equal(response.status, 409)
  assert.match((await response.json()).error, /pending submission/i)
  assert.deepEqual(application.database.read(), before)

  await application.service.reviewCompletion(completion.id, 'rejected')
  assert.equal((await request(base, cookie, `/admin/users/${user.id}`, 'DELETE')).status, 200)
  assert.equal((await request(base, cookie, `/admin/chores/${chore.id}`, 'DELETE')).status, 200)
})

test('individual creates preserve the collection size limits', async (t) => {
  const { application, base, cookie } = await fixture(t)
  const createdAt = new Date().toISOString()
  await application.database.transaction((data) => {
    data.users = Array.from({ length: 100 }, (_, index) => ({
      id: `user-${index}`,
      name: `User ${index}`,
      pinHash: '',
      disabled: false,
      checkoutEnabled: true,
      timeRemainingSeconds: 0,
      timeDate: '',
      createdAt,
    }))
    data.items = Array.from({ length: 250 }, (_, index) => ({
      id: `item-${index}`,
      name: `Item ${index}`,
      description: '',
      isTimed: false,
      disabled: false,
      assignedUserIds: [],
      createdAt,
    }))
    data.chores = Array.from({ length: 250 }, (_, index) => ({
      id: `chore-${index}`,
      title: `Chore ${index}`,
      description: '',
      rewardMinutes: 0,
      recurrence: 'daily',
      assignedUserIds: [],
      disabled: false,
      createdAt,
    }))
  })

  let response = await request(base, cookie, '/admin/users', 'POST', { name: 'One too many' })
  assert.equal(response.status, 409)
  assert.match((await response.json()).error, /maximum of 100 users/i)
  response = await request(base, cookie, '/admin/items', 'POST', { name: 'One too many' })
  assert.equal(response.status, 409)
  assert.match((await response.json()).error, /maximum of 250 items/i)
  response = await request(base, cookie, '/admin/chores', 'POST', {
    title: 'One too many', rewardMinutes: 0, recurrence: 'daily',
  })
  assert.equal(response.status, 409)
  assert.match((await response.json()).error, /maximum of 250 chores/i)
})
