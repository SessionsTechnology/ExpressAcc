<template>
  <v-app>
    <div class="ambient ambient-one" aria-hidden="true" />
    <div class="ambient ambient-two" aria-hidden="true" />
    <v-app-bar color="surface" flat height="76" class="app-bar">
      <div class="app-bar-content">
        <v-btn to="/" variant="text" class="brand" aria-label="ExpressACC home">
          <span class="brand-mark"><v-icon icon="mdi-timer-check-outline" /></span>
          <span class="brand-copy">
            <span>{{ status.applicationName || 'ExpressACC' }}</span>
            <small>activity center</small>
          </span>
        </v-btn>
        <v-spacer />
        <div role="status" aria-live="polite">
          <v-chip v-if="connected" color="success" size="small" variant="tonal" prepend-icon="mdi-access-point">Live</v-chip>
          <v-chip v-else color="warning" size="small" variant="tonal" prepend-icon="mdi-access-point-off">Reconnecting</v-chip>
        </div>
      </div>
    </v-app-bar>
    <v-main>
      <v-container class="app-container py-7 py-sm-12">
        <router-view v-if="ready" />
        <div v-else class="loading-screen" role="status" aria-live="polite">
          <v-progress-circular indeterminate color="primary" size="48" width="5" />
          <p>Getting your activity center ready…</p>
        </div>
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup>
import { inject, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api } from './lib/api.js'

const socket = inject('socket')
const router = useRouter()
const route = useRoute()
const ready = ref(false)
const connected = ref(socket.connected)
const status = reactive({})

async function bootstrap() {
  try {
    Object.assign(status, await api('/status'))
    if (!status.isSetup && route.name !== 'setup') await router.replace('/setup')
    if (status.isSetup && route.name === 'setup') await router.replace('/')
  } finally {
    ready.value = true
  }
}

const onConnect = () => { connected.value = true }
const onDisconnect = () => { connected.value = false }
const onChanged = async () => Object.assign(status, await api('/status'))

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
