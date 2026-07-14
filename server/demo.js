import { randomUUID } from 'node:crypto'
import { emptyDatabase, weekdays } from './database.js'
import { hashSecret } from './auth.js'

export const DEFAULT_DEMO_ADMIN_PASSWORD = 'demo-admin'
export const DEFAULT_DEMO_RESET_MINUTES = 15

function parseResetMinutes(value) {
  const minutes = Number(value ?? DEFAULT_DEMO_RESET_MINUTES)
  if (!Number.isInteger(minutes) || minutes < 1 || minutes > 1440) {
    throw new Error('DEMO_RESET_MINUTES must be a whole number between 1 and 1440.')
  }
  return minutes
}

function localDateKey(date, timeZone) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)
  const get = (type) => parts.find((part) => part.type === type)?.value
  return `${get('year')}-${get('month')}-${get('day')}`
}

export function nextDemoResetAt(nowMilliseconds, intervalMilliseconds) {
  return Math.floor(nowMilliseconds / intervalMilliseconds + 1) * intervalMilliseconds
}

export async function createDemoData({
  adminPassword = DEFAULT_DEMO_ADMIN_PASSWORD,
  resetMinutes = DEFAULT_DEMO_RESET_MINUTES,
  timeZone = process.env.TZ || 'UTC',
  now = new Date(),
} = {}) {
  if (String(adminPassword).length < 8) throw new Error('DEMO_ADMIN_PASSWORD must contain at least 8 characters.')

  const data = emptyDatabase()
  const nowIso = now.toISOString()
  const today = localDateKey(now, timeZone)
  data.meta.createdAt = nowIso
  data.meta.updatedAt = nowIso
  data.settings = {
    ...data.settings,
    isSetup: true,
    applicationName: 'Routioneer Demo',
    passwordHash: await hashSecret(adminPassword),
    timeZone,
    kioskMessage: `Explore freely—this demo restores its sample data every ${resetMinutes} minutes.`,
    kioskTimeoutSeconds: 90,
    dailyTimeMinutes: Object.fromEntries(weekdays.map((day) => [day, 90])),
  }
  data.users = [
    {
      id: 'demo-user-alex',
      name: 'Alex',
      pinHash: '',
      disabled: false,
      checkoutEnabled: true,
      timeRemainingSeconds: 75 * 60,
      timeDate: today,
      createdAt: nowIso,
    },
    {
      id: 'demo-user-jordan',
      name: 'Jordan',
      pinHash: '',
      disabled: false,
      checkoutEnabled: true,
      timeRemainingSeconds: 90 * 60,
      timeDate: today,
      createdAt: nowIso,
    },
    {
      id: 'demo-user-riley',
      name: 'Riley',
      pinHash: '',
      disabled: false,
      checkoutEnabled: false,
      timeRemainingSeconds: 0,
      timeDate: today,
      createdAt: nowIso,
    },
  ]
  data.items = [
    {
      id: 'demo-item-console',
      name: 'Game console',
      description: 'A timed shared device',
      isTimed: true,
      disabled: false,
      assignedUserIds: ['demo-user-alex', 'demo-user-jordan'],
      createdAt: nowIso,
    },
    {
      id: 'demo-item-tablet',
      name: 'Family tablet',
      description: 'Available to any checkout-enabled profile',
      isTimed: true,
      disabled: false,
      assignedUserIds: [],
      createdAt: nowIso,
    },
    {
      id: 'demo-item-board-game',
      name: 'Board game',
      description: 'An untimed shared item',
      isTimed: false,
      disabled: false,
      assignedUserIds: [],
      createdAt: nowIso,
    },
  ]
  data.checkouts = [{
    id: 'demo-checkout-alex',
    userId: 'demo-user-alex',
    itemId: 'demo-item-console',
    checkedOutAt: nowIso,
    remainingAtCheckout: 75 * 60,
  }]
  data.chores = [
    {
      id: 'demo-chore-laundry',
      title: 'Put laundry away',
      description: 'Fold and put away the clean laundry.',
      rewardMinutes: 10,
      recurrence: 'daily',
      assignedUserIds: ['demo-user-alex'],
      disabled: false,
      createdAt: nowIso,
    },
    {
      id: 'demo-chore-dishwasher',
      title: 'Unload the dishwasher',
      description: 'Put the clean dishes back in their cabinets.',
      rewardMinutes: 15,
      recurrence: 'daily',
      assignedUserIds: ['demo-user-jordan'],
      disabled: false,
      createdAt: nowIso,
    },
    {
      id: 'demo-chore-recycling',
      title: 'Take out the recycling',
      description: 'Move the recycling bin to the collection point.',
      rewardMinutes: 0,
      recurrence: 'weekly',
      assignedUserIds: ['demo-user-riley'],
      disabled: false,
      createdAt: nowIso,
    },
  ]
  data.choreCompletions = [
    {
      id: 'demo-completion-laundry',
      userId: 'demo-user-alex',
      choreId: 'demo-chore-laundry',
      periodKey: today,
      status: 'approved',
      rewardGrantedSeconds: 10 * 60,
      submittedAt: nowIso,
      reviewedAt: nowIso,
    },
    {
      id: 'demo-completion-dishwasher',
      userId: 'demo-user-jordan',
      choreId: 'demo-chore-dishwasher',
      periodKey: today,
      status: 'pending',
      rewardGrantedSeconds: 0,
      submittedAt: nowIso,
      reviewedAt: null,
    },
  ]
  data.activity = [
    {
      id: randomUUID(),
      type: 'chores',
      message: 'Chore submitted: Unload the dishwasher',
      details: { userId: 'demo-user-jordan', choreId: 'demo-chore-dishwasher' },
      createdAt: nowIso,
    },
    {
      id: randomUUID(),
      type: 'checkout',
      message: 'Alex checked out Game console',
      details: { userId: 'demo-user-alex', itemId: 'demo-item-console' },
      createdAt: nowIso,
    },
  ]
  return data
}

export async function createDemoController({
  database,
  resetMinutes = process.env.DEMO_RESET_MINUTES,
  adminPassword = process.env.DEMO_ADMIN_PASSWORD || DEFAULT_DEMO_ADMIN_PASSWORD,
  timeZone = process.env.TZ || 'UTC',
  now = () => Date.now(),
  setTimer = setTimeout,
  clearTimer = clearTimeout,
} = {}) {
  if (!database) throw new Error('A database is required for demo mode.')
  const intervalMinutes = parseResetMinutes(resetMinutes)
  const intervalMilliseconds = intervalMinutes * 60 * 1000
  let nextResetMilliseconds = null
  let timer = null
  let stopped = false
  let onReset = () => {}

  const reset = async () => {
    const resetTime = new Date(now())
    await database.replace(await createDemoData({ adminPassword, resetMinutes: intervalMinutes, timeZone, now: resetTime }))
  }

  const scheduleNext = () => {
    if (stopped) return
    const currentMilliseconds = now()
    nextResetMilliseconds = nextDemoResetAt(currentMilliseconds, intervalMilliseconds)
    timer = setTimer(async () => {
      let resetSucceeded = false
      try {
        await reset()
        resetSucceeded = true
      } catch (error) {
        console.error('Unable to reset Routioneer demo data', error)
      } finally {
        scheduleNext()
      }
      if (resetSucceeded) await onReset()
    }, Math.max(0, nextResetMilliseconds - currentMilliseconds))
    timer?.unref?.()
  }

  await reset()

  return {
    reset,
    start(callback = () => {}) {
      onReset = callback
      stopped = false
      if (timer) clearTimer(timer)
      scheduleNext()
    },
    status() {
      return {
        enabled: true,
        adminPassword,
        resetIntervalMinutes: intervalMinutes,
        nextResetAt: nextResetMilliseconds ? new Date(nextResetMilliseconds).toISOString() : null,
      }
    },
    close() {
      stopped = true
      if (timer) clearTimer(timer)
      timer = null
    },
  }
}
