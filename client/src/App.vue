<template>
  <v-app :class="{ 'compact-landscape': compactLandscape }">
    <div class="ambient ambient-one" aria-hidden="true" />
    <div class="ambient ambient-two" aria-hidden="true" />
    <v-app-bar color="surface" flat :height="compactLandscape ? 66 : 82" class="app-bar">
      <div class="app-bar-content">
        <v-btn to="/" variant="text" class="brand" aria-label="Routioneer home">
          <span class="brand-mark"><v-icon icon="mdi-compass-outline" /></span>
          <span class="brand-copy">
            <span>Routioneer</span>
            <small>{{ status.applicationName && status.applicationName !== 'Routioneer' ? status.applicationName : 'shared routine hub' }}</small>
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
import { computed, inject, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useDisplay, useTheme } from 'vuetify'
import { api } from './lib/api.js'

const socket = inject('socket')
const router = useRouter()
const route = useRoute()
const theme = useTheme()
const { height: viewportHeight, width: viewportWidth } = useDisplay()
const ready = ref(false)
const connected = ref(socket.connected)
const status = reactive({})
const compactLandscape = computed(() => (
  viewportWidth.value >= 600
  && viewportWidth.value <= 1400
  && viewportHeight.value <= 820
  && viewportWidth.value > viewportHeight.value
))

function applyStatus(nextStatus) {
  Object.assign(status, nextStatus)
  const darkMode = Boolean(status.darkMode)
  theme.change(darkMode ? 'routioneerDark' : 'routioneer')
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
const onChanged = async () => {
  applyStatus(await api('/status'))
  if (route.meta.familySpace && status.familySpaceProtected) {
    try { await api('/family/me') }
    catch (exception) {
      if (exception.status === 401) await router.replace({ name: 'family-login', query: { redirect: route.fullPath } })
    }
  }
}
const onFamilyLocked = () => {
  if (route.meta.familySpace) void router.replace({ name: 'family-login', query: { redirect: route.fullPath } })
}

onMounted(() => {
  bootstrap()
  socket.on('connect', onConnect)
  socket.on('disconnect', onDisconnect)
  socket.on('state:changed', onChanged)
  socket.on('family:locked', onFamilyLocked)
})
onBeforeUnmount(() => {
  socket.off('connect', onConnect)
  socket.off('disconnect', onDisconnect)
  socket.off('state:changed', onChanged)
  socket.off('family:locked', onFamilyLocked)
})
</script>
