<template>
  <v-row justify="center">
    <v-col cols="12" md="8" lg="7">
      <header class="mb-8">
        <p class="eyebrow mb-4">First things first</p>
        <h1 class="page-heading compact-heading mb-4">Set up your activity center.</h1>
        <p class="page-lede">Your data stays in this self-hosted installation. Start with an admin password; users and devices come next.</p>
      </header>
      <v-card class="panel-card setup-card">
        <v-form @submit.prevent="submit">
          <v-card-text class="pa-5 pa-sm-8">
            <div class="setup-card-heading mb-7">
              <v-avatar color="primary" variant="tonal" size="52"><v-icon icon="mdi-home-heart" size="28" /></v-avatar>
              <div><h2 class="section-heading">Center details</h2><p class="muted text-body-2">You can change these later in Settings.</p></div>
            </div>
            <v-alert v-if="error" type="error" variant="tonal" class="mb-5">{{ error }}</v-alert>
            <v-text-field v-model="form.applicationName" label="Household or center name" autocomplete="organization" />
            <v-text-field v-model="form.password" label="Admin password" type="password" autocomplete="new-password" hint="Use at least 8 characters" persistent-hint class="mb-2" />
            <v-select v-model="form.timeZone" :items="timeZones" label="Time zone" />
          </v-card-text>
          <v-card-actions class="px-5 pb-5 px-sm-8 pb-sm-8 pt-0"><v-spacer /><v-btn type="submit" color="primary" size="large" append-icon="mdi-arrow-right" :loading="loading">Complete setup</v-btn></v-card-actions>
        </v-form>
      </v-card>
    </v-col>
  </v-row>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '../lib/api.js'

const router = useRouter()
const loading = ref(false)
const error = ref('')
const guessedZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
const timeZones = typeof Intl.supportedValuesOf === 'function' ? Intl.supportedValuesOf('timeZone') : [guessedZone, 'UTC']
const form = reactive({ applicationName: 'My Activity Center', password: '', timeZone: guessedZone })

async function submit() {
  error.value = ''
  loading.value = true
  try {
    await api('/setup', { method: 'POST', body: form })
    await router.replace('/admin/login')
  } catch (exception) {
    error.value = exception.message
  } finally { loading.value = false }
}
</script>

<style scoped>
.setup-card-heading { display: flex; align-items: center; gap: 14px; }
.setup-card-heading p { margin: 3px 0 0; }
@media (max-width: 599px) {
  .setup-card .v-card-actions .v-btn { width: 100%; }
}
</style>
