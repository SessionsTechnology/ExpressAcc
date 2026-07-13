import { Router } from 'express'
import { rateLimit } from 'express-rate-limit'
import { z } from 'zod'
import { createToken, readCookie, verifyToken } from './auth.js'
import { AppError } from './service.js'
import { weekdays } from './database.js'

const id = z.string().min(1).max(100)
const timeZone = z.string().refine((value) => {
  try { new Intl.DateTimeFormat('en', { timeZone: value }); return true } catch { return false }
}, 'Choose a valid time zone.')
const dailyTime = z.object(Object.fromEntries(weekdays.map((day) => [day, z.coerce.number().int().min(0).max(1440)])))
const setupSchema = z.object({ applicationName: z.string().trim().min(1).max(80), password: z.string().min(8).max(200), timeZone })
const settingsSchema = z.object({
  applicationName: z.string().trim().min(1).max(80),
  password: z.string().max(200).optional(),
  timeZone,
  darkMode: z.boolean().optional(),
  kioskMessage: z.string().max(500).optional(),
  kioskTimeoutSeconds: z.coerce.number().int().min(5).max(3600).optional(),
  dailyTimeMinutes: dailyTime,
})
const usersSchema = z.array(z.object({ id: id.optional(), name: z.string().trim().min(1).max(80), pin: z.string().max(20).optional(), clearPin: z.boolean().optional(), disabled: z.boolean().optional(), checkoutEnabled: z.boolean().optional() })).max(100)
const itemsSchema = z.array(z.object({ id: id.optional(), name: z.string().trim().min(1).max(80), description: z.string().max(500).optional(), isTimed: z.boolean().optional(), disabled: z.boolean().optional(), assignedUserIds: z.array(id).max(100).optional() })).max(250)
const choresSchema = z.array(z.object({ id: id.optional(), title: z.string().trim().min(1).max(120), description: z.string().max(500).optional(), rewardMinutes: z.coerce.number().int().min(0).max(1440), recurrence: z.enum(['once', 'daily', 'weekly']), assignedUserIds: z.array(id).max(100).optional(), disabled: z.boolean().optional() })).max(250)

function asyncRoute(handler) {
  return (request, response, next) => Promise.resolve(handler(request, response, next)).catch(next)
}

function getBearer(request) {
  return request.headers.authorization?.startsWith('Bearer ') ? request.headers.authorization.slice(7) : null
}

export function createApiRouter({ service, notify }) {
  const router = Router()
  const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: 'draft-8', legacyHeaders: false })

  const requireAdmin = (request, _response, next) => {
    const token = readCookie(request.headers.cookie, 'expressacc_admin')
    if (!verifyToken(token, service.settings.sessionSecret, 'admin')) return next(new AppError(401, 'Admin sign-in required.'))
    next()
  }
  const requireUser = (request, _response, next) => {
    const payload = verifyToken(getBearer(request), service.settings.sessionSecret, 'user')
    if (!payload || payload.userId !== request.params.userId) return next(new AppError(401, 'Please enter the user PIN again.'))
    next()
  }
  const changed = (handler) => asyncRoute(async (request, response) => {
    const result = await handler(request, response)
    notify()
    if (!response.headersSent) response.json(result)
  })

  router.get('/health', (_request, response) => response.json({ ok: true }))
  router.get('/status', (_request, response) => response.json(service.status()))
  router.post('/setup', loginLimiter, changed(async (request) => service.setup(setupSchema.parse(request.body))))
  router.get('/state', asyncRoute(async (_request, response) => response.json(await service.getPublicState())))

  router.post('/admin/login', loginLimiter, asyncRoute(async (request, response) => {
    const password = z.object({ password: z.string().min(1).max(200) }).parse(request.body).password
    if (!(await service.verifyAdmin(password))) throw new AppError(401, 'Incorrect admin password.')
    const token = createToken({ scope: 'admin' }, service.settings.sessionSecret, 12 * 60 * 60)
    const secure = request.secure || process.env.COOKIE_SECURE === 'true'
    response.setHeader('Set-Cookie', `expressacc_admin=${encodeURIComponent(token)}; HttpOnly; SameSite=Strict; Path=/; Max-Age=43200${secure ? '; Secure' : ''}`)
    response.json({ authenticated: true })
  }))
  router.post('/admin/logout', (_request, response) => {
    response.setHeader('Set-Cookie', 'expressacc_admin=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0')
    response.json({ authenticated: false })
  })
  router.get('/admin/me', requireAdmin, (_request, response) => response.json({ authenticated: true }))
  router.get('/admin/state', requireAdmin, asyncRoute(async (_request, response) => response.json(await service.getAdminState())))
  router.patch('/admin/settings', requireAdmin, changed(async (request) => service.updateSettings(settingsSchema.parse(request.body))))
  router.put('/admin/users', requireAdmin, changed(async (request) => service.saveUsers(usersSchema.parse(request.body))))
  router.put('/admin/items', requireAdmin, changed(async (request) => service.saveItems(itemsSchema.parse(request.body))))
  router.put('/admin/chores', requireAdmin, changed(async (request) => service.saveChores(choresSchema.parse(request.body))))
  router.post('/admin/users/:userId/time', requireAdmin, changed(async (request) => {
    const deltaSeconds = z.object({ deltaSeconds: z.coerce.number().int().min(-86400).max(86400) }).parse(request.body).deltaSeconds
    return service.adjustTime(request.params.userId, deltaSeconds)
  }))
  router.put('/admin/users/:userId/time', requireAdmin, changed(async (request) => {
    const timeRemainingSeconds = z.object({ timeRemainingSeconds: z.coerce.number().int().min(0).max(86400) }).parse(request.body).timeRemainingSeconds
    return service.setTime(request.params.userId, timeRemainingSeconds)
  }))
  router.post('/admin/users/:userId/time/reset', requireAdmin, changed(async (request) => service.resetTime(request.params.userId)))
  router.post('/admin/completions/:completionId/review', requireAdmin, changed(async (request) => {
    const status = z.object({ status: z.enum(['approved', 'rejected']) }).parse(request.body).status
    return service.reviewCompletion(request.params.completionId, status)
  }))
  router.post('/admin/completions/:completionId/reset', requireAdmin, changed(async (request) => service.resetCompletion(request.params.completionId)))
  router.get('/admin/export', requireAdmin, (_request, response) => {
    response.setHeader('Content-Disposition', `attachment; filename="expressacc-backup-${new Date().toISOString().slice(0, 10)}.json"`)
    response.json(service.exportData())
  })
  router.post('/admin/import', requireAdmin, changed(async (request) => service.importData(request.body)))

  router.post('/users/:userId/unlock', loginLimiter, asyncRoute(async (request, response) => {
    const pin = z.object({ pin: z.string().max(20).default('') }).parse(request.body).pin
    const user = await service.unlockUser(request.params.userId, pin)
    response.json({ token: createToken({ scope: 'user', userId: user.id }, service.settings.sessionSecret, 15 * 60) })
  }))
  router.get('/users/:userId', requireUser, asyncRoute(async (request, response) => response.json(await service.getUserState(request.params.userId))))
  router.post('/users/:userId/checkout', requireUser, changed(async (request) => {
    const itemId = z.object({ itemId: id }).parse(request.body).itemId
    return service.checkout(request.params.userId, itemId)
  }))
  router.post('/users/:userId/checkin', requireUser, changed(async (request) => service.checkin(request.params.userId)))
  router.post('/users/:userId/chores/:choreId/complete', requireUser, changed(async (request) => service.completeChore(request.params.userId, request.params.choreId)))
  router.delete('/users/:userId/chores/:choreId/complete', requireUser, changed(async (request) => service.undoChoreSubmission(request.params.userId, request.params.choreId)))

  router.use((_request, _response, next) => next(new AppError(404, 'API endpoint not found.')))
  router.use((error, _request, response, _next) => {
    if (error instanceof z.ZodError) return response.status(400).json({ error: error.issues[0]?.message || 'Invalid request.' })
    const status = error.status || 500
    if (status >= 500) console.error(error)
    response.status(status).json({ error: status >= 500 ? 'Something went wrong.' : error.message })
  })

  return router
}
