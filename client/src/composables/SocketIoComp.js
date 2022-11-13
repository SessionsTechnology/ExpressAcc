import { io } from 'socket.io-client'

export default () => {
   let socket

   function setupSocketConnection() {
      socket = io('http://localhost:3001')
   }

   return {
      setupSocketConnection
   }
}