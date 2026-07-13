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

test('kiosk settings default safely and are exposed to the appropriate screens', async (t) => {
  const { service } = await fixture(t)
  const before = await service.getAdminState()
  assert.equal(before.settings.kioskMessage, '')
  assert.equal(before.settings.kioskTimeoutSeconds, 30)

  await service.updateSettings({
    ...before.settings,
    password: '',
    kioskMessage: 'Please finish your chores before screen time.',
    kioskTimeoutSeconds: 45,
  })
  const publicState = await service.getPublicState()
  assert.equal(publicState.kioskMessage, 'Please finish your chores before screen time.')
  assert.equal(service.status().kioskTimeoutSeconds, 45)
  assert.equal((await service.getAdminState()).settings.kioskTimeoutSeconds, 45)
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

test('admins can set an exact allowance and reset it to today’s default', async (t) => {
  const { database, service, user, item } = await fixture(t)
  await service.checkout(user.id, item.id)

  const overridden = await service.setTime(user.id, 1234)
  assert.equal(overridden.timeRemainingSeconds, 1234)
  assert.equal(database.read().checkouts[0].remainingAtCheckout, 1234)

  const reset = await service.resetTime(user.id)
  assert.equal(reset.timeRemainingSeconds, 3600)
  assert.equal(database.read().checkouts[0].remainingAtCheckout, 3600)
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

test('users can undo pending chore submissions but not approved ones', async (t) => {
  const { service, user } = await fixture(t)
  await service.saveChores([{ title: 'Dishes', description: '', rewardMinutes: 15, recurrence: 'daily', assignedUserIds: [user.id] }])
  const chore = (await service.getAdminState()).chores[0]
  await service.completeChore(user.id, chore.id)
  assert.equal((await service.getUserState(user.id)).chores[0].completionStatus, 'pending')

  assert.deepEqual(await service.undoChoreSubmission(user.id, chore.id), { undone: true })
  assert.equal((await service.getUserState(user.id)).chores[0].completionStatus, null)
  const resubmitted = await service.completeChore(user.id, chore.id)
  await service.reviewCompletion(resubmitted.id, 'approved')
  await assert.rejects(
    () => service.undoChoreSubmission(user.id, chore.id),
    (error) => error instanceof AppError && error.status === 409 && error.message.includes('cannot be undone'),
  )
})

test('resetting an approved chore reverses its current-day reward and permits resubmission', async (t) => {
  const { service, user } = await fixture(t)
  await service.saveChores([{ title: 'Dishes', description: '', rewardMinutes: 15, recurrence: 'daily', assignedUserIds: [user.id] }])
  const chore = (await service.getAdminState()).chores[0]
  const before = (await service.getPublicState()).users[0].timeRemainingSeconds
  const completion = await service.completeChore(user.id, chore.id)
  const approved = await service.reviewCompletion(completion.id, 'approved')

  assert.equal(approved.rewardGrantedSeconds, 900)
  assert.equal((await service.getPublicState()).users[0].timeRemainingSeconds, before + 900)

  const result = await service.resetCompletion(completion.id)
  assert.deepEqual(result, { reset: true, reversedSeconds: 900 })
  assert.equal((await service.getPublicState()).users[0].timeRemainingSeconds, before)
  assert.equal((await service.getUserState(user.id)).chores[0].completionStatus, null)
  assert.equal((await service.completeChore(user.id, chore.id)).status, 'pending')
})

test('assigned zero-minute chores require approval before any item can be checked out', async (t) => {
  const { service, user, item } = await fixture(t)
  await service.saveItems([{ id: item.id, name: item.name, description: item.description, isTimed: false }])
  await service.saveChores([{ title: 'Make the bed', description: '', rewardMinutes: 0, recurrence: 'daily', assignedUserIds: [user.id] }])
  const userState = await service.getUserState(user.id)
  const chore = userState.chores[0]

  assert.equal(chore.requiredForCheckout, true)
  assert.equal(userState.checkoutBlocked, true)
  await assert.rejects(
    () => service.checkout(user.id, item.id),
    (error) => error instanceof AppError && error.status === 409 && error.message.includes('Make the bed'),
  )

  const completion = await service.completeChore(user.id, chore.id)
  assert.equal((await service.getUserState(user.id)).checkoutBlocked, true)
  await assert.rejects(() => service.checkout(user.id, item.id), (error) => error instanceof AppError && error.status === 409)

  await service.reviewCompletion(completion.id, 'approved')
  assert.equal((await service.getUserState(user.id)).checkoutBlocked, false)
  await service.checkout(user.id, item.id)
  assert.equal((await service.getPublicState()).users[0].checkout.item.id, item.id)
})

test('zero-minute chores only block users who are specifically assigned', async (t) => {
  const { service, user, item } = await fixture(t)
  await service.saveUsers([{ id: user.id, name: 'Alex' }, { name: 'Sam' }])
  const users = (await service.getAdminState()).users
  await service.saveChores([
    { title: 'Alex task', description: '', rewardMinutes: 0, recurrence: 'daily', assignedUserIds: [users[0].id] },
    { title: 'Optional for everyone', description: '', rewardMinutes: 0, recurrence: 'daily', assignedUserIds: [] },
  ])

  assert.equal((await service.getUserState(users[1].id)).checkoutBlocked, false)
  await service.checkout(users[1].id, item.id)
})

test('items assigned to specific users are only visible and usable by those users', async (t) => {
  const { service, user, item } = await fixture(t)
  await service.saveUsers([{ id: user.id, name: 'Alex' }, { name: 'Sam' }])
  const users = (await service.getAdminState()).users
  await service.saveItems([{
    id: item.id,
    name: item.name,
    description: item.description,
    isTimed: item.isTimed,
    assignedUserIds: [users[0].id],
  }])

  assert.deepEqual((await service.getUserState(users[0].id)).availableItems.map((entry) => entry.id), [item.id])
  assert.deepEqual((await service.getUserState(users[1].id)).availableItems, [])
  await assert.rejects(
    () => service.checkout(users[1].id, item.id),
    (error) => error instanceof AppError && error.status === 403 && error.message.includes('not assigned'),
  )
  await service.checkout(users[0].id, item.id)
})

test('chore-only users have no checkout timer or available items and cannot check out', async (t) => {
  const { service, user, item } = await fixture(t)
  await service.saveUsers([{ id: user.id, name: user.name, checkoutEnabled: false }])
  await service.saveChores([{ title: 'Feed the dog', description: '', rewardMinutes: 0, recurrence: 'daily', assignedUserIds: [user.id] }])

  const userState = await service.getUserState(user.id)
  assert.equal(userState.user.checkoutEnabled, false)
  assert.deepEqual(userState.availableItems, [])
  assert.equal(userState.chores[0].title, 'Feed the dog')
  await assert.rejects(
    () => service.checkout(user.id, item.id),
    (error) => error instanceof AppError && error.status === 403 && error.message.includes('not enabled'),
  )

  const kiosk = await service.getPublicState()
  assert.equal(kiosk.users[0].checkoutEnabled, false)
  assert.equal(kiosk.users[0].assignedChoreCount, 1)
  assert.equal(kiosk.chores[0].assignees[0].name, user.name)
  assert.deepEqual(kiosk.chores[0].assignedUserIds, [user.id])

  const completion = await service.completeChore(user.id, kiosk.chores[0].id)
  assert.equal((await service.getPublicState()).users[0].assignedChoreCount, 1)
  await service.reviewCompletion(completion.id, 'approved')
  const approvedKiosk = await service.getPublicState()
  assert.equal(approvedKiosk.users[0].assignedChoreCount, 0)
  assert.deepEqual(approvedKiosk.chores, [])
})

test('the kiosk only shows users who still need approval for a shared chore', async (t) => {
  const { service, user } = await fixture(t)
  await service.saveUsers([{ id: user.id, name: 'Alex' }, { name: 'Sam' }])
  const users = (await service.getAdminState()).users
  await service.saveChores([{ title: 'Clear the table', description: '', rewardMinutes: 5, recurrence: 'daily', assignedUserIds: [] }])
  const chore = (await service.getAdminState()).chores[0]

  const alexCompletion = await service.completeChore(users[0].id, chore.id)
  await service.reviewCompletion(alexCompletion.id, 'approved')
  const partiallyComplete = await service.getPublicState()
  assert.equal(partiallyComplete.users[0].assignedChoreCount, 0)
  assert.equal(partiallyComplete.users[1].assignedChoreCount, 1)
  assert.equal(partiallyComplete.chores[0].assignedToEveryone, false)
  assert.deepEqual(partiallyComplete.chores[0].assignees.map((assignee) => assignee.name), ['Sam'])

  const samCompletion = await service.completeChore(users[1].id, chore.id)
  await service.reviewCompletion(samCompletion.id, 'approved')
  assert.deepEqual((await service.getPublicState()).chores, [])
})

test('checkout access cannot be removed while a user has an item out', async (t) => {
  const { service, user, item } = await fixture(t)
  await service.checkout(user.id, item.id)
  await assert.rejects(
    () => service.saveUsers([{ id: user.id, name: user.name, checkoutEnabled: false }]),
    (error) => error instanceof AppError && error.status === 409 && error.message.includes('check in'),
  )
})
