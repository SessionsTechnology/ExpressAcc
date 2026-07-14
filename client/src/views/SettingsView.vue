<template>
  <section v-if="ready" class="settings-page">
    <div class="page-header settings-page-header mb-7">
      <div class="page-header-copy"><p class="eyebrow mb-3">Parent dashboard</p><h1 class="page-heading">Settings</h1><p class="page-lede mt-4 mb-0">Make the family space work the way your household does.</p></div>
      <div class="settings-header-actions"><v-btn to="/admin" variant="text" prepend-icon="mdi-arrow-left">Dashboard</v-btn></div>
    </div>
    <div class="settings-tabs-rail mb-6">
      <v-tabs v-model="tab" color="primary" class="settings-tabs" show-arrows><v-tab class="settings-tab" value="general" prepend-icon="mdi-tune-variant">General</v-tab><v-tab class="settings-tab" value="users" prepend-icon="mdi-account-group-outline">Users</v-tab><v-tab class="settings-tab" value="items" prepend-icon="mdi-package-variant-closed">Items</v-tab><v-tab class="settings-tab" value="chores" prepend-icon="mdi-broom">Chores</v-tab><v-tab class="settings-tab" value="data" prepend-icon="mdi-database-outline">Data</v-tab></v-tabs>
    </div>

    <v-window v-model="tab">
      <v-window-item value="general">
        <v-card class="glass-card panel-card settings-panel pa-3 pa-sm-6"><v-card-text><h2 class="section-heading mb-5">Application</h2><v-text-field v-model="settings.applicationName" :disabled="saving" label="Application name" />
          <div class="appearance-setting mb-6"><v-avatar color="primary" variant="tonal" size="48"><v-icon :icon="settings.darkMode ? 'mdi-weather-night' : 'mdi-white-balance-sunny'" /></v-avatar><div class="appearance-setting-copy"><h3>Dark mode</h3><p class="muted">Use the darker color theme on every connected screen. This switch saves automatically.</p></div><v-switch :model-value="settings.darkMode" :disabled="saving || savingDarkMode || hasEntryOperations" :loading="savingDarkMode" color="primary" inset hide-details aria-label="Dark mode" @update:model-value="saveDarkMode" /></div>
          <v-select v-model="settings.timeZone" :disabled="saving" :items="timeZones" label="Time zone" /><v-text-field v-model="settings.password" :disabled="saving" label="New admin password" type="password" hint="Leave blank to keep the current password" persistent-hint class="mb-6" />
          <h2 class="section-heading mb-2">Kiosk</h2><p class="muted mb-5">Show a household-wide message and return inactive user profiles to the kiosk automatically.</p><v-textarea v-model="settings.kioskMessage" :disabled="saving" label="Kiosk message" hint="Leave blank to hide the message" persistent-hint maxlength="500" counter auto-grow rows="2" class="mb-4" /><v-text-field v-model.number="settings.kioskTimeoutSeconds" :disabled="saving" label="User profile inactivity timeout" type="number" min="5" max="3600" suffix="seconds" hint="Between 5 seconds and 1 hour" persistent-hint class="mb-7" />
          <h2 class="section-heading mb-2">Daily timed-device allowance</h2><p class="muted mb-5">Minutes reset at the start of each day in the selected time zone.</p><v-row><v-col v-for="day in weekdays" :key="day" cols="12" sm="6" md="4"><v-text-field v-model.number="settings.dailyTimeMinutes[day]" :disabled="saving" :label="day" type="number" min="0" max="1440" suffix="minutes" /></v-col></v-row>
        </v-card-text><v-card-actions class="settings-card-actions"><v-btn color="primary" size="large" :loading="saving" :disabled="savingDarkMode || hasEntryOperations" @click="saveSettings">Save general settings</v-btn></v-card-actions></v-card>
      </v-window-item>

      <v-window-item value="users">
        <v-card class="glass-card panel-card settings-panel pa-3 pa-sm-6"><v-card-text><div class="content-section-header settings-toolbar mb-5"><div><h2 class="section-heading">Household users</h2><p class="muted">Save each user separately. Checkout and disabled switches save automatically after the first save.</p></div><v-btn color="primary" prepend-icon="mdi-plus" :disabled="saving" @click="addUser">Add user</v-btn></div>
          <v-card v-for="user in users" :key="accordionValue(user, 'user')" variant="outlined" class="settings-entry pa-4 mb-3">
            <div class="settings-user-grid">
              <v-text-field v-model="user.name" :disabled="isEntryBusy(user)" label="Name" hide-details />
              <v-text-field v-model="user.pin" :disabled="isEntryBusy(user)" :label="user.hasPin ? 'New PIN (optional)' : 'PIN (optional)'" type="password" inputmode="numeric" hide-details />
              <div class="settings-entry-controls">
                <v-switch :model-value="user.checkoutEnabled" :disabled="isEntryBusy(user)" :loading="entryOperation(user) === 'toggle-checkoutEnabled'" label="Checkout access" color="primary" hide-details class="settings-switch" @update:model-value="saveToggle('users', user, 'checkoutEnabled', $event)" />
                <v-switch :model-value="user.disabled" :disabled="isEntryBusy(user)" :loading="entryOperation(user) === 'toggle-disabled'" label="Disabled" color="warning" hide-details class="settings-switch" @update:model-value="saveToggle('users', user, 'disabled', $event)" />
                <div class="settings-entry-actions">
                  <v-btn v-if="user.hasPin" size="small" variant="text" :loading="entryOperation(user) === 'pin'" :disabled="isEntryBusy(user)" @click="clearUserPin(user)">Remove PIN</v-btn>
                  <v-btn color="primary" variant="tonal" prepend-icon="mdi-content-save-outline" :loading="entryOperation(user) === 'save'" :disabled="isEntryBusy(user)" @click="saveEntry('users', user)">Save user</v-btn>
                  <v-btn icon="mdi-delete-outline" color="error" variant="text" :loading="entryOperation(user) === 'delete'" :disabled="isEntryBusy(user)" aria-label="Delete user" @click="requestRemove('users', user)" />
                </div>
              </div>
            </div>
          </v-card><div v-if="!users.length" class="empty-state">No users yet.</div>
        </v-card-text></v-card>
      </v-window-item>

      <v-window-item value="items">
        <v-card class="glass-card panel-card settings-panel pa-3 pa-sm-6"><v-card-text><div class="content-section-header settings-toolbar mb-5"><div><h2 class="section-heading">Shared items</h2><p class="muted">Save each item separately. Timed and disabled switches save automatically after the first save.</p></div><v-btn color="primary" prepend-icon="mdi-plus" :disabled="saving" @click="addItem">Add item</v-btn></div>
          <v-expansion-panels v-model="openItem" variant="accordion" class="settings-accordion">
            <v-expansion-panel v-for="item in items" :key="accordionValue(item, 'item')" :value="accordionValue(item, 'item')" class="settings-entry">
              <v-expansion-panel-title class="settings-accordion-title">{{ item.name?.trim() || 'New item' }}</v-expansion-panel-title>
              <v-expansion-panel-text>
                <div class="settings-item-grid">
                  <v-text-field v-model="item.name" :disabled="isEntryBusy(item)" label="Item name" hide-details class="item-name" />
                  <v-text-field v-model="item.description" :disabled="isEntryBusy(item)" label="Description" hide-details class="item-description" />
                  <v-select v-model="item.assignedUserIds" :disabled="isEntryBusy(item)" :items="assignableUsers" item-title="name" item-value="id" label="Assigned users" multiple chips clearable hint="Empty means everyone with checkout access" persistent-hint class="item-assignees" />
                  <div class="settings-entry-controls item-controls"><v-switch :model-value="item.isTimed" :disabled="isEntryBusy(item)" :loading="entryOperation(item) === 'toggle-isTimed'" label="Timed" color="warning" hide-details class="settings-switch" @update:model-value="saveToggle('items', item, 'isTimed', $event)" /><v-switch :model-value="item.disabled" :disabled="isEntryBusy(item)" :loading="entryOperation(item) === 'toggle-disabled'" label="Disabled" hide-details class="settings-switch" @update:model-value="saveToggle('items', item, 'disabled', $event)" /></div>
                </div>
                <div class="settings-inline-actions mt-4"><v-btn color="primary" variant="tonal" prepend-icon="mdi-content-save-outline" :loading="entryOperation(item) === 'save'" :disabled="isEntryBusy(item)" @click="saveEntry('items', item)">Save item</v-btn><v-btn color="error" variant="text" prepend-icon="mdi-delete-outline" :loading="entryOperation(item) === 'delete'" :disabled="isEntryBusy(item)" @click="requestRemove('items', item)">Delete item</v-btn></div>
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels><div v-if="!items.length" class="empty-state">No items yet.</div>
        </v-card-text></v-card>
      </v-window-item>

      <v-window-item value="chores">
        <v-card class="glass-card panel-card settings-panel pa-3 pa-sm-6"><v-card-text><div class="content-section-header settings-toolbar mb-5"><div><h2 class="section-heading">Chores and rewards</h2><p class="muted">Save each chore separately. The Off switch saves automatically after the first save.</p></div><v-btn color="primary" prepend-icon="mdi-plus" :disabled="saving" @click="addChore">Add chore</v-btn></div>
          <v-expansion-panels v-model="openChore" variant="accordion" class="settings-accordion">
            <v-expansion-panel v-for="chore in chores" :key="accordionValue(chore, 'chore')" :value="accordionValue(chore, 'chore')" class="settings-entry">
              <v-expansion-panel-title class="settings-accordion-title">{{ chore.title?.trim() || 'New chore' }}</v-expansion-panel-title>
              <v-expansion-panel-text><div class="settings-chore-grid"><v-text-field v-model="chore.title" :disabled="isEntryBusy(chore)" label="Chore" hide-details="auto" class="chore-title" /><v-text-field v-model="chore.description" :disabled="isEntryBusy(chore)" label="Description" hide-details="auto" class="chore-description" /><v-text-field v-model.number="chore.rewardMinutes" :disabled="isEntryBusy(chore)" type="number" min="0" label="Reward" suffix="minutes" hide-details="auto" class="chore-reward" /><v-select v-model="chore.recurrence" :disabled="isEntryBusy(chore)" :items="recurrences" label="Repeats" hide-details="auto" class="chore-recurrence" /><v-select v-model="chore.assignedUserIds" :disabled="isEntryBusy(chore)" :items="assignableUsers" item-title="name" item-value="id" label="Assigned users" multiple chips hint="Empty means everyone" persistent-hint class="chore-assignees" /><div class="settings-chore-actions"><v-switch :model-value="chore.disabled" :disabled="isEntryBusy(chore)" :loading="entryOperation(chore) === 'toggle-disabled'" label="Off" hide-details class="settings-switch" @update:model-value="saveToggle('chores', chore, 'disabled', $event)" /></div></div><div class="settings-inline-actions mt-4"><v-btn color="primary" variant="tonal" prepend-icon="mdi-content-save-outline" :loading="entryOperation(chore) === 'save'" :disabled="isEntryBusy(chore)" @click="saveEntry('chores', chore)">Save chore</v-btn><v-btn color="error" variant="text" prepend-icon="mdi-delete-outline" :loading="entryOperation(chore) === 'delete'" :disabled="isEntryBusy(chore)" @click="requestRemove('chores', chore)">Delete chore</v-btn></div></v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels><div v-if="!chores.length" class="empty-state">No chores yet.</div>
        </v-card-text></v-card>
      </v-window-item>

      <v-window-item value="data">
        <v-row class="data-card-grid"><v-col cols="12" md="6"><v-card class="glass-card panel-card data-card data-card--backup pa-5 h-100"><v-card-text class="data-card__content"><v-avatar color="success" variant="tonal" class="data-card__icon mb-5"><v-icon icon="mdi-download" /></v-avatar><h2 class="section-heading mb-2">Download backup</h2><p class="muted mb-6">Export settings, users, items, checkouts, chores, and activity as one JSON file.</p><v-spacer /><v-btn class="data-card__action" color="success" href="/api/admin/export" prepend-icon="mdi-download">Download backup</v-btn></v-card-text></v-card></v-col>
          <v-col cols="12" md="6"><v-card class="glass-card panel-card data-card data-card--restore pa-5 h-100"><v-card-text class="data-card__content"><v-avatar color="warning" variant="tonal" class="data-card__icon mb-5"><v-icon icon="mdi-upload" /></v-avatar><h2 class="section-heading mb-2">Restore backup</h2><p class="muted mb-6">This replaces current application data. The current admin password remains valid.</p><v-file-input v-model="backupFile" :disabled="saving || hasEntryOperations" label="ExpressACC JSON backup" accept="application/json,.json" prepend-icon="" /><v-spacer /><v-btn class="data-card__action" color="warning" :disabled="!backupFile || hasEntryOperations || savingDarkMode" :loading="saving" prepend-icon="mdi-upload" @click="restore">Restore backup</v-btn></v-card-text></v-card></v-col></v-row>
      </v-window-item>
    </v-window>
    <v-dialog v-model="deleteDialog" :persistent="deleteBusy" max-width="460">
      <v-card class="pa-2"><v-card-title>Delete {{ deleteType }}?</v-card-title><v-card-text>Delete “{{ deleteName }}”? This cannot be undone.</v-card-text><v-card-actions><v-spacer /><v-btn :disabled="deleteBusy" @click="deleteDialog = false">Cancel</v-btn><v-btn color="error" :loading="deleteBusy" @click="confirmRemove">Delete</v-btn></v-card-actions></v-card>
    </v-dialog>
    <v-snackbar :model-value="snackbar.open" :color="snackbar.color" location="bottom end" :timeout="4500" :role="snackbar.color === 'error' ? 'alert' : 'status'" :aria-live="snackbar.color === 'error' ? 'assertive' : 'polite'" aria-atomic="true" @update:model-value="setSnackbarOpen">
      <div class="snackbar-content"><v-icon :icon="snackbar.color === 'success' ? 'mdi-check-circle-outline' : 'mdi-alert-circle-outline'" /><span>{{ snackbar.message }}</span></div>
      <template #actions><v-btn variant="text" @click="setSnackbarOpen(false)">Close</v-btn></template>
    </v-snackbar>
  </section>
</template>

<script setup>
import { computed, nextTick, onMounted, reactive, ref, toRaw } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '../lib/api.js'
const router = useRouter(); const ready = ref(false); const saving = ref(false); const savingDarkMode = ref(false); const tab = ref('general'); const backupFile = ref(null); const openItem = ref(null); const openChore = ref(null)
const weekdays = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']; const recurrences = [{title:'One time',value:'once'},{title:'Daily',value:'daily'},{title:'Weekly',value:'weekly'}]
const guessedZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'; const timeZones = typeof Intl.supportedValuesOf === 'function' ? Intl.supportedValuesOf('timeZone') : [guessedZone, 'UTC']
const settings = reactive({ applicationName:'', password:'', timeZone:guessedZone, darkMode:false, kioskMessage:'', kioskTimeoutSeconds:30, dailyTimeMinutes:Object.fromEntries(weekdays.map(day => [day,0])) }); const users = ref([]); const items = ref([]); const chores = ref([])
const snackbar = reactive({ open:false, color:'success', message:'' }); const snackbarQueue = []; const entryOperations = reactive(new Map()); const deleteTarget = ref(null)
const assignableUsers = computed(() => users.value.filter((user) => user.id && !user.disabled))
const hasEntryOperations = computed(() => entryOperations.size > 0)
const deleteBusy = computed(() => Boolean(deleteTarget.value && entryOperation(deleteTarget.value.entry) === 'delete'))
const deleteDialog = computed({ get:() => Boolean(deleteTarget.value), set:(value) => { if (!value && !deleteBusy.value) deleteTarget.value = null } })
const deleteType = computed(() => deleteTarget.value ? entryConfig[deleteTarget.value.kind].singular.toLowerCase() : 'entry')
const deleteName = computed(() => deleteTarget.value?.entry.name || deleteTarget.value?.entry.title || `this ${deleteType.value}`)
const accordionValues = new WeakMap(); let nextAccordionValue = 0
function accordionValue(entry, type) { const rawEntry = toRaw(entry); if (rawEntry.id) return `${type}-${rawEntry.id}`; if (!accordionValues.has(rawEntry)) accordionValues.set(rawEntry, `${type}-new-${++nextAccordionValue}`); return accordionValues.get(rawEntry) }
function showNextSnackbar() { if (!snackbar.open && snackbarQueue.length) Object.assign(snackbar, snackbarQueue.shift(), { open:true }) }
function showSnackbar(message, color = 'success') {
  const notification = { color, message }
  if (color === 'error') snackbarQueue.unshift(notification); else snackbarQueue.push(notification)
  if (snackbar.open && color === 'error' && snackbar.color !== 'error') snackbar.open = false
  nextTick(showNextSnackbar)
}
function setSnackbarOpen(value) { snackbar.open = value; if (!value) nextTick(showNextSnackbar) }
function entryOperation(entry) { return entryOperations.get(entry) || '' }
function isEntryBusy(entry) { return saving.value || Boolean(entryOperation(entry)) }
async function load() { try { const state = await api('/admin/state'); Object.assign(settings, state.settings, { password: '' }); users.value = state.users.map(user => ({ ...user, pin:'', clearPin:false })); items.value = state.items; chores.value = state.chores } catch (exception) { if (exception.status === 401) return router.replace('/admin/login'); showSnackbar(exception.message, 'error') } finally { ready.value = true } }
function addUser() { users.value.unshift({ name:'', pin:'', disabled:false, checkoutEnabled:true, hasPin:false, clearPin:false }) }
function addItem() { const item = { name:'', description:'', isTimed:true, disabled:false, assignedUserIds:[] }; items.value.unshift(item); openItem.value = accordionValue(item, 'item') }
function addChore() { const chore = { title:'', description:'', rewardMinutes:15, recurrence:'daily', assignedUserIds:[], disabled:false }; chores.value.unshift(chore); openChore.value = accordionValue(chore, 'chore') }
const entryConfig = {
  users: { singular:'User', collection:users, type:'user' },
  items: { singular:'Item', collection:items, type:'item' },
  chores: { singular:'Chore', collection:chores, type:'chore' },
}
function entryPayload(kind, entry) {
  if (kind === 'users') return { name:entry.name, pin:entry.pin || undefined, disabled:entry.disabled, checkoutEnabled:entry.checkoutEnabled }
  if (kind === 'items') return { name:entry.name, description:entry.description, isTimed:entry.isTimed, disabled:entry.disabled, assignedUserIds:entry.assignedUserIds }
  return { title:entry.title, description:entry.description, rewardMinutes:entry.rewardMinutes, recurrence:entry.recurrence, assignedUserIds:entry.assignedUserIds, disabled:entry.disabled }
}
function keepAccordionOpen(kind, entry, previousValue) {
  if (kind === 'items' && openItem.value === previousValue) openItem.value = accordionValue(entry, 'item')
  if (kind === 'chores' && openChore.value === previousValue) openChore.value = accordionValue(entry, 'chore')
}
async function saveEntry(kind, entry) {
  if (isEntryBusy(entry)) return
  const config = entryConfig[kind]; const creating = !entry.id; const previousValue = accordionValue(entry, config.type)
  entryOperations.set(entry, 'save')
  try {
    const saved = await api(`/admin/${kind}${creating ? '' : `/${entry.id}`}`, { method:creating ? 'POST' : 'PATCH', body:entryPayload(kind, entry) })
    Object.assign(entry, saved)
    if (kind === 'users') Object.assign(entry, { pin:'', clearPin:false })
    keepAccordionOpen(kind, entry, previousValue)
    showSnackbar(`${config.singular} saved.`)
    return true
  } catch (exception) { showSnackbar(exception.message, 'error'); return false }
  finally { entryOperations.delete(entry) }
}
async function saveToggle(kind, entry, field, value) {
  if (isEntryBusy(entry)) return
  const previous = entry[field]
  entry[field] = value
  if (!entry.id) return
  entryOperations.set(entry, `toggle-${field}`)
  try {
    await api(`/admin/${kind}/${entry.id}`, { method:'PATCH', body:{ [field]:value } })
    showSnackbar(`${entryConfig[kind].singular} setting saved.`)
  } catch (exception) { entry[field] = previous; showSnackbar(exception.message, 'error') }
  finally { entryOperations.delete(entry) }
}
async function clearUserPin(user) {
  if (!user.id || isEntryBusy(user)) return
  entryOperations.set(user, 'pin')
  try {
    await api(`/admin/users/${user.id}`, { method:'PATCH', body:{ clearPin:true } })
    Object.assign(user, { hasPin:false, pin:'', clearPin:false })
    showSnackbar('User PIN removed.')
  } catch (exception) { showSnackbar(exception.message, 'error') }
  finally { entryOperations.delete(user) }
}
async function removeEntry(kind, entry) {
  if (isEntryBusy(entry)) return
  const config = entryConfig[kind]; const collection = config.collection.value
  if (!entry.id) {
    const index = collection.indexOf(entry); if (index >= 0) collection.splice(index, 1)
    if (kind === 'items' && openItem.value === accordionValue(entry, 'item')) openItem.value = null
    if (kind === 'chores' && openChore.value === accordionValue(entry, 'chore')) openChore.value = null
    showSnackbar(`Unsaved ${config.singular.toLowerCase()} removed.`)
    return true
  }
  entryOperations.set(entry, 'delete')
  try {
    await api(`/admin/${kind}/${entry.id}`, { method:'DELETE' })
    const index = collection.indexOf(entry); if (index >= 0) collection.splice(index, 1)
    if (kind === 'items' && openItem.value === accordionValue(entry, 'item')) openItem.value = null
    if (kind === 'chores' && openChore.value === accordionValue(entry, 'chore')) openChore.value = null
    showSnackbar(`${config.singular} deleted.`)
    return true
  } catch (exception) { showSnackbar(exception.message, 'error'); return false }
  finally { entryOperations.delete(entry) }
}
function requestRemove(kind, entry) { if (!entry.id) removeEntry(kind, entry); else deleteTarget.value = { kind, entry } }
async function confirmRemove() { const target = deleteTarget.value; if (target && await removeEntry(target.kind, target.entry)) deleteTarget.value = null }
async function saveDarkMode(value) {
  if (saving.value || savingDarkMode.value || hasEntryOperations.value) return
  const previous = settings.darkMode; settings.darkMode = value; savingDarkMode.value = true
  try { await api('/admin/settings', { method:'PATCH', body:{ darkMode:value } }); showSnackbar(`Dark mode turned ${value ? 'on' : 'off'}.`) }
  catch (exception) { settings.darkMode = previous; showSnackbar(exception.message, 'error') }
  finally { savingDarkMode.value = false }
}
async function saveSettings() {
  if (savingDarkMode.value || hasEntryOperations.value) return
  saving.value = true
  try { const saved = await api('/admin/settings', { method:'PATCH', body:settings }); Object.assign(settings, saved, { password:'' }); showSnackbar('General settings saved.') }
  catch (exception) { showSnackbar(exception.message, 'error') }
  finally { saving.value = false }
}
async function restore() {
  const file = Array.isArray(backupFile.value) ? backupFile.value[0] : backupFile.value; if (!file) return
  if (hasEntryOperations.value || savingDarkMode.value) return
  saving.value = true
  try { await api('/admin/import', { method:'POST', body:JSON.parse(await file.text()) }); backupFile.value = null; await load(); showSnackbar('Backup restored.') }
  catch (exception) { showSnackbar(exception.message, 'error') }
  finally { saving.value = false }
}
onMounted(load)
</script>

<style scoped>
.settings-page-header,
.settings-header-actions,
.settings-toolbar,
.settings-card-actions,
.settings-entry-controls,
.settings-entry-actions,
.settings-chore-actions,
.settings-inline-actions,
.snackbar-content {
  display: flex;
  align-items: center;
}

.settings-page-header,
.settings-toolbar {
  justify-content: space-between;
  gap: 16px;
}

.settings-page-header > div,
.settings-toolbar > div {
  min-width: 0;
}

.settings-toolbar p {
  margin-bottom: 0;
}

.appearance-setting {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 14px;
  padding: 16px;
  background: var(--surface-soft);
  border: 1px solid var(--line);
  border-radius: 16px;
}

.appearance-setting-copy {
  min-width: 0;
}

.appearance-setting-copy h3 {
  font-size: 1rem;
  font-weight: 750;
  letter-spacing: -.01em;
}

.appearance-setting-copy p {
  margin: 3px 0 0;
  font-size: .84rem;
  line-height: 1.45;
}

.settings-tabs-rail {
  min-width: 0;
  padding: 6px;
  overflow: hidden;
  border: 1px solid rgba(var(--v-theme-on-surface), .1);
  border-radius: 16px;
  background: rgba(var(--v-theme-surface), .92);
  box-shadow: var(--soft-shadow);
}

.settings-tabs {
  min-width: 0;
}

.settings-tabs :deep(.v-slide-group__content) {
  gap: 4px;
}

.settings-tab {
  min-width: max-content;
  border-radius: 12px;
  font-weight: 700;
  letter-spacing: .01em;
  text-transform: none;
}

.settings-tabs :deep(.v-tab.v-tab--selected) {
  color: rgb(var(--v-theme-primary));
  background: var(--blue-soft);
}

.settings-tabs :deep(.v-tab__slider) {
  height: 3px;
  border-radius: 999px 999px 0 0;
}

.settings-card-actions {
  justify-content: flex-end;
}

.settings-entry {
  overflow: visible;
}

.settings-accordion {
  overflow: hidden;
  border: 1px solid var(--line);
  border-radius: 16px;
}

.settings-accordion-title {
  min-height: 58px;
  font-weight: 750;
  letter-spacing: -.01em;
}

.settings-accordion :deep(.v-expansion-panel-text__wrapper) {
  padding: 4px 16px 20px;
}

.settings-user-grid,
.settings-item-grid,
.settings-chore-grid {
  display: grid;
  align-items: center;
  gap: 16px;
}

.settings-user-grid {
  grid-template-columns: minmax(180px, 1.2fr) minmax(180px, 1fr) minmax(390px, auto);
}

.settings-item-grid {
  grid-template-areas:
    "name description controls"
    "assignees assignees controls";
  grid-template-columns: minmax(180px, 1fr) minmax(240px, 1.4fr) minmax(270px, auto);
  align-items: start;
}

.item-name { grid-area: name; }
.item-description { grid-area: description; }
.item-assignees { grid-area: assignees; }
.item-controls { grid-area: controls; align-self: stretch; }

.settings-entry-controls {
  justify-content: space-between;
  gap: 8px;
  min-width: 0;
}

.settings-entry-actions {
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 4px;
  min-width: 0;
}

.settings-inline-actions {
  justify-content: flex-end;
  gap: 8px;
}

.snackbar-content {
  gap: 10px;
}

.settings-switch {
  min-width: max-content;
}

.settings-switch :deep(.v-label) {
  white-space: nowrap;
}

.settings-chore-grid {
  grid-template-areas:
    "title reward recurrence assignees actions"
    "description description description description actions";
  grid-template-columns: minmax(180px, 2fr) minmax(110px, .8fr) minmax(120px, .9fr) minmax(180px, 1.35fr) 88px;
  align-items: start;
}

.chore-title { grid-area: title; }
.chore-description { grid-area: description; }
.chore-reward { grid-area: reward; }
.chore-recurrence { grid-area: recurrence; }
.chore-assignees { grid-area: assignees; }

.settings-chore-actions {
  grid-area: actions;
  align-self: stretch;
  flex-direction: column;
  justify-content: space-between;
  min-width: 88px;
}

.data-card {
  --data-card-tone: var(--v-theme-success);
  position: relative;
  overflow: hidden;
}

.data-card::before {
  position: absolute;
  inset: 0 0 auto;
  height: 4px;
  background: rgb(var(--data-card-tone));
  content: '';
}

.data-card--restore {
  --data-card-tone: var(--v-theme-warning);
}

.data-card__content {
  display: flex;
  height: 100%;
  flex-direction: column;
  align-items: flex-start;
}

.data-card__icon {
  flex: 0 0 auto;
}

.data-card__action {
  align-self: flex-start;
}

@media (max-width: 1199px) {
  .settings-user-grid,
  .settings-item-grid {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  }

  .settings-user-grid .settings-entry-controls {
    grid-column: 1 / -1;
  }

  .settings-item-grid {
    grid-template-areas:
      "name description"
      "assignees assignees"
      "controls controls";
  }

  .settings-chore-grid {
    grid-template-areas:
      "title title actions"
      "description description actions"
      "reward recurrence actions"
      "assignees assignees actions";
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) 88px;
  }
}

@media (max-width: 599px) {
  .settings-page-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .settings-header-actions {
    width: 100%;
  }

  .settings-header-actions .v-btn {
    width: 100%;
    justify-content: flex-start;
  }

  .settings-toolbar {
    align-items: start;
    grid-template-columns: 1fr;
    display: grid;
  }

  .settings-toolbar .v-btn {
    justify-self: start;
  }

  .settings-panel {
    border-radius: 18px !important;
  }

  .settings-tabs-rail {
    border-radius: 14px;
  }

  .settings-accordion :deep(.v-expansion-panel-text__wrapper) {
    padding: 2px 14px 16px;
  }

  .settings-user-grid,
  .settings-item-grid,
  .settings-chore-grid {
    grid-template-columns: minmax(0, 1fr);
  }

  .settings-item-grid {
    grid-template-areas:
      "name"
      "description"
      "assignees"
      "controls";
  }

  .settings-user-grid,
  .settings-item-grid {
    align-items: center;
  }

  .settings-entry-controls {
    grid-column: auto;
    flex-wrap: wrap;
  }

  .settings-chore-grid {
    grid-template-areas:
      "title"
      "description"
      "reward"
      "recurrence"
      "assignees"
      "actions";
  }

  .settings-chore-actions {
    flex-direction: row;
    align-items: center;
    min-width: 0;
  }

  .settings-card-actions .v-btn {
    width: 100%;
  }

  .settings-inline-actions {
    align-items: stretch;
    flex-direction: column;
  }

  .data-card__action {
    width: 100%;
  }
}
</style>
