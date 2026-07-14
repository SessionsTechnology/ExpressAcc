import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { createDatabase } from '../server/database.js'
import { createDemoController, nextDemoResetAt } from '../server/demo.js'
import { createService } from '../server/service.js'

test('demo reset boundaries align to the configured interval', () => {
  const fifteenMinutes = 15 * 60 * 1000
  assert.equal(nextDemoResetAt(0, fifteenMinutes), fifteenMinutes)
  assert.equal(nextDemoResetAt(fifteenMinutes - 1, fifteenMinutes), fifteenMinutes)
  assert.equal(nextDemoResetAt(fifteenMinutes, fifteenMinutes), fifteenMinutes * 2)
})

test('demo mode seeds a usable walkthrough and restores it on schedule', async (t) => {
  const directory = await mkdtemp(join(tmpdir(), 'routioneer-demo-'))
  t.after(() => rm(directory, { recursive: true, force: true }))
  const database = await createDatabase(join(directory, 'db.json'))
  let clock = Date.UTC(2026, 6, 14, 12, 7, 0)
  let scheduled
  let resetNotifications = 0
  const controller = await createDemoController({
    database,
    resetMinutes: 15,
    adminPassword: 'test-demo-password',
    timeZone: 'UTC',
    now: () => clock,
    setTimer: (callback, delay) => {
      scheduled = { callback, delay }
      return { unref() {} }
    },
    clearTimer: () => {},
  })
  t.after(() => controller.close())
  const service = createService(database)

  assert.equal(service.status().applicationName, 'Routioneer Demo')
  assert.equal(await service.verifyAdmin('test-demo-password'), true)
  const seeded = await service.getAdminState()
  assert.deepEqual(seeded.users.map((user) => user.name), ['Alex', 'Jordan', 'Riley'])
  assert.equal(seeded.users.find((user) => user.name === 'Alex').checkout.item.name, 'Game console')
  const pending = seeded.completions.filter((completion) => completion.status === 'pending')
  assert.equal(pending.length, 1)
  assert.equal(pending[0].choreTitle, 'Unload the dishwasher')
  assert.equal(pending[0].userName, 'Jordan')
  assert.equal(pending[0].submittedAt, '2026-07-14T12:07:00.000Z')

  controller.start(() => { resetNotifications += 1 })
  assert.equal(scheduled.delay, 8 * 60 * 1000)
  assert.equal(controller.status().nextResetAt, '2026-07-14T12:15:00.000Z')

  await service.updateSettings({ applicationName: 'Changed by a visitor' })
  await service.createUser({ name: 'Temporary visitor' })
  assert.equal((await service.getAdminState()).users.length, 4)

  clock += scheduled.delay
  await scheduled.callback()

  assert.equal(resetNotifications, 1)
  assert.equal(service.status().applicationName, 'Routioneer Demo')
  assert.deepEqual((await service.getAdminState()).users.map((user) => user.name), ['Alex', 'Jordan', 'Riley'])
  assert.equal(controller.status().nextResetAt, '2026-07-14T12:30:00.000Z')
})

test('demo configuration rejects unsafe passwords and reset intervals', async (t) => {
  const directory = await mkdtemp(join(tmpdir(), 'routioneer-demo-config-'))
  t.after(() => rm(directory, { recursive: true, force: true }))
  const database = await createDatabase(join(directory, 'db.json'))

  await assert.rejects(
    () => createDemoController({ database, resetMinutes: 0 }),
    /whole number between 1 and 1440/,
  )
  await assert.rejects(
    () => createDemoController({ database, adminPassword: 'short' }),
    /at least 8 characters/,
  )
})
