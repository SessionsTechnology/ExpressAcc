import { createServer } from 'node:http'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import express from 'express'
import helmet from 'helmet'
import { Server } from 'socket.io'
import { createApiRouter } from './server/api.js'
import { createDatabase } from './server/database.js'
import { createService } from './server/service.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const port = Number(process.env.PORT || 3001)
const host = process.env.HOST || '0.0.0.0'

export async function createApplication(options = {}) {
  const database = await createDatabase(options.databaseFile)
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
  app.use('/api', createApiRouter({ service, database, notify: () => io.emit('state:changed') }))

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
    socket.emit('checkout:update', await service.getPublicState())
  })

  const ticker = setInterval(async () => {
    try {
      io.emit('checkout:update', await service.getPublicState())
    } catch (error) {
      console.error('Unable to publish checkout update', error)
    }
  }, 1000)
  ticker.unref()

  let closePromise
  const close = () => {
    if (!closePromise) {
      clearInterval(ticker)
      closePromise = io.close()
    }
    return closePromise
  }

  return { app, server, database, service, close }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  const application = await createApplication()
  application.server.listen(port, host, () => {
    console.log(`ExpressACC is ready at http://localhost:${port}`)
  })

  let shuttingDown = false
  const shutdown = async (signal) => {
    if (shuttingDown) return
    shuttingDown = true
    process.off('SIGINT', onInterrupt)
    process.off('SIGTERM', onTerminate)
    console.log(`Received ${signal}; shutting down ExpressACC`)
    await application.close()
  }
  const onInterrupt = () => shutdown('SIGINT')
  const onTerminate = () => shutdown('SIGTERM')
  process.once('SIGINT', onInterrupt)
  process.once('SIGTERM', onTerminate)
}
