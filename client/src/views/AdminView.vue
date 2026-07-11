<template>
  <section v-if="ready">
    <div class="d-flex flex-wrap align-center ga-3 mb-8">
      <div><p class="eyebrow mb-2">Parent dashboard</p><h1 class="text-h3">Today at a glance</h1></div>
      <v-spacer /><v-btn to="/settings" color="secondary" variant="tonal" prepend-icon="mdi-cog-outline">Settings</v-btn><v-btn variant="text" prepend-icon="mdi-logout" @click="logout">Sign out</v-btn>
    </div>
    <v-alert v-if="error" type="error" variant="tonal" closable class="mb-6" @click:close="error = ''">{{ error }}</v-alert>

    <v-row class="mb-7">
      <v-col cols="6" md="3"><v-card class="glass-card pa-4"><div class="muted text-caption">ACTIVE USERS</div><div class="stat-number">{{ activeUsers.length }}</div></v-card></v-col>
      <v-col cols="6" md="3"><v-card class="glass-card pa-4"><div class="muted text-caption">ITEMS OUT</div><div class="stat-number">{{ users.filter(user => user.checkout).length }}</div></v-card></v-col>
      <v-col cols="6" md="3"><v-card class="glass-card pa-4"><div class="muted text-caption">PENDING CHORES</div><div class="stat-number">{{ pending.length }}</div></v-card></v-col>
      <v-col cols="6" md="3"><v-card class="glass-card pa-4"><div class="muted text-caption">AVAILABLE ITEMS</div><div class="stat-number">{{ availableItemCount }}</div></v-card></v-col>
    </v-row>

    <div class="d-flex align-center mb-4"><h2 class="section-heading">Users and time</h2><v-spacer /><v-btn to="/checkout" variant="text" append-icon="mdi-arrow-right">Open kiosk</v-btn></div>
    <v-row class="mb-9">
      <v-col v-for="user in activeUsers" :key="user.id" cols="12" md="6" lg="4">
        <v-card class="glass-card pa-2 h-100">
          <v-card-text>
            <div class="d-flex align-center mb-5"><v-avatar color="primary" variant="tonal">{{ user.name.slice(0,1).toUpperCase() }}</v-avatar><div class="ml-3"><h3 class="text-h6">{{ user.name }}</h3><span class="muted text-caption">{{ user.checkout ? `${user.checkout.item.name} checked out` : 'No item checked out' }}</span></div></div>
            <div class="stat-number" :class="{ 'text-error': user.timeRemainingSeconds === 0 }">{{ formatDuration(user.timeRemainingSeconds) }}</div>
            <div class="muted text-caption">remaining today</div>
          </v-card-text>
          <v-card-actions><v-btn size="small" variant="tonal" color="warning" @click="adjust(user, -900)">−15m</v-btn><v-btn size="small" variant="tonal" color="success" @click="adjust(user, 900)">+15m</v-btn><v-spacer /><v-chip v-if="user.checkout" color="accent" size="small" variant="tonal">In use</v-chip></v-card-actions>
        </v-card>
      </v-col>
      <v-col v-if="!activeUsers.length" cols="12"><div class="empty-state">Add a user in Settings to get started.</div></v-col>
    </v-row>

    <v-row>
      <v-col cols="12" lg="7">
        <v-card class="glass-card pa-2 pa-sm-4 h-100">
          <v-card-title>Chore approvals <v-chip v-if="pending.length" color="warning" size="small" class="ml-2">{{ pending.length }}</v-chip></v-card-title>
          <v-card-text>
            <v-list v-if="pending.length" bg-color="transparent">
              <v-list-item v-for="completion in pending" :key="completion.id" :title="completion.choreTitle" :subtitle="`${completion.userName} · ${formatDate(completion.submittedAt)}`" class="mb-2">
                <template #prepend><v-avatar color="secondary" variant="tonal"><v-icon icon="mdi-broom" /></v-avatar></template>
                <template #append><div class="d-flex ga-2"><v-btn icon="mdi-close" size="small" color="error" variant="tonal" aria-label="Reject" @click="review(completion, 'rejected')" /><v-btn icon="mdi-check" size="small" color="success" variant="tonal" aria-label="Approve" @click="review(completion, 'approved')" /></div></template>
              </v-list-item>
            </v-list>
            <div v-else class="empty-state">Nothing is waiting for approval.</div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" lg="5">
        <v-card class="glass-card pa-2 pa-sm-4 h-100">
          <v-card-title>Recent activity</v-card-title>
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
