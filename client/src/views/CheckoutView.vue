<template>
  <section class="checkout-page">
    <header class="page-header mb-8">
      <div class="page-header-copy">
        <p class="eyebrow mb-2">Self service</p>
        <h1 class="page-heading">Who’s checking out?</h1>
      </div>
      <v-btn to="/" variant="text" prepend-icon="mdi-arrow-left">Home</v-btn>
    </header>

    <v-alert v-if="error" type="error" variant="tonal" class="mb-6">{{ error }}</v-alert>
    <v-row v-if="users.length" class="checkout-grid">
      <v-col v-for="user in users" :key="user.id" cols="12" sm="6" lg="4">
        <v-card class="panel-card action-card checkout-card" :to="`/user/${user.id}`">
          <v-card-text class="checkout-card-body">
            <div class="checkout-card-person mb-7">
              <v-avatar color="primary" variant="tonal" size="54" class="flex-shrink-0"><span class="text-h5 font-weight-bold">{{ user.name.slice(0, 1).toUpperCase() }}</span></v-avatar>
              <div class="checkout-card-copy">
                <h2 class="checkout-card-name">{{ user.name }}</h2>
                <span class="muted checkout-card-status">{{ user.checkout ? user.checkout.item.name : 'Ready to check out' }}</span>
              </div>
            </div>
            <p class="muted text-caption mb-1">TODAY’S TIME</p>
            <div class="stat-number" :class="{ 'text-error': user.timeRemainingSeconds === 0 }">{{ formatDuration(user.timeRemainingSeconds) }}</div>
          </v-card-text>
          <v-card-actions class="checkout-card-actions">
            <v-chip :color="user.checkout ? 'accent' : 'success'" variant="tonal" size="small">{{ user.checkout ? 'Item out' : 'Available' }}</v-chip>
            <v-spacer />
            <v-icon icon="mdi-chevron-right" aria-hidden="true" />
          </v-card-actions>
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

<style scoped>
.checkout-grid > .v-col {
  display: flex;
}

.checkout-card {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  width: 100%;
  min-width: 0;
  height: 100%;
  overflow: hidden;
}

.checkout-card-body {
  flex: 1 1 auto;
  padding: 24px;
}

.checkout-card-person {
  display: flex;
  align-items: center;
  min-width: 0;
}

.checkout-card-copy {
  min-width: 0;
  margin-left: 16px;
}

.checkout-card-name {
  font-size: 1.35rem;
  font-weight: 750;
  line-height: 1.2;
  overflow-wrap: anywhere;
}

.checkout-card-status {
  display: block;
  margin-top: 4px;
  line-height: 1.45;
  overflow-wrap: anywhere;
}

.checkout-card-actions {
  min-height: 0;
  margin-top: auto;
  padding: 0 24px 24px;
}

@media (max-width: 599px) {
  .checkout-card-body {
    padding: 20px;
  }

  .checkout-card-actions {
    padding: 0 20px 20px;
  }
}
</style>
