<template>
  <section v-if="ready">
    <div class="d-flex flex-wrap align-center ga-3 mb-7"><div><p class="eyebrow mb-2">Configuration</p><h1 class="text-h3">Settings</h1></div><v-spacer /><v-btn to="/admin" variant="text" prepend-icon="mdi-arrow-left">Dashboard</v-btn></div>
    <v-alert v-if="notice" type="success" variant="tonal" closable class="mb-5" @click:close="notice = ''">{{ notice }}</v-alert>
    <v-alert v-if="error" type="error" variant="tonal" closable class="mb-5" @click:close="error = ''">{{ error }}</v-alert>
    <v-tabs v-model="tab" color="primary" class="mb-6" show-arrows><v-tab value="general">General</v-tab><v-tab value="users">Users</v-tab><v-tab value="items">Items</v-tab><v-tab value="chores">Chores</v-tab><v-tab value="data">Data</v-tab></v-tabs>

    <v-window v-model="tab">
      <v-window-item value="general">
        <v-card class="glass-card pa-3 pa-sm-6"><v-card-text><h2 class="section-heading mb-5">Application</h2><v-text-field v-model="settings.applicationName" label="Application name" /><v-select v-model="settings.timeZone" :items="timeZones" label="Time zone" /><v-text-field v-model="settings.password" label="New admin password" type="password" hint="Leave blank to keep the current password" persistent-hint class="mb-6" />
          <h2 class="section-heading mb-2">Daily timed-device allowance</h2><p class="muted mb-5">Minutes reset at the start of each day in the selected time zone.</p><v-row><v-col v-for="day in weekdays" :key="day" cols="12" sm="6" md="4"><v-text-field v-model.number="settings.dailyTimeMinutes[day]" :label="day" type="number" min="0" max="1440" suffix="minutes" /></v-col></v-row>
        </v-card-text><v-card-actions><v-spacer /><v-btn color="primary" size="large" :loading="saving" @click="saveSettings">Save general settings</v-btn></v-card-actions></v-card>
      </v-window-item>

      <v-window-item value="users">
        <v-card class="glass-card pa-3 pa-sm-6"><v-card-text><div class="d-flex align-center mb-5"><div><h2 class="section-heading">Household users</h2><p class="muted">PIN changes are optional and never displayed after saving.</p></div><v-spacer /><v-btn color="primary" prepend-icon="mdi-plus" @click="addUser">Add user</v-btn></div>
          <v-card v-for="(user,index) in users" :key="user.id || index" variant="outlined" class="pa-4 mb-3"><v-row align="center"><v-col cols="12" sm="4"><v-text-field v-model="user.name" label="Name" hide-details /></v-col><v-col cols="12" sm="3"><v-text-field v-model="user.pin" :label="user.hasPin ? 'New PIN (optional)' : 'PIN (optional)'" type="password" inputmode="numeric" hide-details /></v-col><v-col cols="6" sm="2"><v-switch v-model="user.disabled" label="Disabled" color="warning" hide-details /></v-col><v-col cols="6" sm="3" class="text-right"><v-btn v-if="user.hasPin" size="small" variant="text" @click="user.clearPin = !user.clearPin">{{ user.clearPin ? 'Keep PIN' : 'Remove PIN' }}</v-btn><v-btn icon="mdi-delete-outline" color="error" variant="text" aria-label="Delete user" @click="users.splice(index,1)" /></v-col></v-row></v-card><div v-if="!users.length" class="empty-state">No users yet.</div>
        </v-card-text><v-card-actions><v-spacer /><v-btn color="primary" size="large" :loading="saving" @click="saveCollection('users', users)">Save users</v-btn></v-card-actions></v-card>
      </v-window-item>

      <v-window-item value="items">
        <v-card class="glass-card pa-3 pa-sm-6"><v-card-text><div class="d-flex align-center mb-5"><div><h2 class="section-heading">Shared items</h2><p class="muted">Timed items count down a user’s daily allowance.</p></div><v-spacer /><v-btn color="primary" prepend-icon="mdi-plus" @click="items.push({ name: '', description: '', isTimed: true, disabled: false })">Add item</v-btn></div>
          <v-card v-for="(item,index) in items" :key="item.id || index" variant="outlined" class="pa-4 mb-3"><v-row align="center"><v-col cols="12" sm="3"><v-text-field v-model="item.name" label="Item name" hide-details /></v-col><v-col cols="12" sm="4"><v-text-field v-model="item.description" label="Description" hide-details /></v-col><v-col cols="6" sm="2"><v-switch v-model="item.isTimed" label="Timed" color="warning" hide-details /></v-col><v-col cols="6" sm="2"><v-switch v-model="item.disabled" label="Disabled" hide-details /></v-col><v-col cols="12" sm="1" class="text-right"><v-btn icon="mdi-delete-outline" color="error" variant="text" aria-label="Delete item" @click="items.splice(index,1)" /></v-col></v-row></v-card><div v-if="!items.length" class="empty-state">No items yet.</div>
        </v-card-text><v-card-actions><v-spacer /><v-btn color="primary" size="large" :loading="saving" @click="saveCollection('items', items)">Save items</v-btn></v-card-actions></v-card>
      </v-window-item>

      <v-window-item value="chores">
        <v-card class="glass-card pa-3 pa-sm-6"><v-card-text><div class="d-flex align-center mb-5"><div><h2 class="section-heading">Chores and rewards</h2><p class="muted">Submitted chores require admin approval before time is awarded.</p></div><v-spacer /><v-btn color="primary" prepend-icon="mdi-plus" @click="addChore">Add chore</v-btn></div>
          <v-card v-for="(chore,index) in chores" :key="chore.id || index" variant="outlined" class="pa-4 mb-4"><v-row><v-col cols="12" md="4"><v-text-field v-model="chore.title" label="Chore" /><v-text-field v-model="chore.description" label="Description" /></v-col><v-col cols="12" sm="6" md="2"><v-text-field v-model.number="chore.rewardMinutes" type="number" min="0" label="Reward" suffix="minutes" /></v-col><v-col cols="12" sm="6" md="2"><v-select v-model="chore.recurrence" :items="recurrences" label="Repeats" /></v-col><v-col cols="12" md="3"><v-select v-model="chore.assignedUserIds" :items="users" item-title="name" item-value="id" label="Assigned users" multiple chips hint="Empty means everyone" persistent-hint /></v-col><v-col cols="12" md="1" class="text-right"><v-switch v-model="chore.disabled" label="Off" hide-details /><v-btn icon="mdi-delete-outline" color="error" variant="text" aria-label="Delete chore" @click="chores.splice(index,1)" /></v-col></v-row></v-card><div v-if="!chores.length" class="empty-state">No chores yet.</div>
        </v-card-text><v-card-actions><v-spacer /><v-btn color="primary" size="large" :loading="saving" @click="saveCollection('chores', chores)">Save chores</v-btn></v-card-actions></v-card>
      </v-window-item>

      <v-window-item value="data">
        <v-row><v-col cols="12" md="6"><v-card class="glass-card pa-5 h-100"><v-card-text><v-avatar color="success" variant="tonal" class="mb-5"><v-icon icon="mdi-download" /></v-avatar><h2 class="section-heading mb-2">Download backup</h2><p class="muted mb-6">Export settings, users, items, checkouts, chores, and activity as one JSON file.</p><v-btn color="success" href="/api/admin/export" prepend-icon="mdi-download">Download backup</v-btn></v-card-text></v-card></v-col>
          <v-col cols="12" md="6"><v-card class="glass-card pa-5 h-100"><v-card-text><v-avatar color="warning" variant="tonal" class="mb-5"><v-icon icon="mdi-upload" /></v-avatar><h2 class="section-heading mb-2">Restore backup</h2><p class="muted mb-6">This replaces current application data. The current admin password remains valid.</p><v-file-input v-model="backupFile" label="ExpressACC JSON backup" accept="application/json,.json" prepend-icon="" /><v-btn color="warning" :disabled="!backupFile" :loading="saving" prepend-icon="mdi-upload" @click="restore">Restore backup</v-btn></v-card-text></v-card></v-col></v-row>
      </v-window-item>
    </v-window>
  </section>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '../lib/api.js'
const router = useRouter(); const ready = ref(false); const saving = ref(false); const tab = ref('general'); const error = ref(''); const notice = ref(''); const backupFile = ref(null)
const weekdays = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']; const recurrences = [{title:'One time',value:'once'},{title:'Daily',value:'daily'},{title:'Weekly',value:'weekly'}]
const guessedZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'; const timeZones = typeof Intl.supportedValuesOf === 'function' ? Intl.supportedValuesOf('timeZone') : [guessedZone, 'UTC']
const settings = reactive({ applicationName:'', password:'', timeZone:guessedZone, dailyTimeMinutes:Object.fromEntries(weekdays.map(day => [day,0])) }); const users = ref([]); const items = ref([]); const chores = ref([])
async function load() { try { const state = await api('/admin/state'); Object.assign(settings, state.settings, { password: '' }); users.value = state.users.map(user => ({ ...user, pin:'', clearPin:false })); items.value = state.items; chores.value = state.chores } catch (exception) { if (exception.status === 401) return router.replace('/admin/login'); error.value = exception.message } finally { ready.value = true } }
function addUser() { users.value.push({ name:'', pin:'', disabled:false, hasPin:false, clearPin:false }) }
function addChore() { chores.value.push({ title:'', description:'', rewardMinutes:15, recurrence:'daily', assignedUserIds:[], disabled:false }) }
async function run(action, success) { saving.value = true; error.value = ''; notice.value = ''; try { await action(); notice.value = success; await load() } catch (exception) { error.value = exception.message } finally { saving.value = false } }
const saveSettings = () => run(() => api('/admin/settings', { method:'PATCH', body:settings }), 'General settings saved.')
const saveCollection = (name, collection) => run(() => api(`/admin/${name}`, { method:'PUT', body:collection }), `${name[0].toUpperCase()+name.slice(1)} saved.`)
async function restore() { const file = Array.isArray(backupFile.value) ? backupFile.value[0] : backupFile.value; if (!file) return; await run(async () => api('/admin/import', { method:'POST', body:JSON.parse(await file.text()) }), 'Backup restored.') }
onMounted(load)
</script>
