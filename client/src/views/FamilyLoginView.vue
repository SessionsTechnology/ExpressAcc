<template>
  <v-row justify="center">
    <v-col cols="12" sm="9" md="6" lg="5">
      <div class="text-center mb-7"><p class="eyebrow">Family Space access</p></div>
      <v-card class="panel-card login-card">
        <v-card-text class="pa-5 pa-sm-8 text-center">
          <v-avatar color="primary" variant="tonal" size="72" class="login-avatar mb-5"><v-icon icon="mdi-home-lock" size="38" /></v-avatar>
          <h1 class="compact-heading mb-2">Unlock Family Space</h1>
          <p class="muted mb-7">Enter the separate Family Space password. This device will stay signed in for 30 days.</p>
          <v-alert v-if="error" type="error" variant="tonal" class="mb-5 text-left">{{ error }}</v-alert>
          <v-form @submit.prevent="login">
            <v-text-field v-model="password" label="Family Space password" type="password" autocomplete="current-password" autofocus />
            <v-btn type="submit" color="primary" size="large" append-icon="mdi-arrow-right" block :loading="loading">Unlock Family Space</v-btn>
          </v-form>
        </v-card-text>
      </v-card>
      <div class="text-center mt-5"><v-btn to="/" variant="text" prepend-icon="mdi-arrow-left">Back home</v-btn></div>
    </v-col>
  </v-row>
</template>

<script setup>
import { inject, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api } from '../lib/api.js'

const route = useRoute()
const router = useRouter()
const socket = inject('socket')
const password = ref('')
const loading = ref(false)
const error = ref('')
const destination = () => {
  const requested = typeof route.query.redirect === 'string' ? route.query.redirect : ''
  return requested.startsWith('/') && !requested.startsWith('//') ? requested : '/checkout'
}

async function login() {
  loading.value = true
  error.value = ''
  try {
    await api('/family/login', { method: 'POST', body: { password: password.value } })
    socket.disconnect().connect()
    await router.replace(destination())
  } catch (exception) { error.value = exception.message }
  finally { loading.value = false }
}
</script>

<style scoped>
.login-avatar {
  border: 1px solid rgba(82, 105, 232, .24);
  box-shadow: 5px 5px 0 rgba(82, 105, 232, .12);
}
</style>
