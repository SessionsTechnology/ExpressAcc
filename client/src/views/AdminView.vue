<template>
  <section v-if="ready" class="admin-page">
    <div class="page-header admin-page-header mb-8">
      <div class="page-header-copy">
        <p class="eyebrow mb-2">Parent dashboard</p>
        <h1 class="page-heading">Today at a glance</h1>
      </div>
      <div class="admin-header-actions">
        <v-btn to="/settings" color="secondary" variant="tonal" prepend-icon="mdi-cog-outline">Settings</v-btn>
        <v-btn variant="text" prepend-icon="mdi-logout" @click="logout">Sign out</v-btn>
      </div>
    </div>
    <v-alert v-if="error" type="error" variant="tonal" closable class="mb-6" @click:close="error = ''">{{ error }}</v-alert>

    <v-row class="metric-grid mb-7">
      <v-col cols="6" md="3">
        <v-card class="glass-card panel-card metric-card metric-card--users h-100">
          <v-card-text class="metric-card__content pa-0">
            <v-avatar class="metric-card__icon" color="primary" variant="tonal" size="42"><v-icon icon="mdi-account-group-outline" /></v-avatar>
            <div class="metric-card__copy"><div class="metric-card__label">Active users</div><div class="stat-number">{{ activeUsers.length }}</div></div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="6" md="3">
        <v-card class="glass-card panel-card metric-card metric-card--checked-out metric-card--slate h-100">
          <v-card-text class="metric-card__content pa-0">
            <v-avatar class="metric-card__icon" color="secondary" variant="tonal" size="42"><v-icon icon="mdi-tray-arrow-up" /></v-avatar>
            <div class="metric-card__copy"><div class="metric-card__label">Items out</div><div class="stat-number">{{ users.filter(user => user.checkout).length }}</div></div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="6" md="3">
        <v-card class="glass-card panel-card metric-card metric-card--pending metric-card--sun h-100">
          <v-card-text class="metric-card__content pa-0">
            <v-avatar class="metric-card__icon" color="warning" variant="tonal" size="42"><v-icon icon="mdi-clipboard-clock-outline" /></v-avatar>
            <div class="metric-card__copy"><div class="metric-card__label">Pending chores</div><div class="stat-number">{{ pending.length }}</div></div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="6" md="3">
        <v-card class="glass-card panel-card metric-card metric-card--available metric-card--terracotta h-100">
          <v-card-text class="metric-card__content pa-0">
            <v-avatar class="metric-card__icon" color="success" variant="tonal" size="42"><v-icon icon="mdi-package-variant-closed-check" /></v-avatar>
            <div class="metric-card__copy"><div class="metric-card__label">Available items</div><div class="stat-number">{{ availableItemCount }}</div></div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <div class="content-section-header mb-4">
      <div><h2 class="section-heading">Users and time</h2><p class="muted text-body-2 mb-0">See each person’s remaining allowance and current checkout.</p></div>
      <v-btn to="/checkout" variant="text" append-icon="mdi-arrow-right">Open kiosk</v-btn>
    </div>
    <v-row class="mb-9">
      <v-col v-for="user in activeUsers" :key="user.id" cols="12" md="6" lg="4">
        <v-card class="glass-card panel-card user-time-card pa-2 h-100">
          <v-card-text>
            <div class="user-card-identity mb-5"><v-avatar color="primary" variant="tonal">{{ user.name.slice(0,1).toUpperCase() }}</v-avatar><div class="user-card-identity__copy"><h3 class="text-h6">{{ user.name }}</h3><span class="muted text-caption">{{ user.checkout ? `${user.checkout.item.name} checked out` : 'No item checked out' }}</span></div></div>
            <div class="stat-number" :class="{ 'text-error': user.timeRemainingSeconds === 0 }">{{ formatDuration(user.timeRemainingSeconds) }}</div>
            <div class="muted text-caption">remaining today</div>
          </v-card-text>
          <v-card-actions class="user-time-actions"><v-btn size="small" variant="tonal" color="warning" @click="adjust(user, -900)">−15m</v-btn><v-btn size="small" variant="tonal" color="success" @click="adjust(user, 900)">+15m</v-btn><v-spacer /><v-chip v-if="user.checkout" color="accent" size="small" variant="tonal">In use</v-chip></v-card-actions>
        </v-card>
      </v-col>
      <v-col v-if="!activeUsers.length" cols="12"><div class="empty-state">Add a user in Settings to get started.</div></v-col>
    </v-row>

    <v-row>
      <v-col cols="12" lg="7">
        <v-card class="glass-card panel-card pa-2 pa-sm-4 h-100">
          <v-card-title class="dashboard-panel-title"><h2 class="section-heading">Chore approvals</h2><v-chip v-if="pending.length" color="warning" size="small">{{ pending.length }}</v-chip></v-card-title>
          <v-card-text>
            <v-list v-if="pending.length" bg-color="transparent">
              <v-list-item v-for="completion in pending" :key="completion.id" :title="completion.choreTitle" :subtitle="`${completion.userName} · ${formatDate(completion.submittedAt)}`" class="approval-item mb-2">
                <template #prepend><v-avatar color="secondary" variant="tonal"><v-icon icon="mdi-broom" /></v-avatar></template>
                <template #append><div class="approval-actions"><v-btn prepend-icon="mdi-close" size="small" color="error" variant="tonal" aria-label="Reject" @click="review(completion, 'rejected')">Reject</v-btn><v-btn prepend-icon="mdi-check" size="small" color="success" variant="tonal" aria-label="Approve" @click="review(completion, 'approved')">Approve</v-btn></div></template>
              </v-list-item>
            </v-list>
            <div v-else class="empty-state">Nothing is waiting for approval.</div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" lg="5">
        <v-card class="glass-card panel-card pa-2 pa-sm-4 h-100">
          <v-card-title class="dashboard-panel-title"><h2 class="section-heading">Recent activity</h2></v-card-title>
          <v-card-text><v-timeline v-if="activity.length" side="end" density="compact" truncate-line="both"><v-timeline-item v-for="entry in activity.slice(0,8)" :key="entry.id" dot-color="primary" size="x-small"><div class="text-body-2">{{ entry.message }}</div><div class="muted text-caption">{{ formatDate(entry.createdAt) }}</div></v-timeline-item></v-timeline><div v-else class="empty-state">Activity will appear here.</div></v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </section>
</template>

<script setup>
import { computed, inject, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '../lib/api.js'
import { formatDate, formatDuration } from '../lib/format.js'
const router = useRouter(); const socket = inject('socket')
const ready = ref(false); const error = ref(''); const users = ref([]); const items = ref([]); const completions = ref([]); const activity = ref([])
const activeUsers = computed(() => users.value.filter((user) => !user.disabled))
const pending = computed(() => completions.value.filter((completion) => completion.status === 'pending'))
const availableItemCount = computed(() => Math.max(0, items.value.filter((item) => !item.disabled).length - users.value.filter((user) => user.checkout).length))
async function load() { try { const state = await api('/admin/state'); users.value = state.users; items.value = state.items; completions.value = state.completions; activity.value = state.activity } catch (exception) { if (exception.status === 401) return router.replace('/admin/login'); error.value = exception.message } finally { ready.value = true } }
async function adjust(user, deltaSeconds) { try { await api(`/admin/users/${user.id}/time`, { method: 'POST', body: { deltaSeconds } }); await load() } catch (exception) { error.value = exception.message } }
async function review(completion, status) { try { await api(`/admin/completions/${completion.id}/review`, { method: 'POST', body: { status } }); await load() } catch (exception) { error.value = exception.message } }
async function logout() { await api('/admin/logout', { method: 'POST' }); await router.replace('/') }
const onChanged = () => load()
onMounted(() => { load(); socket.on('state:changed', onChanged); socket.on('checkout:update', ({ users: next }) => { users.value = next }) })
onBeforeUnmount(() => { socket.off('state:changed', onChanged); socket.off('checkout:update') })
</script>

<style scoped>
.admin-header-actions,
.content-section-header,
.dashboard-panel-title,
.user-card-identity,
.user-time-actions,
.approval-actions {
  display: flex;
  align-items: center;
}

.admin-header-actions,
.approval-actions {
  gap: 8px;
}

.metric-card {
  --metric-tone: var(--v-theme-primary);
  position: relative;
  overflow: hidden;
}

.metric-card::before {
  position: absolute;
  inset: 0 0 auto;
  height: 3px;
  background: rgb(var(--metric-tone));
  content: '';
}

.metric-card--checked-out { --metric-tone: var(--v-theme-secondary); }
.metric-card--pending { --metric-tone: var(--v-theme-warning); }
.metric-card--available { --metric-tone: var(--v-theme-success); }

.metric-card__content {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  gap: 14px;
}

.metric-card__copy,
.user-card-identity__copy {
  min-width: 0;
}

.metric-card__label {
  color: rgba(var(--v-theme-on-surface), .66);
  font-size: .7rem;
  font-weight: 800;
  letter-spacing: .08em;
  line-height: 1.25;
  text-transform: uppercase;
}

.content-section-header {
  justify-content: space-between;
  gap: 16px;
}

.content-section-header > div {
  min-width: 0;
}

.user-card-identity {
  gap: 12px;
}

.user-card-identity h3,
.user-card-identity span {
  overflow-wrap: anywhere;
}

.user-time-actions {
  flex-wrap: wrap;
  gap: 4px;
}

.dashboard-panel-title {
  flex-wrap: wrap;
  gap: 10px;
}

.approval-item {
  border: 1px solid rgba(var(--v-theme-on-surface), .08);
  border-radius: 16px;
}

@media (max-width: 599px) {
  .admin-page-header {
    align-items: flex-start;
  }

  .admin-header-actions {
    width: 100%;
  }

  .admin-header-actions .v-btn {
    flex: 1 1 auto;
  }

  .content-section-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .approval-item {
    grid-template-areas:
      "prepend content"
      "append append";
    grid-template-columns: max-content minmax(0, 1fr);
    row-gap: 12px;
  }

  .approval-item :deep(.v-list-item__prepend) {
    align-self: start;
  }

  .approval-item :deep(.v-list-item__append) {
    width: 100%;
    margin-inline-start: 0;
  }

  .approval-actions {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    width: 100%;
  }

  .approval-actions .v-btn {
    width: 100%;
  }
}

@media (max-width: 420px) {
  .metric-card__content {
    grid-template-columns: minmax(0, 1fr);
    align-items: start;
  }
}
</style>
