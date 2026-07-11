<template>
  <v-row justify="center">
    <v-col cols="12" md="7" lg="6">
      <p class="eyebrow mb-3">Welcome back</p>
      <h1 class="text-h3 mb-4">Set up your household</h1>
      <p class="page-subtitle mb-8">Your data stays in this self-hosted installation. Start with an admin password; users and devices come next.</p>
      <v-card class="glass-card pa-3 pa-sm-6">
        <v-form @submit.prevent="submit">
          <v-card-text>
            <v-alert v-if="error" type="error" variant="tonal" class="mb-5">{{ error }}</v-alert>
            <v-text-field v-model="form.applicationName" label="Household or center name" autocomplete="organization" />
            <v-text-field v-model="form.password" label="Admin password" type="password" autocomplete="new-password" hint="Use at least 8 characters" persistent-hint class="mb-2" />
            <v-select v-model="form.timeZone" :items="timeZones" label="Time zone" />
          </v-card-text>
          <v-card-actions><v-spacer /><v-btn type="submit" color="primary" size="large" :loading="loading">Complete setup</v-btn></v-card-actions>
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
