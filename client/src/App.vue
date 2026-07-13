<template>
  <v-app>
    <div class="ambient ambient-one" aria-hidden="true" />
    <div class="ambient ambient-two" aria-hidden="true" />
    <v-app-bar color="surface" flat height="82" class="app-bar">
      <div class="app-bar-content">
        <v-btn to="/" variant="text" class="brand" aria-label="ExpressACC home">
          <span class="brand-mark"><v-icon icon="mdi-home-heart" /></span>
          <span class="brand-copy">
            <span>{{ status.applicationName || 'ExpressACC' }}</span>
            <small>family home base</small>
          </span>
        </v-btn>
        <v-spacer />
        <div role="status" aria-live="polite">
          <v-chip v-if="connected" class="connection-chip" color="success" size="small" variant="tonal" prepend-icon="mdi-wifi">Up to date</v-chip>
          <v-chip v-else class="connection-chip" color="warning" size="small" variant="tonal" prepend-icon="mdi-access-point-off">Updating</v-chip>
        </div>
      </div>
    </v-app-bar>
    <v-main>
      <v-container class="app-container py-8 py-sm-12 py-lg-16">
        <router-view v-if="ready" />
        <div v-else class="loading-screen" role="status" aria-live="polite">
          <v-progress-circular indeterminate color="primary" size="48" width="5" />
          <p>Getting your family home base ready…</p>
        </div>
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup>
import { inject, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useTheme } from 'vuetify'
import { api } from './lib/api.js'

const socket = inject('socket')
const router = useRouter()
const route = useRoute()
const theme = useTheme()
const ready = ref(false)
const connected = ref(socket.connected)
const status = reactive({})

function applyStatus(nextStatus) {
  Object.assign(status, nextStatus)
  const darkMode = Boolean(status.darkMode)
  theme.global.name.value = darkMode ? 'expressAccDark' : 'expressAcc'
  document.documentElement.dataset.theme = darkMode ? 'dark' : 'light'
}

async function bootstrap() {
  try {
    applyStatus(await api('/status'))
    if (!status.isSetup && route.name !== 'setup') await router.replace('/setup')
    if (status.isSetup && route.name === 'setup') await router.replace('/')
  } finally {
    ready.value = true
  }
}

const onConnect = () => { connected.value = true }
const onDisconnect = () => { connected.value = false }
const onChanged = async () => applyStatus(await api('/status'))

onMounted(() => {
  bootstrap()
  socket.on('connect', onConnect)
  socket.on('disconnect', onDisconnect)
  socket.on('state:changed', onChanged)
})
onBeforeUnmount(() => {
  socket.off('connect', onConnect)
  socket.off('disconnect', onDisconnect)
  socket.off('state:changed', onChanged)
})
</script>
