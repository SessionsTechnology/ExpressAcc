import { createApp } from 'vue'
import { io } from 'socket.io-client'
import App from './App.vue'
import router from './router/index.js'
import vuetify from './plugins/vuetify.js'
import './assets/main.css'

const socket = io({ autoConnect: true })

createApp(App)
  .provide('socket', socket)
  .use(router)
  .use(vuetify)
  .mount('#app')
