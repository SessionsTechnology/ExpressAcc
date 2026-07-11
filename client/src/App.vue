<template>
  <v-app>
    <div class="ambient ambient-one" />
    <div class="ambient ambient-two" />
    <v-app-bar color="transparent" flat class="px-2 px-sm-6">
      <v-btn to="/" variant="text" class="brand" aria-label="Home">
        <v-icon icon="mdi-timer-check-outline" class="mr-2" />
        {{ status.applicationName || 'ExpressACC' }}
      </v-btn>
      <v-spacer />
      <v-chip v-if="connected" color="success" size="small" variant="tonal" prepend-icon="mdi-access-point">Live</v-chip>
      <v-chip v-else color="warning" size="small" variant="tonal" prepend-icon="mdi-access-point-off">Reconnecting</v-chip>
    </v-app-bar>
    <v-main>
      <v-container class="app-container py-8 py-sm-12">
        <router-view v-if="ready" />
        <div v-else class="d-flex justify-center align-center loading-screen"><v-progress-circular indeterminate color="primary" size="48" /></div>
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
