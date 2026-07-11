<template>
  <section>
    <div class="d-flex align-center mb-8">
      <div><p class="eyebrow mb-2">Self service</p><h1 class="text-h3">Who’s checking out?</h1></div>
      <v-spacer /><v-btn to="/" variant="text" prepend-icon="mdi-arrow-left" class="d-none d-sm-flex">Home</v-btn>
    </div>
    <v-alert v-if="error" type="error" variant="tonal" class="mb-6">{{ error }}</v-alert>
    <v-row v-if="users.length">
      <v-col v-for="user in users" :key="user.id" cols="12" sm="6" lg="4">
        <v-card class="glass-card action-card pa-2" :to="`/user/${user.id}`">
          <v-card-text>
            <div class="d-flex align-center mb-7">
              <v-avatar color="primary" variant="tonal" size="54"><span class="text-h5 font-weight-bold">{{ user.name.slice(0, 1).toUpperCase() }}</span></v-avatar>
              <div class="ml-4"><h2 class="text-h5">{{ user.name }}</h2><span class="muted">{{ user.checkout ? user.checkout.item.name : 'Ready to check out' }}</span></div>
            </div>
            <p class="muted text-caption mb-1">TODAY’S TIME</p>
            <div class="stat-number" :class="{ 'text-error': user.timeRemainingSeconds === 0 }">{{ formatDuration(user.timeRemainingSeconds) }}</div>
          </v-card-text>
          <v-card-actions><v-chip :color="user.checkout ? 'accent' : 'success'" variant="tonal" size="small">{{ user.checkout ? 'Item out' : 'Available' }}</v-chip><v-spacer /><v-icon icon="mdi-chevron-right" /></v-card-actions>
        </v-card>
      </v-col>
    </v-row>
    <div v-else class="empty-state"><v-icon icon="mdi-account-plus-outline" size="44" class="mb-3" /><p>No active users yet. An admin can add them in Settings.</p></div>
  </section>
</template>

<script setup>
import { inject, onBeforeUnmount, onMounted, ref } from 'vue'
import { api } from '../lib/api.js'
import { formatDuration } from '../lib/format.js'
const socket = inject('socket')
const users = ref([])
const error = ref('')
const update = (state) => { users.value = state.users }
onMounted(async () => {
  try { update(await api('/state')) } catch (exception) { error.value = exception.message }
  socket.on('checkout:update', update)
})
onBeforeUnmount(() => socket.off('checkout:update', update))
</script>
