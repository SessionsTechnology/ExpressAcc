import assert from 'node:assert/strict'
import { access, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { createDatabase } from '../server/database.js'
import { AppError, createService } from '../server/service.js'

test('legacy databases migrate credentials and retain a backup', async (t) => {
  const directory = await mkdtemp(join(tmpdir(), 'expressacc-legacy-'))
  t.after(() => rm(directory, { recursive: true, force: true }))
  const file = join(directory, 'db.json')
  await writeFile(file, JSON.stringify({
    adminSettings: { isSetup: true, applicationName: 'Legacy', password: 'old-password', timeSettings: [{ name: 'Monday', hours: 1, minutes: 30 }] },
    users: [{ id: 'u1', userName: 'Legacy User', userPin: '1234', timeLeft: 20 }],
    items: [], userItemAssociations: [],
  }))
  const database = await createDatabase(file)
  const data = database.read()
  assert.equal(data.meta.version, 2)
  assert.equal(data.settings.dailyTimeMinutes.Monday, 90)
  assert.equal(data.settings.passwordHash.includes('old-password'), false)
  assert.equal(data.users[0].pinHash.includes('1234'), false)
  await access(`${file}.bak`)
  const backup = JSON.parse(await readFile(`${file}.bak`, 'utf8'))
  assert.equal(backup.adminSettings.applicationName, 'Legacy')
})

async function fixture(t) {
  const directory = await mkdtemp(join(tmpdir(), 'expressacc-test-'))
  t.after(() => rm(directory, { recursive: true, force: true }))
  const database = await createDatabase(join(directory, 'db.json'))
  const service = createService(database)
  await service.setup({ applicationName: 'Test Center', password: 'password123', timeZone: 'UTC' })
  await service.updateSettings({
    applicationName: 'Test Center', timeZone: 'UTC', password: '',
    dailyTimeMinutes: { Sunday: 60, Monday: 60, Tuesday: 60, Wednesday: 60, Thursday: 60, Friday: 60, Saturday: 60 },
  })
  await service.saveUsers([{ name: 'Alex', pin: '1234' }])
  await service.saveItems([{ name: 'Console', description: 'A timed device', isTimed: true }])
  const admin = await service.getAdminState()
  return { database, service, user: admin.users[0], item: admin.items[0] }
}

test('public and admin state never disclose credential hashes', async (t) => {
  const { service } = await fixture(t)
  const publicState = await service.getPublicState()
  const adminState = await service.getAdminState()
  assert.equal(JSON.stringify(publicState).includes('pinHash'), false)
  assert.equal(JSON.stringify(adminState).includes('pinHash'), false)
  assert.equal(JSON.stringify(adminState).includes('passwordHash'), false)
  assert.equal(JSON.stringify(service.exportData()).includes('passwordHash'), false)
  assert.equal(JSON.stringify(service.exportData()).includes('sessionSecret'), false)
  assert.equal(await service.verifyAdmin('password123'), true)
})

test('invalid backups are rejected before current data is replaced', async (t) => {
  const { service } = await fixture(t)
  await assert.rejects(() => service.importData({ meta: { version: 2 }, settings: { applicationName: 'Broken' }, users: [{}], items: [] }), (error) => error.status === 400)
  assert.equal((await service.getAdminState()).settings.applicationName, 'Test Center')
})

test('timed checkouts use elapsed time and persist the remainder on check-in', async (t) => {
  const { database, service, user, item } = await fixture(t)
  await service.checkout(user.id, item.id)
  await database.transaction((data) => {
    data.checkouts[0].checkedOutAt = new Date(Date.now() - 10_000).toISOString()
  })
  const running = (await service.getPublicState()).users[0]
  assert.ok(running.timeRemainingSeconds <= 3590 && running.timeRemainingSeconds >= 3589)
  await service.checkin(user.id)
  const stopped = (await service.getPublicState()).users[0]
  assert.equal(stopped.checkout, null)
  assert.ok(stopped.timeRemainingSeconds <= 3590)
})

test('one item cannot be checked out twice', async (t) => {
  const { service, user, item } = await fixture(t)
  await service.saveUsers([{ id: user.id, name: 'Alex' }, { name: 'Sam' }])
  const users = (await service.getAdminState()).users
  await service.checkout(users[0].id, item.id)
  await assert.rejects(() => service.checkout(users[1].id, item.id), (error) => error instanceof AppError && error.status === 409)
})

test('approved chores add their reward to the user allowance once', async (t) => {
  const { service, user } = await fixture(t)
  await service.saveChores([{ title: 'Dishes', description: '', rewardMinutes: 15, recurrence: 'daily', assignedUserIds: [user.id] }])
  const chore = (await service.getAdminState()).chores[0]
  const before = (await service.getPublicState()).users[0].timeRemainingSeconds
  const completion = await service.completeChore(user.id, chore.id)
  await service.reviewCompletion(completion.id, 'approved')
  const after = (await service.getPublicState()).users[0].timeRemainingSeconds
  assert.equal(after, before + 900)
  await assert.rejects(() => service.reviewCompletion(completion.id, 'approved'), (error) => error.status === 404)
})
