<template>
  <v-row justify="center">
    <v-col cols="12" sm="9" md="6" lg="5">
      <div class="text-center mb-7"><p class="eyebrow">Admin access</p></div>
      <v-card class="panel-card login-card">
        <v-card-text class="pa-5 pa-sm-8 text-center">
          <v-avatar color="secondary" variant="tonal" size="72" class="login-avatar mb-5"><v-icon icon="mdi-shield-lock-outline" size="38" /></v-avatar>
          <h1 class="compact-heading mb-2">{{ recoveryMode ? 'Reset admin password' : 'Parent sign in' }}</h1>
          <p class="muted mb-7">{{ recoveryMode ? 'Use the recovery code from the Docker logs.' : 'Enter the admin password to continue.' }}</p>
          <v-alert v-if="success" type="success" variant="tonal" class="mb-5 text-left">{{ success }}</v-alert>
          <v-alert v-if="error" type="error" variant="tonal" class="mb-5 text-left">{{ error }}</v-alert>
          <v-form v-if="!recoveryMode" @submit.prevent="login">
            <v-text-field v-model="password" label="Admin password" type="password" autocomplete="current-password" autofocus />
            <v-btn type="submit" color="primary" size="large" append-icon="mdi-arrow-right" block :loading="loading">Sign in</v-btn>
            <v-btn v-if="!demoMode" class="mt-3" variant="text" block :disabled="loading" @click="startRecovery">Forgot admin password?</v-btn>
          </v-form>
          <v-form v-else @submit.prevent="resetPassword">
            <v-alert v-if="recoveryRequested" type="info" variant="tonal" class="mb-5 text-left">
              A recovery code was written to the container logs. On the Docker host, run
              <code>docker compose logs routioneer</code>. The code expires in 10 minutes.
            </v-alert>
            <template v-if="recoveryRequested">
              <v-text-field v-model="recovery.code" label="Recovery code" autocomplete="one-time-code" autofocus />
              <v-text-field v-model="recovery.password" label="New admin password" type="password" autocomplete="new-password" hint="Use at least 8 characters" persistent-hint class="mb-2" />
              <v-text-field v-model="recovery.confirmPassword" label="Confirm new password" type="password" autocomplete="new-password" />
              <v-btn type="submit" color="primary" size="large" block :loading="loading">Reset password</v-btn>
              <v-btn class="mt-3" variant="text" block :disabled="loading" @click="requestRecovery">Send a new code to the logs</v-btn>
            </template>
            <v-btn v-else color="primary" size="large" prepend-icon="mdi-console" block :loading="loading" @click="requestRecovery">Send recovery code to Docker logs</v-btn>
            <v-btn class="mt-3" variant="text" block :disabled="loading" @click="cancelRecovery">Back to sign in</v-btn>
          </v-form>
        </v-card-text>
      </v-card>
      <div class="text-center mt-5"><v-btn to="/" variant="text" prepend-icon="mdi-arrow-left">Back home</v-btn></div>
    </v-col>
  </v-row>
</template>

<script setup>
import { inject, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '../lib/api.js'
const router = useRouter()
const socket = inject('socket')
const password = ref('')
const loading = ref(false)
const error = ref('')
const success = ref('')
const recoveryMode = ref(false)
const recoveryRequested = ref(false)
const recovery = reactive({ code: '', password: '', confirmPassword: '' })
const demoMode = ref(false)
onMounted(async () => {
  try { demoMode.value = Boolean((await api('/status')).demo?.enabled) }
  catch { demoMode.value = false }
})
async function login() {
  loading.value = true; error.value = ''; success.value = ''
  try { await api('/admin/login', { method: 'POST', body: { password: password.value } }); socket.disconnect().connect(); await router.replace('/admin') }
  catch (exception) { error.value = exception.message }
  finally { loading.value = false }
}
function startRecovery() {
  recoveryMode.value = true
  error.value = ''
  success.value = ''
}
function cancelRecovery() {
  recoveryMode.value = false
  recoveryRequested.value = false
  recovery.code = ''
  recovery.password = ''
  recovery.confirmPassword = ''
  error.value = ''
}
async function requestRecovery() {
  loading.value = true
  error.value = ''
  try {
    await api('/admin/recovery/request', { method: 'POST' })
    recoveryRequested.value = true
    recovery.code = ''
  } catch (exception) { error.value = exception.message }
  finally { loading.value = false }
}
async function resetPassword() {
  error.value = ''
  success.value = ''
  if (recovery.password !== recovery.confirmPassword) {
    error.value = 'The new passwords do not match.'
    return
  }
  loading.value = true
  try {
    await api('/admin/recovery/reset', { method: 'POST', body: { code: recovery.code, password: recovery.password } })
    cancelRecovery()
    success.value = 'Your admin password was reset. Sign in with the new password.'
    password.value = ''
  } catch (exception) { error.value = exception.message }
  finally { loading.value = false }
}
</script>

<style scoped>
.login-avatar { border: 1px solid rgba(54, 95, 125, .24); box-shadow: 5px 5px 0 rgba(54, 95, 125, .12); }
.v-alert code { display: block; margin-top: 8px; font-weight: 700; overflow-wrap: anywhere; }
</style>
