import { randomUUID } from 'node:crypto'
import { hashSecret, verifySecret } from './auth.js'
import { emptyDatabase, weekdays } from './database.js'

export class AppError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
  }
}

function localDate(date, timeZone) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'long',
  }).formatToParts(date)
  const get = (type) => parts.find((part) => part.type === type)?.value
  return { key: `${get('year')}-${get('month')}-${get('day')}`, weekday: get('weekday') }
}

function weekKey(dayKey) {
  const date = new Date(`${dayKey}T12:00:00Z`)
  const day = date.getUTCDay() || 7
  date.setUTCDate(date.getUTCDate() - day + 1)
  return date.toISOString().slice(0, 10)
}

function log(data, type, message, details = {}) {
  data.activity.unshift({ id: randomUUID(), type, message, details, createdAt: new Date().toISOString() })
  data.activity = data.activity.slice(0, 500)
}

function publicUser(user, data, now = new Date()) {
  const checkout = data.checkouts.find((entry) => entry.userId === user.id)
  const item = checkout && data.items.find((entry) => entry.id === checkout.itemId)
  let seconds = user.timeRemainingSeconds
  if (checkout && item?.isTimed) {
    seconds = Math.max(0, checkout.remainingAtCheckout - Math.floor((now - new Date(checkout.checkedOutAt)) / 1000))
  }
  return {
    id: user.id,
    name: user.name,
    hasPin: Boolean(user.pinHash),
    disabled: user.disabled,
    checkoutEnabled: user.checkoutEnabled !== false,
    timeRemainingSeconds: seconds,
    checkout: checkout && item ? {
      id: checkout.id,
      checkedOutAt: checkout.checkedOutAt,
      item: { id: item.id, name: item.name, description: item.description, isTimed: item.isTimed },
    } : null,
  }
}

function resetDayIfNeeded(data, now = new Date()) {
  const today = localDate(now, data.settings.timeZone)
  let changed = false
  for (const user of data.users) {
    if (user.timeDate === today.key) continue
    user.timeDate = today.key
    user.timeRemainingSeconds = Math.max(0, Number(data.settings.dailyTimeMinutes[today.weekday] || 0) * 60)
    const checkout = data.checkouts.find((entry) => entry.userId === user.id)
    const item = checkout && data.items.find((entry) => entry.id === checkout.itemId)
    if (checkout && item?.isTimed) {
      checkout.checkedOutAt = now.toISOString()
      checkout.remainingAtCheckout = user.timeRemainingSeconds
    }
    changed = true
  }
  return changed
}

function defaultTimeSeconds(data, now = new Date()) {
  const today = localDate(now, data.settings.timeZone)
  return Math.max(0, Number(data.settings.dailyTimeMinutes[today.weekday] || 0) * 60)
}

function reconcileUser(data, user, now = new Date()) {
  const checkout = data.checkouts.find((entry) => entry.userId === user.id)
  const item = checkout && data.items.find((entry) => entry.id === checkout.itemId)
  if (checkout && item?.isTimed) {
    user.timeRemainingSeconds = Math.max(0, checkout.remainingAtCheckout - Math.floor((now - new Date(checkout.checkedOutAt)) / 1000))
    checkout.remainingAtCheckout = user.timeRemainingSeconds
    checkout.checkedOutAt = now.toISOString()
  }
}

function chorePeriod(chore, dayKey) {
  if (chore.recurrence === 'daily') return dayKey
  if (chore.recurrence === 'weekly') return weekKey(dayKey)
  return 'once'
}

function isCheckoutRequirement(chore, userId) {
  return !chore.disabled && Number(chore.rewardMinutes) === 0 && chore.assignedUserIds.includes(userId)
}

function choreCompletion(data, userId, chore, dayKey) {
  const periodKey = chorePeriod(chore, dayKey)
  return data.choreCompletions.find((entry) => entry.userId === userId && entry.choreId === chore.id && entry.periodKey === periodKey && entry.status !== 'rejected')
}

function requiredChoreBlockers(data, userId, dayKey) {
  return data.chores.filter((chore) => isCheckoutRequirement(chore, userId) && choreCompletion(data, userId, chore, dayKey)?.status !== 'approved')
}

function sanitizedSettings(settings) {
  return {
    isSetup: settings.isSetup,
    applicationName: settings.applicationName,
    timeZone: settings.timeZone,
    darkMode: settings.darkMode,
    kioskMessage: settings.kioskMessage,
    kioskTimeoutSeconds: settings.kioskTimeoutSeconds,
    dailyTimeMinutes: settings.dailyTimeMinutes,
  }
}

function validateBackup(input) {
  if (!input || typeof input !== 'object' || (!input.settings && !input.adminSettings)) throw new AppError(400, 'This does not look like an ExpressACC backup.')
  if (input.meta?.version === 2) {
    if (typeof input.settings?.applicationName !== 'string') throw new AppError(400, 'The backup has invalid settings.')
    const validUsers = Array.isArray(input.users) && input.users.every((user) => typeof user.id === 'string' && typeof user.name === 'string')
    const validItems = Array.isArray(input.items) && input.items.every((item) => typeof item.id === 'string' && typeof item.name === 'string')
    const validCollections = ['checkouts', 'chores', 'choreCompletions', 'activity'].every((key) => input[key] === undefined || Array.isArray(input[key]))
    if (!validUsers || !validItems || !validCollections) throw new AppError(400, 'The backup contains invalid application data.')
  }
}

export function createService(database) {
  const state = () => database.read()

  async function ensureDailyReset() {
    const data = state()
    if (resetDayIfNeeded(data)) await database.transaction(() => {})
  }

  async function getPublicState() {
    await ensureDailyReset()
    const data = state()
    const activeUsers = data.users.filter((user) => !user.disabled)
    const today = localDate(new Date(), data.settings.timeZone)
    const outstandingChores = data.chores.filter((chore) => !chore.disabled).map((chore) => {
      const assignedUsers = activeUsers.filter((user) => chore.assignedUserIds.length === 0 || chore.assignedUserIds.includes(user.id))
      const assignees = assignedUsers
        .filter((user) => choreCompletion(data, user.id, chore, today.key)?.status !== 'approved')
        .map((user) => ({ id: user.id, name: user.name }))
      return {
        id: chore.id,
        title: chore.title,
        description: chore.description,
        recurrence: chore.recurrence,
        rewardMinutes: chore.rewardMinutes,
        assignedToEveryone: chore.assignedUserIds.length === 0 && assignees.length === activeUsers.length,
        assignedUserIds: chore.assignedUserIds,
        assignees,
      }
    }).filter((chore) => chore.assignees.length > 0)
    return {
      applicationName: data.settings.applicationName,
      kioskMessage: data.settings.kioskMessage,
      users: activeUsers.map((user) => ({
        ...publicUser(user, data),
        assignedChoreCount: outstandingChores.filter((chore) => chore.assignees.some((assignee) => assignee.id === user.id)).length,
      })),
      chores: outstandingChores,
    }
  }

  return {
    get settings() { return state().settings },

    status() {
      const settings = state().settings
      return {
        isSetup: settings.isSetup,
        applicationName: settings.applicationName,
        timeZone: settings.timeZone,
        darkMode: settings.darkMode,
        kioskTimeoutSeconds: settings.kioskTimeoutSeconds,
      }
    },

    async setup(input) {
      if (state().settings.isSetup) throw new AppError(409, 'Setup has already been completed.')
      const passwordHash = await hashSecret(input.password)
      return database.transaction((data) => {
        data.settings = { ...data.settings, ...input, password: undefined, passwordHash, isSetup: true }
        log(data, 'setup', 'Application setup completed')
        return this.status()
      })
    },

    verifyAdmin(password) {
      return verifySecret(password, state().settings.passwordHash)
    },

    async getPublicState() {
      return getPublicState()
    },

    async getAdminState() {
      await ensureDailyReset()
      const data = state()
      return {
        settings: sanitizedSettings(data.settings),
        users: data.users.map((user) => ({ ...publicUser(user, data), createdAt: user.createdAt })),
        items: data.items.map((item) => ({ ...item })),
        chores: data.chores.map((chore) => ({ ...chore })),
        completions: data.choreCompletions.slice(0, 200).map((completion) => ({
          ...completion,
          userName: data.users.find((user) => user.id === completion.userId)?.name || 'Deleted user',
          choreTitle: data.chores.find((chore) => chore.id === completion.choreId)?.title || 'Deleted chore',
        })),
        activity: data.activity.slice(0, 100),
      }
    },

    async updateSettings(input) {
      let passwordHash
      if (input.password) passwordHash = await hashSecret(input.password)
      return database.transaction((data) => {
        data.settings.applicationName = input.applicationName
        data.settings.timeZone = input.timeZone
        if (input.darkMode !== undefined) data.settings.darkMode = Boolean(input.darkMode)
        if (input.kioskMessage !== undefined) data.settings.kioskMessage = input.kioskMessage.trim()
        if (input.kioskTimeoutSeconds !== undefined) data.settings.kioskTimeoutSeconds = Number(input.kioskTimeoutSeconds)
        data.settings.dailyTimeMinutes = Object.fromEntries(weekdays.map((day) => [day, Number(input.dailyTimeMinutes[day] || 0)]))
        if (passwordHash) data.settings.passwordHash = passwordHash
        log(data, 'settings', 'Application settings updated')
        return sanitizedSettings(data.settings)
      })
    },

    async saveUsers(users) {
      const prepared = await Promise.all(users.map(async (user) => ({ ...user, nextPinHash: user.pin ? await hashSecret(user.pin) : undefined })))
      return database.transaction((data) => {
        const ids = new Set(prepared.map((user) => user.id).filter(Boolean))
        for (const old of data.users.filter((user) => !ids.has(user.id))) {
          if (data.checkouts.some((checkout) => checkout.userId === old.id)) throw new AppError(409, `${old.name} must check in before being deleted.`)
        }
        for (const input of prepared) {
          const existing = data.users.find((user) => user.id === input.id)
          if (existing && input.checkoutEnabled === false && data.checkouts.some((checkout) => checkout.userId === existing.id)) {
            throw new AppError(409, `${existing.name} must check in before checkout access can be turned off.`)
          }
        }
        data.users = prepared.map((input) => {
          const existing = data.users.find((user) => user.id === input.id)
          return {
            id: input.id || randomUUID(),
            name: input.name.trim(),
            pinHash: input.clearPin ? '' : input.nextPinHash || existing?.pinHash || '',
            disabled: Boolean(input.disabled),
            checkoutEnabled: input.checkoutEnabled ?? existing?.checkoutEnabled ?? true,
            timeRemainingSeconds: existing?.timeRemainingSeconds || 0,
            timeDate: existing?.timeDate || '',
            createdAt: existing?.createdAt || new Date().toISOString(),
          }
        })
        log(data, 'users', 'User list updated', { count: data.users.length })
        return data.users.map((user) => ({ id: user.id, name: user.name, hasPin: Boolean(user.pinHash), disabled: user.disabled, checkoutEnabled: user.checkoutEnabled }))
      })
    },

    async saveItems(items) {
      return database.transaction((data) => {
        const ids = new Set(items.map((item) => item.id).filter(Boolean))
        for (const old of data.items.filter((item) => !ids.has(item.id))) {
          if (data.checkouts.some((checkout) => checkout.itemId === old.id)) throw new AppError(409, `${old.name} must be checked in before being deleted.`)
        }
        data.items = items.map((input) => {
          const existing = data.items.find((item) => item.id === input.id)
          return {
            id: input.id || randomUUID(),
            name: input.name.trim(),
            description: input.description?.trim() || '',
            isTimed: Boolean(input.isTimed),
            disabled: Boolean(input.disabled),
            assignedUserIds: input.assignedUserIds ?? existing?.assignedUserIds ?? [],
            createdAt: existing?.createdAt || new Date().toISOString(),
          }
        })
        log(data, 'items', 'Item list updated', { count: data.items.length })
        return data.items
      })
    },

    async saveChores(chores) {
      return database.transaction((data) => {
        data.chores = chores.map((input) => {
          const existing = data.chores.find((chore) => chore.id === input.id)
          return {
            id: input.id || randomUUID(),
            title: input.title.trim(),
            description: input.description?.trim() || '',
            rewardMinutes: Number(input.rewardMinutes || 0),
            recurrence: input.recurrence,
            assignedUserIds: input.assignedUserIds || [],
            disabled: Boolean(input.disabled),
            createdAt: existing?.createdAt || new Date().toISOString(),
          }
        })
        log(data, 'chores', 'Chore list updated', { count: data.chores.length })
        return data.chores
      })
    },

    async adjustTime(userId, deltaSeconds) {
      return database.transaction((data) => {
        resetDayIfNeeded(data)
        const user = data.users.find((entry) => entry.id === userId)
        if (!user) throw new AppError(404, 'User not found.')
        reconcileUser(data, user)
        user.timeRemainingSeconds = Math.max(0, user.timeRemainingSeconds + deltaSeconds)
        const checkout = data.checkouts.find((entry) => entry.userId === user.id)
        if (checkout) checkout.remainingAtCheckout = user.timeRemainingSeconds
        log(data, 'time', `${deltaSeconds >= 0 ? 'Added time to' : 'Removed time from'} ${user.name}`, { deltaSeconds })
        return publicUser(user, data)
      })
    },

    async setTime(userId, timeRemainingSeconds) {
      return database.transaction((data) => {
        resetDayIfNeeded(data)
        const user = data.users.find((entry) => entry.id === userId)
        if (!user) throw new AppError(404, 'User not found.')
        reconcileUser(data, user)
        user.timeRemainingSeconds = timeRemainingSeconds
        const checkout = data.checkouts.find((entry) => entry.userId === user.id)
        if (checkout) checkout.remainingAtCheckout = user.timeRemainingSeconds
        log(data, 'time', `Set ${user.name}’s time`, { timeRemainingSeconds })
        return publicUser(user, data)
      })
    },

    async resetTime(userId) {
      return database.transaction((data) => {
        resetDayIfNeeded(data)
        const user = data.users.find((entry) => entry.id === userId)
        if (!user) throw new AppError(404, 'User not found.')
        reconcileUser(data, user)
        user.timeRemainingSeconds = defaultTimeSeconds(data)
        const checkout = data.checkouts.find((entry) => entry.userId === user.id)
        if (checkout) checkout.remainingAtCheckout = user.timeRemainingSeconds
        log(data, 'time', `Reset ${user.name}’s time to the daily default`, { timeRemainingSeconds: user.timeRemainingSeconds })
        return publicUser(user, data)
      })
    },

    async unlockUser(userId, pin) {
      const user = state().users.find((entry) => entry.id === userId && !entry.disabled)
      if (!user) throw new AppError(404, 'User not found.')
      if (user.pinHash && !(await verifySecret(pin, user.pinHash))) throw new AppError(401, 'That PIN is not correct.')
      return user
    },

    async getUserState(userId) {
      await ensureDailyReset()
      const data = state()
      const user = data.users.find((entry) => entry.id === userId && !entry.disabled)
      if (!user) throw new AppError(404, 'User not found.')
      const today = localDate(new Date(), data.settings.timeZone)
      const occupiedItemIds = new Set(data.checkouts.map((checkout) => checkout.itemId))
      const chores = data.chores.filter((chore) => !chore.disabled && (!chore.assignedUserIds.length || chore.assignedUserIds.includes(userId))).map((chore) => {
        const completion = choreCompletion(data, userId, chore, today.key)
        return { ...chore, requiredForCheckout: isCheckoutRequirement(chore, userId), completionStatus: completion?.status || null }
      })
      return {
        user: publicUser(user, data),
        availableItems: user.checkoutEnabled === false ? [] : data.items
          .filter((item) => !item.disabled && !occupiedItemIds.has(item.id) && (!item.assignedUserIds.length || item.assignedUserIds.includes(userId)))
          .map((item) => ({ ...item })),
        chores,
        checkoutBlocked: requiredChoreBlockers(data, userId, today.key).length > 0,
      }
    },

    async checkout(userId, itemId) {
      return database.transaction((data) => {
        resetDayIfNeeded(data)
        const user = data.users.find((entry) => entry.id === userId && !entry.disabled)
        const item = data.items.find((entry) => entry.id === itemId && !entry.disabled)
        if (!user || !item) throw new AppError(404, 'User or item not found.')
        if (user.checkoutEnabled === false) throw new AppError(403, 'Checkout access is not enabled for this user.')
        if (item.assignedUserIds.length && !item.assignedUserIds.includes(userId)) throw new AppError(403, 'This item is not assigned to this user.')
        if (data.checkouts.some((entry) => entry.userId === userId)) throw new AppError(409, 'This user already has an item checked out.')
        if (data.checkouts.some((entry) => entry.itemId === itemId)) throw new AppError(409, 'That item is already checked out.')
        const today = localDate(new Date(), data.settings.timeZone)
        const blockers = requiredChoreBlockers(data, userId, today.key)
        if (blockers.length) {
          const titles = blockers.map((chore) => `“${chore.title}”`).join(', ')
          throw new AppError(409, `Required ${blockers.length === 1 ? 'chore' : 'chores'} must be approved before checkout: ${titles}.`)
        }
        if (item.isTimed && user.timeRemainingSeconds <= 0) throw new AppError(409, 'No timed-device allowance remains today.')
        const checkout = { id: randomUUID(), userId, itemId, checkedOutAt: new Date().toISOString(), remainingAtCheckout: user.timeRemainingSeconds }
        data.checkouts.push(checkout)
        log(data, 'checkout', `${user.name} checked out ${item.name}`, { userId, itemId })
        return publicUser(user, data)
      })
    },

    async checkin(userId) {
      return database.transaction((data) => {
        const user = data.users.find((entry) => entry.id === userId)
        const checkout = data.checkouts.find((entry) => entry.userId === userId)
        if (!user || !checkout) throw new AppError(404, 'No checked-out item was found.')
        const item = data.items.find((entry) => entry.id === checkout.itemId)
        reconcileUser(data, user)
        data.checkouts = data.checkouts.filter((entry) => entry.id !== checkout.id)
        log(data, 'checkin', `${user.name} checked in ${item?.name || 'an item'}`, { userId, itemId: item?.id })
        return publicUser(user, data)
      })
    },

    async completeChore(userId, choreId) {
      return database.transaction((data) => {
        const user = data.users.find((entry) => entry.id === userId)
        const chore = data.chores.find((entry) => entry.id === choreId && !entry.disabled)
        if (!user || !chore || (chore.assignedUserIds.length && !chore.assignedUserIds.includes(userId))) throw new AppError(404, 'Chore not found.')
        const today = localDate(new Date(), data.settings.timeZone)
        const periodKey = chorePeriod(chore, today.key)
        if (data.choreCompletions.some((entry) => entry.userId === userId && entry.choreId === choreId && entry.periodKey === periodKey && entry.status !== 'rejected')) {
          throw new AppError(409, 'This chore has already been submitted for this period.')
        }
        const completion = { id: randomUUID(), userId, choreId, periodKey, status: 'pending', submittedAt: new Date().toISOString(), reviewedAt: null }
        data.choreCompletions.unshift(completion)
        log(data, 'chore', `${user.name} submitted “${chore.title}” for approval`, { completionId: completion.id })
        return completion
      })
    },

    async undoChoreSubmission(userId, choreId) {
      return database.transaction((data) => {
        const user = data.users.find((entry) => entry.id === userId)
        const chore = data.chores.find((entry) => entry.id === choreId)
        if (!user || !chore) throw new AppError(404, 'Chore submission not found.')
        const today = localDate(new Date(), data.settings.timeZone)
        const periodKey = chorePeriod(chore, today.key)
        const completion = data.choreCompletions.find((entry) => (
          entry.userId === userId
          && entry.choreId === choreId
          && entry.periodKey === periodKey
          && entry.status === 'pending'
        ))
        if (!completion) {
          const approved = data.choreCompletions.some((entry) => (
            entry.userId === userId
            && entry.choreId === choreId
            && entry.periodKey === periodKey
            && entry.status === 'approved'
          ))
          if (approved) throw new AppError(409, 'Approved chore submissions cannot be undone.')
          throw new AppError(404, 'Pending chore submission not found.')
        }
        data.choreCompletions = data.choreCompletions.filter((entry) => entry.id !== completion.id)
        log(data, 'chore', `${user.name} withdrew “${chore.title}” from approval`, { completionId: completion.id })
        return { undone: true }
      })
    },

    async reviewCompletion(completionId, status) {
      return database.transaction((data) => {
        resetDayIfNeeded(data)
        const completion = data.choreCompletions.find((entry) => entry.id === completionId)
        if (!completion || completion.status !== 'pending') throw new AppError(404, 'Pending completion not found.')
        const user = data.users.find((entry) => entry.id === completion.userId)
        const chore = data.chores.find((entry) => entry.id === completion.choreId)
        completion.status = status
        completion.reviewedAt = new Date().toISOString()
        if (status === 'approved' && user && chore) {
          reconcileUser(data, user)
          completion.rewardGrantedSeconds = chore.rewardMinutes * 60
          completion.rewardGrantedTimeDate = user.timeDate
          user.timeRemainingSeconds += completion.rewardGrantedSeconds
          const checkout = data.checkouts.find((entry) => entry.userId === user.id)
          if (checkout) checkout.remainingAtCheckout = user.timeRemainingSeconds
        }
        log(data, 'chore', `${chore?.title || 'Chore'} ${status} for ${user?.name || 'user'}`, { completionId })
        return completion
      })
    },

    async resetCompletion(completionId) {
      return database.transaction((data) => {
        resetDayIfNeeded(data)
        const completion = data.choreCompletions.find((entry) => entry.id === completionId)
        if (!completion || completion.status !== 'approved') throw new AppError(404, 'Approved completion not found.')
        const user = data.users.find((entry) => entry.id === completion.userId)
        const chore = data.chores.find((entry) => entry.id === completion.choreId)
        let reversedSeconds = 0
        if (user) {
          const reviewedDate = completion.reviewedAt
            ? localDate(new Date(completion.reviewedAt), data.settings.timeZone).key
            : null
          const rewardDate = completion.rewardGrantedTimeDate || reviewedDate
          const rewardSeconds = Number(completion.rewardGrantedSeconds ?? Number(chore?.rewardMinutes || 0) * 60)
          if (rewardDate === user.timeDate && rewardSeconds > 0) {
            reconcileUser(data, user)
            reversedSeconds = Math.min(user.timeRemainingSeconds, rewardSeconds)
            user.timeRemainingSeconds -= reversedSeconds
            const checkout = data.checkouts.find((entry) => entry.userId === user.id)
            if (checkout) checkout.remainingAtCheckout = user.timeRemainingSeconds
          }
        }
        data.choreCompletions = data.choreCompletions.filter((entry) => entry.id !== completionId)
        log(data, 'chore', `Reset “${chore?.title || 'Chore'}” for ${user?.name || 'user'}`, { completionId, reversedSeconds })
        return { reset: true, reversedSeconds }
      })
    },

    exportData() {
      const exported = structuredClone(state())
      delete exported.settings.passwordHash
      delete exported.settings.sessionSecret
      return exported
    },

    async importData(input) {
      validateBackup(input)
      const currentHash = state().settings.passwordHash
      const currentSecret = state().settings.sessionSecret
      await database.backup()
      const replacement = await database.replace(input)
      replacement.settings.passwordHash = currentHash
      replacement.settings.sessionSecret = currentSecret
      replacement.meta.version = 2
      await database.transaction((data) => log(data, 'import', 'Database restored from backup'))
      return this.getAdminState()
    },

    createEmptyDatabase: emptyDatabase,
  }
}

export { localDate, publicUser, resetDayIfNeeded }
