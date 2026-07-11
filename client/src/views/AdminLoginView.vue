<template>
  <v-row justify="center">
    <v-col cols="12" sm="8" md="5">
      <v-card class="glass-card pa-3 pa-sm-6">
        <v-card-text class="text-center">
          <v-avatar color="secondary" variant="tonal" size="72" class="mb-5"><v-icon icon="mdi-shield-lock-outline" size="38" /></v-avatar>
          <h1 class="text-h4 mb-2">Parent sign in</h1>
          <p class="muted mb-7">Enter the admin password to continue.</p>
          <v-alert v-if="error" type="error" variant="tonal" class="mb-5 text-left">{{ error }}</v-alert>
          <v-form @submit.prevent="login">
            <v-text-field v-model="password" label="Admin password" type="password" autocomplete="current-password" autofocus />
            <v-btn type="submit" color="primary" size="large" block :loading="loading">Sign in</v-btn>
          </v-form>
        </v-card-text>
      </v-card>
      <div class="text-center mt-5"><v-btn to="/" variant="text" prepend-icon="mdi-arrow-left">Back home</v-btn></div>
    </v-col>
  </v-row>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '../lib/api.js'
const router = useRouter()
const password = ref('')
const loading = ref(false)
const error = ref('')
async function login() {
  loading.value = true; error.value = ''
  try { await api('/admin/login', { method: 'POST', body: { password: password.value } }); await router.replace('/admin') }
  catch (exception) { error.value = exception.message }
  finally { loading.value = false }
}
</script>
