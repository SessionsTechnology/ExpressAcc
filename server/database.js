import { randomBytes, randomUUID } from 'node:crypto'
import { access, copyFile, mkdir } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { JSONFilePreset } from 'lowdb/node'
import { hashSecret } from './auth.js'

const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export function emptyDatabase() {
  const now = new Date().toISOString()
  return {
    meta: { version: 2, createdAt: now, updatedAt: now },
    settings: {
      isSetup: false,
      applicationName: 'ExpressACC',
      passwordHash: '',
      sessionSecret: randomBytes(32).toString('base64url'),
      timeZone: process.env.TZ || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
      darkMode: false,
      kioskMessage: '',
      kioskTimeoutSeconds: 30,
      dailyTimeMinutes: Object.fromEntries(weekdays.map((day) => [day, 0])),
    },
    users: [],
    items: [],
    checkouts: [],
    chores: [],
    choreCompletions: [],
    activity: [],
  }
}

function asNumber(value, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function currentLocalDate(timeZone) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'long' }).formatToParts(new Date())
  const get = (type) => parts.find((part) => part.type === type)?.value
  return { key: `${get('year')}-${get('month')}-${get('day')}`, weekday: get('weekday') }
}

async function migrate(data) {
  if (!data) return emptyDatabase()
  if (data.meta?.version === 2) {
    const defaults = emptyDatabase()
    return {
      ...defaults,
      ...data,
      meta: { ...defaults.meta, ...data.meta, version: 2 },
      settings: {
        ...defaults.settings,
        ...data.settings,
        darkMode: data.settings?.darkMode === true,
        dailyTimeMinutes: { ...defaults.settings.dailyTimeMinutes, ...data.settings?.dailyTimeMinutes },
        sessionSecret: data.settings?.sessionSecret || defaults.settings.sessionSecret,
      },
      users: Array.isArray(data.users) ? data.users.map((user) => ({
        ...user,
        checkoutEnabled: user.checkoutEnabled !== false,
      })) : [],
      items: Array.isArray(data.items) ? data.items.map((item) => ({
        ...item,
        assignedUserIds: Array.isArray(item.assignedUserIds) ? item.assignedUserIds : [],
      })) : [],
      checkouts: Array.isArray(data.checkouts) ? data.checkouts : [],
      chores: Array.isArray(data.chores) ? data.chores.map((chore) => ({
        ...chore,
        assignedUserIds: Array.isArray(chore.assignedUserIds) ? chore.assignedUserIds : [],
      })) : [],
      choreCompletions: Array.isArray(data.choreCompletions) ? data.choreCompletions : [],
      activity: Array.isArray(data.activity) ? data.activity : [],
    }
  }
  const legacySettings = data.adminSettings || {}
  const next = emptyDatabase()
  next.settings.isSetup = Boolean(legacySettings.isSetup)
  next.settings.applicationName = legacySettings.applicationName || 'ExpressACC'
  next.settings.dailyTimeMinutes = Object.fromEntries(weekdays.map((day) => {
    const legacy = legacySettings.timeSettings?.find((entry) => entry.name === day)
    return [day, asNumber(legacy?.hours) * 60 + asNumber(legacy?.minutes)]
  }))
  if (legacySettings.password) next.settings.passwordHash = await hashSecret(legacySettings.password)
  const today = currentLocalDate(next.settings.timeZone)
  next.users = await Promise.all((data.users || []).map(async (user) => ({
    id: String(user.id || randomUUID()),
    name: String(user.userName || 'User'),
    pinHash: user.userPin ? await hashSecret(String(user.userPin)) : '',
    disabled: Boolean(user.disabled),
    checkoutEnabled: true,
    timeRemainingSeconds: Math.max(0, asNumber(user.timeLeft)),
    timeDate: user.dayLastCheckedOut === today.weekday ? today.key : '',
    createdAt: new Date().toISOString(),
  })))
  next.items = (data.items || []).map((item) => ({
    id: String(item.id || randomUUID()),
    name: String(item.itemName || 'Item'),
    description: String(item.description || ''),
    isTimed: Boolean(item.isTimed),
    disabled: Boolean(item.disabled),
    assignedUserIds: [],
    createdAt: new Date().toISOString(),
  }))
  next.checkouts = (data.userItemAssociations || []).flatMap((association) => {
    const user = next.users.find((entry) => entry.id === String(association.userId))
    const item = next.items.find((entry) => entry.id === String(association.itemId))
    if (!user || !item) return []
    return [{
      id: String(association.id || association.associationId || randomUUID()),
      userId: user.id,
      itemId: item.id,
      checkedOutAt: new Date().toISOString(),
      remainingAtCheckout: user.timeRemainingSeconds,
    }]
  })
  return next
}

export async function createDatabase(databaseFile = process.env.DATABASE_FILE || join(process.cwd(), 'lowdb', 'db.json')) {
  await mkdir(dirname(databaseFile), { recursive: true })
  let existingFile = true
  try { await access(databaseFile) } catch { existingFile = false }
  const db = await JSONFilePreset(databaseFile, emptyDatabase())
  const migrated = await migrate(db.data)
  if (JSON.stringify(migrated) !== JSON.stringify(db.data)) {
    if (existingFile) await copyFile(databaseFile, `${databaseFile}.bak`)
    db.data = migrated
    await db.write()
  }

  let queue = Promise.resolve()
  return {
    file: databaseFile,
    read: () => db.data,
    backup: () => copyFile(databaseFile, `${databaseFile}.bak`),
    transaction(operation) {
      const run = queue.then(async () => {
        const result = await operation(db.data)
        db.data.meta.updatedAt = new Date().toISOString()
        await db.write()
        return result
      })
      queue = run.catch(() => {})
      return run
    },
    async replace(nextData) {
      return this.transaction(async () => {
        const migratedData = await migrate(structuredClone(nextData))
        db.data = migratedData
        return db.data
      })
    },
  }
}

export { weekdays }
