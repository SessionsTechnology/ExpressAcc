<template>
  <section class="checkout-page">
    <header class="page-header mb-8">
      <div class="page-header-copy">
        <p class="eyebrow mb-2">Household kiosk</p>
        <h1 class="page-heading">Chores and checkout</h1>
      </div>
      <v-btn to="/" variant="text" prepend-icon="mdi-arrow-left">Home</v-btn>
    </header>

    <v-alert v-if="error" type="error" variant="tonal" class="mb-6">{{ error }}</v-alert>
    <section v-if="chores.length" class="kiosk-chores mb-9" aria-labelledby="kiosk-chores-heading">
      <div class="content-section-header mb-4">
        <div><p class="eyebrow mb-2">Assigned first</p><h2 id="kiosk-chores-heading" class="section-heading">Today’s chores</h2></div>
        <v-chip color="secondary" variant="tonal" prepend-icon="mdi-eye-outline">View only</v-chip>
      </div>
      <v-row class="chore-board-grid">
        <v-col v-for="chore in chores" :key="chore.id" cols="12" md="6" lg="4">
          <v-card class="panel-card kiosk-chore-card h-100" variant="outlined">
            <v-card-text class="kiosk-chore-body">
              <div class="kiosk-chore-heading">
                <v-avatar color="secondary" variant="tonal" size="44"><v-icon icon="mdi-broom" /></v-avatar>
                <div><h3>{{ chore.title }}</h3><p class="muted text-caption">{{ chore.description || recurrenceLabel(chore.recurrence) }}</p></div>
              </div>
              <div class="kiosk-assignees mt-4">
                <span class="muted text-caption kiosk-assignee-label">ASSIGNED TO</span>
                <div class="kiosk-assignee-chips">
                  <v-chip v-if="chore.assignedToEveryone" size="small" color="primary" variant="tonal">Everyone</v-chip>
                  <v-chip v-for="assignee in chore.assignees" v-else :key="assignee.id" size="small" color="primary" variant="tonal">{{ assignee.name }}</v-chip>
                  <span v-if="!chore.assignedToEveryone && !chore.assignees.length" class="muted text-caption">No active users</span>
                </div>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </section>
    <div class="content-section-header mb-4">
      <div><p class="eyebrow mb-2">Profiles</p><h2 class="section-heading">Choose your name</h2></div>
    </div>
    <v-row v-if="users.length" class="checkout-grid">
      <v-col v-for="user in users" :key="user.id" cols="12" sm="6" lg="4">
        <v-card class="panel-card action-card checkout-card" :to="`/user/${user.id}`">
          <v-card-text class="checkout-card-body">
            <div class="checkout-card-person mb-7">
              <v-avatar color="primary" variant="tonal" size="54" class="flex-shrink-0"><span class="text-h5 font-weight-bold">{{ user.name.slice(0, 1).toUpperCase() }}</span></v-avatar>
              <div class="checkout-card-copy">
                <h2 class="checkout-card-name">{{ user.name }}</h2>
                <span class="muted checkout-card-status">{{ user.checkout ? user.checkout.item.name : user.checkoutEnabled ? 'Ready to check out' : 'Chores only' }}</span>
              </div>
            </div>
            <template v-if="user.checkoutEnabled">
              <p class="muted text-caption mb-1">TODAY’S TIME</p>
              <div class="stat-number" :class="{ 'text-error': user.timeRemainingSeconds === 0 }">{{ formatDuration(user.timeRemainingSeconds) }}</div>
            </template>
            <template v-else>
              <p class="muted text-caption mb-1">ASSIGNED CHORES</p>
              <div class="checkout-card-chore-count">{{ assignedChoreCount(user.id) }} {{ assignedChoreCount(user.id) === 1 ? 'chore' : 'chores' }}</div>
            </template>
          </v-card-text>
          <v-card-actions class="checkout-card-actions">
            <v-chip :color="user.checkout ? 'accent' : user.checkoutEnabled ? 'success' : 'secondary'" variant="tonal" size="small">{{ user.checkout ? 'Item out' : user.checkoutEnabled ? 'Available' : 'Chore profile' }}</v-chip>
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
const chores = ref([])
const error = ref('')
const update = (state) => { users.value = state.users; chores.value = state.chores || [] }
const assignedChoreCount = (userId) => chores.value.filter((chore) => chore.assignedToEveryone || chore.assignedUserIds.includes(userId)).length
const recurrenceLabel = (recurrence) => ({ once: 'One-time chore', daily: 'Daily chore', weekly: 'Weekly chore' }[recurrence] || 'Chore')
onMounted(async () => {
  try { update(await api('/state')) } catch (exception) { error.value = exception.message }
  socket.on('checkout:update', update)
})
onBeforeUnmount(() => socket.off('checkout:update', update))
</script>

<style scoped>
.content-section-header,
.kiosk-chore-heading,
.kiosk-assignee-chips {
  display: flex;
  align-items: center;
}

.content-section-header {
  justify-content: space-between;
  gap: 16px;
}

.chore-board-grid > .v-col {
  display: flex;
}

.kiosk-chore-card {
  flex: 1 1 auto;
  width: 100%;
  background: rgba(var(--v-theme-secondary), .035);
}

.kiosk-chore-body {
  padding: 20px;
}

.kiosk-chore-heading {
  align-items: flex-start;
  gap: 14px;
}

.kiosk-chore-heading > div {
  min-width: 0;
}

.kiosk-chore-heading h3 {
  font-size: 1.05rem;
  line-height: 1.35;
  overflow-wrap: anywhere;
}

.kiosk-chore-heading p {
  margin-top: 3px;
  line-height: 1.45;
  overflow-wrap: anywhere;
}

.kiosk-assignees {
  padding-top: 14px;
  border-top: 1px solid rgba(var(--v-theme-on-surface), .08);
}

.kiosk-assignee-label {
  display: block;
  margin-bottom: 8px;
  font-weight: 750;
  letter-spacing: .06em;
}

.kiosk-assignee-chips {
  flex-wrap: wrap;
  gap: 6px;
}

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

.checkout-card-chore-count {
  color: rgb(var(--v-theme-secondary));
  font-size: 1.5rem;
  font-weight: 750;
  line-height: 1.2;
}

.checkout-card-actions {
  min-height: 0;
  margin-top: auto;
  padding: 0 24px 24px;
}

@media (max-width: 599px) {
  .content-section-header {
    align-items: flex-start;
  }

  .checkout-card-body {
    padding: 20px;
  }

  .checkout-card-actions {
    padding: 0 20px 20px;
  }
}
</style>
