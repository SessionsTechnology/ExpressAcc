<template>
  <v-row justify="center">
    <v-col cols="12" md="9" lg="8">
      <header class="page-header user-page-header mb-8">
        <div v-if="!accessReady" class="page-header-copy">
          <p class="eyebrow mb-2">Profile access</p>
          <h1 class="page-heading mb-3">Opening profile…</h1>
        </div>
        <div v-else-if="!token" class="page-header-copy">
          <p class="eyebrow mb-2">Profile access</p>
          <h1 class="page-heading mb-3">Enter your PIN</h1>
          <p class="page-lede">Enter the PIN your admin gave you to continue.</p>
        </div>
        <div v-else-if="state.user" class="page-header-copy">
          <p class="eyebrow mb-2">Welcome</p>
          <h1 class="page-heading mb-3">{{ state.user.name }}</h1>
          <p v-if="state.user.checkoutEnabled" class="page-lede">You have <strong class="text-primary">{{ formatDuration(state.user.timeRemainingSeconds) }}</strong> remaining today.</p>
          <p v-else class="page-lede">Your assigned chores are ready below.</p>
        </div>
        <v-btn to="/checkout" variant="text" prepend-icon="mdi-arrow-left">All users</v-btn>
      </header>

      <v-card v-if="!accessReady" class="panel-card pin-card mx-auto" max-width="520">
        <v-card-text class="pin-card-body text-center">
          <v-progress-circular indeterminate color="primary" size="52" width="5" class="mb-5" />
          <p class="muted mb-0">Checking profile access…</p>
        </v-card-text>
      </v-card>

      <v-card v-else-if="!token" class="panel-card pin-card mx-auto" max-width="520">
        <v-card-text class="pin-card-body text-center">
          <v-avatar color="primary" variant="tonal" size="72" class="mb-6"><v-icon icon="mdi-dialpad" size="38" /></v-avatar>
          <v-alert v-if="error" type="error" variant="tonal" class="mb-5 text-left">{{ error }}</v-alert>
          <v-text-field v-model="pin" label="PIN" type="password" inputmode="numeric" autocomplete="off" autofocus @keyup.enter="unlock" />
          <div class="pin-grid mb-5">
            <v-btn v-for="number in [1,2,3,4,5,6,7,8,9]" :key="number" size="x-large" variant="tonal" @click="pin += number">{{ number }}</v-btn>
            <v-btn size="x-large" variant="tonal" color="warning" icon="mdi-backspace-outline" aria-label="Delete digit" @click="pin = pin.slice(0, -1)" />
            <v-btn size="x-large" variant="tonal" @click="pin += '0'">0</v-btn>
            <v-btn size="x-large" color="primary" icon="mdi-check" aria-label="Continue" :loading="loading" @click="unlock" />
          </div>
        </v-card-text>
      </v-card>

      <template v-else-if="state.user">
        <v-alert v-if="message" type="success" variant="tonal" closable class="mb-5" @click:close="message = ''">{{ message }}</v-alert>
        <v-alert v-if="error" type="error" variant="tonal" closable class="mb-5" @click:close="error = ''">{{ error }}</v-alert>
        <v-card v-if="state.chores.length || !state.user.checkoutEnabled" class="panel-card user-panel" :class="{ 'mb-7': state.user.checkoutEnabled }">
          <v-card-text class="user-panel-body">
            <div class="content-section-header mb-5">
              <div><p class="eyebrow mb-2">Responsibilities and rewards</p><h2 class="section-heading">Chores</h2></div>
            </div>
            <div class="chore-list">
              <div v-for="chore in state.chores" :key="chore.id" class="chore-list-item">
                <v-avatar color="secondary" variant="tonal"><v-icon icon="mdi-broom" /></v-avatar>
                <div class="chore-copy"><h3>{{ chore.title }}</h3><p class="muted text-caption">{{ chore.description || `${chore.recurrence} chore` }}</p></div>
                <v-chip v-if="chore.completionStatus" :color="chore.completionStatus === 'approved' ? 'success' : 'warning'" variant="tonal" class="chore-action">{{ chore.completionStatus === 'pending' ? 'Awaiting approval' : 'Approved' }}</v-chip><v-btn v-else color="secondary" variant="tonal" class="chore-action" @click="completeChore(chore)">{{ choreButtonLabel(chore) }}</v-btn>
              </div>
            </div>
            <div v-if="!state.chores.length" class="empty-state">No chores are assigned right now.</div>
          </v-card-text>
        </v-card>
        <v-card v-if="state.user.checkoutEnabled && state.user.checkout" class="panel-card user-panel mb-7">
          <v-card-text class="user-panel-body">
            <div class="content-section-header mb-5">
              <p class="eyebrow">Currently checked out</p>
            </div>
            <div class="user-checkout-summary">
              <v-avatar color="accent" variant="tonal" size="68"><v-icon icon="mdi-gamepad-variant-outline" size="36" /></v-avatar>
              <div class="user-checkout-copy">
                <h2 class="user-checkout-title">{{ state.user.checkout.item.name }}</h2>
                <p class="muted">{{ state.user.checkout.item.description || 'Shared item' }}</p>
              </div>
              <div class="user-checkout-time">
                <span class="muted text-caption">TIME REMAINING</span>
                <div class="stat-number">{{ formatDuration(state.user.timeRemainingSeconds) }}</div>
              </div>
            </div>
          </v-card-text>
          <v-card-actions class="user-panel-actions">
            <v-spacer />
            <v-btn color="accent" size="large" prepend-icon="mdi-tray-arrow-down" :loading="loading" @click="checkin">Check in item</v-btn>
          </v-card-actions>
        </v-card>
        <v-card v-else-if="state.user.checkoutEnabled" class="panel-card user-panel mb-7">
          <v-card-text class="user-panel-body">
            <div class="content-section-header mb-5">
              <div><p class="eyebrow mb-2">Available now</p><h2 class="section-heading">Choose an item</h2></div>
            </div>
            <v-alert v-if="state.checkoutBlocked" type="warning" variant="tonal" class="mb-5">
              Finish and get approval for {{ requiredChoresRemaining }} required {{ requiredChoresRemaining === 1 ? 'chore' : 'chores' }} before checking out an item.
            </v-alert>
            <v-radio-group v-model="selectedItem" hide-details>
              <v-card
                v-for="item in state.availableItems"
                :key="item.id"
                variant="outlined"
                class="selection-card mb-3 pa-2"
                :class="{ 'clickable': !state.checkoutBlocked, 'selection-card--selected': selectedItem === item.id }"
                @click="selectItem(item.id)"
              >
                <v-radio :value="item.id" color="primary" :disabled="state.checkoutBlocked">
                  <template #label>
                    <div class="available-item-label ml-2">
                      <div class="available-item-heading"><strong>{{ item.name }}</strong><v-chip v-if="item.isTimed" size="x-small" color="warning" variant="tonal">Uses time</v-chip></div>
                      <div class="muted text-caption">{{ item.description }}</div>
                    </div>
                  </template>
                </v-radio>
              </v-card>
            </v-radio-group>
            <div v-if="!state.availableItems.length" class="empty-state">No items are available right now.</div>
          </v-card-text>
          <v-card-actions class="user-panel-actions">
            <v-spacer />
            <v-btn color="primary" size="large" :disabled="!selectedItem || state.checkoutBlocked" :loading="loading" @click="checkout">Check out selection</v-btn>
          </v-card-actions>
        </v-card>
      </template>
    </v-col>
  </v-row>
</template>

<script setup>
import { computed, inject, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api, userApi } from '../lib/api.js'
import { formatDuration } from '../lib/format.js'
const route = useRoute(); const router = useRouter(); const socket = inject('socket')
const userId = route.params.id
const token = ref(sessionStorage.getItem(`expressacc-user-${userId}`) || '')
const pin = ref(''); const selectedItem = ref(''); const loading = ref(false); const error = ref(''); const message = ref('')
const accessReady = ref(false)
const idleTimeoutSeconds = ref(30)
const state = reactive({ user: null, availableItems: [], chores: [], checkoutBlocked: false })
const activityEvents = ['pointerdown', 'keydown', 'touchstart', 'scroll']
let idleTimer; let lastActivityAt = Date.now()
const requiredChoresRemaining = computed(() => state.chores.filter((chore) => chore.requiredForCheckout && chore.completionStatus !== 'approved').length)
const choreButtonLabel = (chore) => {
  if (chore.requiredForCheckout && state.user.checkoutEnabled) return 'Submit required chore'
  return chore.rewardMinutes ? `Submit · +${chore.rewardMinutes}m` : 'Submit chore'
}
async function load() {
  if (!token.value) return
  try { Object.assign(state, await userApi(userId, token.value)) }
  catch (exception) { if (exception.status === 401) { token.value = ''; sessionStorage.removeItem(`expressacc-user-${userId}`) } else error.value = exception.message }
}
async function prepareAccess() {
  try {
    if (token.value) await load()
    if (!token.value) {
      const publicState = await api('/state')
      const publicUser = publicState.users.find((user) => user.id === userId)
      if (!publicUser) throw new Error('User not found.')
      if (!publicUser.hasPin) await unlock()
    }
  } catch (exception) { error.value = exception.message }
  finally { accessReady.value = true }
}
const timeoutMilliseconds = () => Math.max(5, Number(idleTimeoutSeconds.value) || 30) * 1000
function leaveInactiveProfile() {
  if (Date.now() - lastActivityAt < timeoutMilliseconds()) return scheduleIdleTimeout()
  token.value = ''
  sessionStorage.removeItem(`expressacc-user-${userId}`)
  void router.replace('/checkout')
}
function scheduleIdleTimeout() {
  window.clearTimeout(idleTimer)
  const remaining = Math.max(0, timeoutMilliseconds() - (Date.now() - lastActivityAt))
  idleTimer = window.setTimeout(leaveInactiveProfile, remaining)
}
function recordActivity() { lastActivityAt = Date.now(); scheduleIdleTimeout() }
function checkAfterVisibilityChange() { if (!document.hidden) leaveInactiveProfile() }
async function refreshIdleSettings() {
  try {
    const status = await api('/status')
    idleTimeoutSeconds.value = Number(status.kioskTimeoutSeconds) || 30
    scheduleIdleTimeout()
  } catch (exception) { error.value = exception.message }
}
async function unlock() { loading.value = true; error.value = ''; try { const result = await api(`/users/${userId}/unlock`, { method: 'POST', body: { pin: pin.value } }); token.value = result.token; sessionStorage.setItem(`expressacc-user-${userId}`, result.token); await load() } catch (exception) { error.value = exception.message } finally { loading.value = false } }
async function act(path, body, success) { loading.value = true; error.value = ''; try { await userApi(userId, token.value, path, { method: 'POST', body }); message.value = success; selectedItem.value = ''; await load() } catch (exception) { error.value = exception.message } finally { loading.value = false } }
const checkout = () => act('/checkout', { itemId: selectedItem.value }, 'Item checked out.')
const checkin = () => act('/checkin', {}, 'Item checked in. Thank you!')
const completeChore = (chore) => act(`/chores/${chore.id}/complete`, {}, `“${chore.title}” was sent for approval.`)
const selectItem = (itemId) => { if (!state.checkoutBlocked) selectedItem.value = itemId }
const onChanged = () => { if (token.value) load(); else prepareAccess(); refreshIdleSettings() }
onMounted(async () => {
  lastActivityAt = Date.now()
  for (const event of activityEvents) window.addEventListener(event, recordActivity, { passive: true })
  document.addEventListener('visibilitychange', checkAfterVisibilityChange)
  scheduleIdleTimeout()
  await Promise.all([refreshIdleSettings(), prepareAccess()])
  socket.on('state:changed', onChanged)
})
onBeforeUnmount(() => {
  window.clearTimeout(idleTimer)
  for (const event of activityEvents) window.removeEventListener(event, recordActivity)
  document.removeEventListener('visibilitychange', checkAfterVisibilityChange)
  socket.off('state:changed', onChanged)
})
</script>

<style scoped>
.user-page-header {
  align-items: flex-end;
}

.pin-card,
.user-panel {
  overflow: hidden;
}

.pin-card-body,
.user-panel-body {
  padding: 32px;
}

.pin-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.pin-grid .v-btn {
  width: 100% !important;
  min-width: 0 !important;
  height: 58px !important;
}

.pin-grid .v-btn--icon {
  border-radius: 12px !important;
}

.user-panel-actions {
  min-height: 0;
  padding: 0 32px 32px;
}

.user-checkout-summary {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 20px;
}

.user-checkout-copy {
  min-width: 0;
}

.user-checkout-title {
  font-size: clamp(1.5rem, 4vw, 2rem);
  font-weight: 750;
  line-height: 1.15;
  overflow-wrap: anywhere;
}

.user-checkout-copy p {
  margin-top: 6px;
  overflow-wrap: anywhere;
}

.user-checkout-time {
  min-width: max-content;
  text-align: right;
}

.user-checkout-time > span {
  display: block;
  margin-bottom: 2px;
}

.available-item-label {
  min-width: 0;
  padding-block: 4px;
  overflow-wrap: anywhere;
}

.available-item-heading {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-bottom: 2px;
}

.selection-card {
  background: rgba(var(--v-theme-primary), .025);
  transition: border-color .18s ease, background-color .18s ease;
}

.selection-card--selected,
.selection-card:focus-within {
  background: rgba(var(--v-theme-primary), .08);
  border-color: rgb(var(--v-theme-primary)) !important;
}

.chore-list {
  display: grid;
  gap: 10px;
}

.chore-list-item {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;
  padding: 14px;
  border: 1px solid rgba(var(--v-theme-on-surface), .1);
  border-radius: 16px;
  background: rgba(var(--v-theme-secondary), .035);
}

.chore-copy {
  min-width: 0;
}

.chore-copy h3 {
  font-size: 1rem;
  line-height: 1.35;
  overflow-wrap: anywhere;
}

.chore-copy p {
  margin: 3px 0 0;
  line-height: 1.45;
  overflow-wrap: anywhere;
}

.chore-action {
  justify-self: end;
}

@media (max-width: 599px) {
  .user-page-header {
    align-items: flex-start;
  }

  .pin-card-body,
  .user-panel-body {
    padding: 24px;
  }

  .user-panel-actions {
    padding: 0 24px 24px;
  }

  .user-panel-actions .v-btn {
    width: 100%;
  }

  .user-checkout-summary {
    grid-template-columns: auto minmax(0, 1fr);
    gap: 14px;
  }

  .user-checkout-time {
    display: flex;
    grid-column: 1 / -1;
    align-items: baseline;
    justify-content: space-between;
    gap: 16px;
    min-width: 0;
    padding-top: 16px;
    border-top: 1px solid rgba(var(--v-theme-on-surface), .1);
    text-align: left;
  }

  .user-checkout-time > span {
    margin-bottom: 0;
  }

  .chore-list-item { grid-template-columns: auto minmax(0, 1fr); align-items: start; }
  .chore-action { grid-column: 2; justify-self: start; }
}
</style>
