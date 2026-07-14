import { createServer } from 'node:http'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import express from 'express'
import helmet from 'helmet'
import { Server } from 'socket.io'
import { readCookie, verifyToken } from './server/auth.js'
import { createApiRouter } from './server/api.js'
import { createDatabase } from './server/database.js'
import { createDemoController } from './server/demo.js'
import { createService } from './server/service.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const port = Number(process.env.PORT || 3001)
const host = process.env.HOST || '0.0.0.0'

export async function createApplication(options = {}) {
  const database = await createDatabase(options.databaseFile)
  const demoOptions = options.demo || {}
  const demoEnabled = demoOptions.enabled ?? process.env.DEMO_MODE === 'true'
  const demo = demoEnabled ? await createDemoController({ database, ...demoOptions }) : null
  const service = createService(database)
  const app = express()
  const server = createServer(app)
  const io = new Server(server, {
    cors: process.env.NODE_ENV === 'production' ? undefined : { origin: true, credentials: true },
  })

  app.disable('x-powered-by')
  app.set('trust proxy', 1)
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        fontSrc: ["'self'", 'data:'],
        imgSrc: ["'self'", 'data:'],
        connectSrc: ["'self'", 'ws:', 'wss:'],
      },
    },
  }))
  app.use(express.json({ limit: '2mb' }))
  app.use('/api', createApiRouter({
    service,
    notify: () => io.emit('state:changed'),
    recoveryLogger: options.recoveryLogger,
    demo,
  }))

  const hasSocketSession = (socket, cookieNames, secret, scope) => {
    return cookieNames.some((cookieName) => {
      const token = readCookie(socket.handshake.headers.cookie, cookieName)
      return Boolean(verifyToken(token, secret, scope))
    })
  }
  const canReceiveCheckoutState = (socket) => (
    !service.isFamilySpaceProtected()
    || hasSocketSession(socket, ['routioneer_family', 'expressacc_family'], service.settings.familySessionSecret, 'family')
    || hasSocketSession(socket, ['routioneer_admin', 'expressacc_admin'], service.settings.sessionSecret, 'admin')
  )
  const publishCheckoutState = async () => {
    const sockets = [...io.sockets.sockets.values()]
    const recipients = sockets.filter((socket) => {
      const allowed = canReceiveCheckoutState(socket)
      if (!allowed && socket.data.hadCheckoutAccess) socket.emit('family:locked')
      socket.data.hadCheckoutAccess = allowed
      return allowed
    })
    if (!recipients.length) return
    const state = await service.getPublicState()
    for (const socket of recipients) socket.emit('checkout:update', state)
  }

  const publicPath = options.publicPath || join(__dirname, 'client', 'dist')
  app.use('/assets', express.static(join(publicPath, 'assets'), {
    immutable: true,
    index: false,
    maxAge: '1y',
  }))
  app.use(express.static(publicPath, { index: false, maxAge: 0 }))
  app.get('/{*splat}', (_request, response) => {
    response.setHeader('Cache-Control', 'no-cache')
    response.sendFile(join(publicPath, 'index.html'))
  })

  io.on('connection', async (socket) => {
    socket.data.hadCheckoutAccess = canReceiveCheckoutState(socket)
    if (socket.data.hadCheckoutAccess) socket.emit('checkout:update', await service.getPublicState())
  })

  const ticker = setInterval(async () => {
    try {
      await publishCheckoutState()
    } catch (error) {
      console.error('Unable to publish checkout update', error)
    }
  }, 1000)
  ticker.unref()

  demo?.start(async () => {
    io.emit('demo:reset', demo.status())
    io.emit('state:changed')
    await publishCheckoutState()
  })

  let closePromise
  const close = () => {
    if (!closePromise) {
      clearInterval(ticker)
      demo?.close()
      closePromise = io.close()
    }
    return closePromise
  }

  return { app, server, database, service, demo, close }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  const application = await createApplication()
  application.server.listen(port, host, () => {
    console.log(`Routioneer is ready at http://localhost:${port}`)
  })

  let shuttingDown = false
  const shutdown = async (signal) => {
    if (shuttingDown) return
    shuttingDown = true
    process.off('SIGINT', onInterrupt)
    process.off('SIGTERM', onTerminate)
    console.log(`Received ${signal}; shutting down Routioneer`)
    await application.close()
  }
  const onInterrupt = () => shutdown('SIGINT')
  const onTerminate = () => shutdown('SIGTERM')
  process.once('SIGINT', onInterrupt)
  process.once('SIGTERM', onTerminate)
}
