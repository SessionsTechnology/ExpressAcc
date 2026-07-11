<template>
  <v-row justify="center">
    <v-col cols="12" md="9" lg="8">
      <div class="d-flex align-center mb-7"><v-btn to="/checkout" variant="text" prepend-icon="mdi-arrow-left">All users</v-btn></div>
      <v-card v-if="!token" class="glass-card pa-3 pa-sm-6 mx-auto" max-width="520">
        <v-card-text class="text-center">
          <v-avatar color="primary" variant="tonal" size="72" class="mb-5"><v-icon icon="mdi-dialpad" size="38" /></v-avatar>
          <h1 class="text-h4 mb-2">Enter your PIN</h1>
          <p class="muted mb-6">Use the PIN your admin gave you. If you don’t have one, just continue.</p>
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
        <div class="mb-8"><p class="eyebrow mb-2">Welcome</p><h1 class="text-h3 mb-2">{{ state.user.name }}</h1><p class="muted">You have <strong class="text-primary">{{ formatDuration(state.user.timeRemainingSeconds) }}</strong> remaining today.</p></div>
        <v-alert v-if="message" type="success" variant="tonal" closable class="mb-5" @click:close="message = ''">{{ message }}</v-alert>
        <v-alert v-if="error" type="error" variant="tonal" closable class="mb-5" @click:close="error = ''">{{ error }}</v-alert>
        <v-card v-if="state.user.checkout" class="glass-card pa-3 pa-sm-6 mb-7">
          <v-card-text><p class="eyebrow mb-3">Currently checked out</p><div class="d-flex flex-wrap align-center ga-5"><v-avatar color="accent" variant="tonal" size="68"><v-icon icon="mdi-gamepad-variant-outline" size="36" /></v-avatar><div><h2 class="text-h4">{{ state.user.checkout.item.name }}</h2><p class="muted">{{ state.user.checkout.item.description || 'Shared item' }}</p></div><v-spacer /><div class="stat-number">{{ formatDuration(state.user.timeRemainingSeconds) }}</div></div></v-card-text>
          <v-card-actions><v-spacer /><v-btn color="accent" size="large" prepend-icon="mdi-tray-arrow-down" :loading="loading" @click="checkin">Check in item</v-btn></v-card-actions>
        </v-card>
        <v-card v-else class="glass-card pa-3 pa-sm-6 mb-7">
          <v-card-text><p class="eyebrow mb-3">Available now</p><h2 class="section-heading mb-5">Choose an item</h2>
            <v-radio-group v-model="selectedItem">
              <v-card v-for="item in state.availableItems" :key="item.id" variant="outlined" class="mb-3 pa-2 clickable" @click="selectedItem = item.id"><v-radio :value="item.id" color="primary"><template #label><div class="ml-2"><strong>{{ item.name }}</strong><v-chip v-if="item.isTimed" size="x-small" color="warning" variant="tonal" class="ml-2">Uses time</v-chip><div class="muted text-caption">{{ item.description }}</div></div></template></v-radio></v-card>
            </v-radio-group>
            <div v-if="!state.availableItems.length" class="empty-state">No items are available right now.</div>
          </v-card-text>
          <v-card-actions><v-spacer /><v-btn color="primary" size="large" :disabled="!selectedItem" :loading="loading" @click="checkout">Check out selection</v-btn></v-card-actions>
        </v-card>
        <v-card class="glass-card pa-3 pa-sm-6">
          <v-card-text><p class="eyebrow mb-3">Earn more time</p><h2 class="section-heading mb-5">Chores</h2>
            <v-list bg-color="transparent" lines="three">
              <v-list-item v-for="chore in state.chores" :key="chore.id" :title="chore.title" :subtitle="chore.description || `${chore.recurrence} chore`" class="mb-2">
                <template #prepend><v-avatar color="secondary" variant="tonal"><v-icon icon="mdi-broom" /></v-avatar></template>
                <template #append><v-chip v-if="chore.completionStatus" :color="chore.completionStatus === 'approved' ? 'success' : 'warning'" variant="tonal">{{ chore.completionStatus }}</v-chip><v-btn v-else color="secondary" variant="tonal" @click="completeChore(chore)">Submit · +{{ chore.rewardMinutes }}m</v-btn></template>
              </v-list-item>
            </v-list>
            <div v-if="!state.chores.length" class="empty-state">No chores are assigned right now.</div>
          </v-card-text>
        </v-card>
      </template>
    </v-col>
  </v-row>
</template>

<script setup>
import { inject, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api, userApi } from '../lib/api.js'
import { formatDuration } from '../lib/format.js'
const route = useRoute(); const router = useRouter(); const socket = inject('socket')
const userId = route.params.id
const token = ref(sessionStorage.getItem(`expressacc-user-${userId}`) || '')
const pin = ref(''); const selectedItem = ref(''); const loading = ref(false); const error = ref(''); const message = ref('')
const state = reactive({ user: null, availableItems: [], chores: [] })
async function load() {
  if (!token.value) return
  try { Object.assign(state, await userApi(userId, token.value)) }
  catch (exception) { if (exception.status === 401) { token.value = ''; sessionStorage.removeItem(`expressacc-user-${userId}`) } else error.value = exception.message }
}
async function unlock() { loading.value = true; error.value = ''; try { const result = await api(`/users/${userId}/unlock`, { method: 'POST', body: { pin: pin.value } }); token.value = result.token; sessionStorage.setItem(`expressacc-user-${userId}`, result.token); await load() } catch (exception) { error.value = exception.message } finally { loading.value = false } }
async function act(path, body, success) { loading.value = true; error.value = ''; try { await userApi(userId, token.value, path, { method: 'POST', body }); message.value = success; selectedItem.value = ''; await load() } catch (exception) { error.value = exception.message } finally { loading.value = false } }
const checkout = () => act('/checkout', { itemId: selectedItem.value }, 'Item checked out.')
const checkin = () => act('/checkin', {}, 'Item checked in. Thank you!')
const completeChore = (chore) => act(`/chores/${chore.id}/complete`, {}, `“${chore.title}” was sent for approval.`)
const onChanged = () => load()
onMounted(async () => { if (token.value) await load(); socket.on('state:changed', onChanged) })
onBeforeUnmount(() => socket.off('state:changed', onChanged))
</script>

<style scoped>.pin-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }</style>
