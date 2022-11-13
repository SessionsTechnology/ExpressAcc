import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import vuetify from './plugins/vuetify'
import { loadFonts } from './plugins/webfontloader'
import { io } from 'socket.io-client'
import './registerServiceWorker'
//const socket = io('http://50.116.38.100:3001') // Hosted on Linode, used for local Vue only dev without running socket locally
const socket = io(window.location.origin)
// const socket = io('http://localhost:3001')

loadFonts()

// https://stackoverflow.com/a/63101214
// App.provide('globalSocket', socket)

createApp(App)
  .provide('globalSocket', socket)
  .use(router)
  .use(vuetify)
  .mount('#app')
