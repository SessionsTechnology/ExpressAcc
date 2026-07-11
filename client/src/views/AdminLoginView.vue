<template>
  <v-row justify="center">
    <v-col cols="12" sm="9" md="6" lg="5">
      <div class="text-center mb-7"><p class="eyebrow">Admin access</p></div>
      <v-card class="panel-card login-card">
        <v-card-text class="pa-5 pa-sm-8 text-center">
          <v-avatar color="secondary" variant="tonal" size="72" class="login-avatar mb-5"><v-icon icon="mdi-shield-lock-outline" size="38" /></v-avatar>
          <h1 class="compact-heading mb-2">Parent sign in</h1>
          <p class="muted mb-7">Enter the admin password to continue.</p>
          <v-alert v-if="error" type="error" variant="tonal" class="mb-5 text-left">{{ error }}</v-alert>
          <v-form @submit.prevent="login">
            <v-text-field v-model="password" label="Admin password" type="password" autocomplete="current-password" autofocus />
            <v-btn type="submit" color="primary" size="large" append-icon="mdi-arrow-right" block :loading="loading">Sign in</v-btn>
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

<style scoped>
.login-avatar { border: 1px solid rgba(54, 95, 125, .24); box-shadow: 5px 5px 0 rgba(54, 95, 125, .12); }
</style>
