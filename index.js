import express from 'express'
const app = express()
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { db } from './lowdb/index.js'
import { createServer } from 'http'
import { Server } from 'socket.io'
import { taskGetUserItemsAndTime } from './controllers/UserController.js'

const server = createServer(app)
const io = new Server(server, {
    cors: {
        origin: '*'
    }
})

const __dirname = dirname(fileURLToPath(import.meta.url))
import { Socket } from './socket/setup.js'

// Client files
const path = join(__dirname, './public')
app.use(express.static(path))
app.get('/*', (req, res) => {
  res.sendFile(join(path, 'index.html'));
});

//DB read and initial setup if none
(async () => {
  console.log(db)
  await db.read()
  if (!db.data) db.data = {
    adminSettings: {},
    users: [],
    items: [],
    userItemAssociations: []
  }; await db.write();
})()

io.on('connection', (socket) => {
  console.log('client connected:', socket.id)
  new Socket(socket).clientConnection()
})

//Setup for timer counts; tested with at least 50 users with timed items in one Docker container
io.emit('', () => {
  setInterval(
    async () => {
      try{
        const allUsers = await taskGetUserItemsAndTime()
        io.emit('updateCheckout', allUsers, () => {})
      } catch(err){
        console.log(err)
        console.log('This is most likely due to needing first time setup. Please go to app webpage to get started.')
      }
    }, 1000
  )
})

server.listen(3001, () => {
  console.log('listening on http://localhost:3001')
});