<template>
  <div>
<!--    {{adminItems}}-->
    <v-card flat width="500" v-if="adminItems.settings">
      <v-card-text >
        <v-card rounded="0">
          <v-card-title>
            {{ adminItems.settings.applicationName }} Settings
          </v-card-title>
          <v-card-text>
            <v-text-field
                label="Application Name"
                v-model="adminItems.settings.applicationName"
            />
            <v-text-field
                label="Admin Password"
                v-model="adminItems.settings.password"
            />
            <v-expansion-panels>
              <v-expansion-panel>
                <v-expansion-panel-title>Time Allotment Settings</v-expansion-panel-title>
                <v-expansion-panel-text>
                  <v-card flat>
                    <v-expansion-panels>
                      <v-expansion-panel v-for="(day) in adminItems.settings.timeSettings" :key="day">
                        <v-expansion-panel-title>{{day.name}}<v-spacer />{{day.hours}}h {{day.minutes}}m</v-expansion-panel-title>
                        <v-expansion-panel-text>
                          <v-row>
                            <v-col>
                              <v-textField type="number" label="Hours" v-model="day.hours"></v-textField>
                            </v-col>
                            <v-col>
                              <v-textField label="Minutes" v-model="day.minutes"></v-textField>
                            </v-col>
                          </v-row>
                        </v-expansion-panel-text>
                      </v-expansion-panel>
                    </v-expansion-panels>
                  </v-card>
                </v-expansion-panel-text>
              </v-expansion-panel>
            </v-expansion-panels>
          </v-card-text>
          <v-card-actions>
          <v-btn variant="elevated" color="primary" @click="reloadApp">Reload Clients</v-btn>
          <v-spacer />
          <v-btn variant="elevated" color="success" @click="updateAdminSettings">Save Settings</v-btn></v-card-actions>
        </v-card>
        <v-expansion-panels>
          <v-expansion-panel>
            <v-expansion-panel-title>Users - {{ adminItems.users.length }}</v-expansion-panel-title>
            <v-expansion-panel-text>
              <v-card flat>
                <v-card-actions><v-spacer /><v-btn prepend-icon="mdi-plus" variant="elevated" color="primary" @click="addNewUserToArray">Add User</v-btn></v-card-actions>
                <v-expansion-panels>
                  <v-expansion-panel v-for="(user, index) in adminItems.users" :key="index">
                    <v-expansion-panel-title>{{user.userName === '' ? 'Click to Edit' : user.userName}}{{user.disabled ? ' - Disabled' : ''}}</v-expansion-panel-title>
                    <v-expansion-panel-text>
                      <v-text-field
                        label="User Name"
                        v-model="user.userName"
                      />
                      <v-text-field
                        label="PIN"
                        v-model="user.userPin"
                      />
                      <v-switch
                          style="justify-items: right"
                          v-model="user.disabled"
                          label="Disable"
                          color="red-darken-3"
                          hide-details
                      ></v-switch>
                      <v-card-actions><v-btn variant="elevated" color="error" @click="deleteUser(index, user.id)">Delete</v-btn></v-card-actions>
                    </v-expansion-panel-text>
                  </v-expansion-panel>
                </v-expansion-panels>
                <v-card-actions><v-spacer /><v-btn variant="elevated" color="success" :loading="saveUsersLoading" @click="saveUsers">Save Users</v-btn></v-card-actions>
              </v-card>
            </v-expansion-panel-text>
          </v-expansion-panel>
          <v-expansion-panel>
            <v-expansion-panel-title>Items - {{ adminItems.items.length }}</v-expansion-panel-title>
            <v-expansion-panel-text>
              <v-card flat>
                <v-card-actions><v-spacer /><v-btn prepend-icon="mdi-plus" variant="elevated" color="primary" @click="addNewItemToArray">Add Item</v-btn></v-card-actions>
                <v-expansion-panels>
                  <v-expansion-panel v-for="(item, index) in adminItems.items" :key="index">
                    <v-expansion-panel-title>{{item.itemName === '' ? 'Click to Edit' : item.itemName}}{{item.isTimed ? ' - Uses Time' : ''}}</v-expansion-panel-title>
                    <v-expansion-panel-text>
                      <v-text-field
                          label="Item Name"
                          v-model="item.itemName"
                      />
                      <v-text-field
                          label="Description"
                          v-model="item.description"
                      />
                      <v-switch
                          v-model="item.isTimed"
                          label="Use Time"
                          color="success"
                          hide-details
                      ></v-switch>
                      <v-spacer />
                      <v-switch
                          v-model="item.disabled"
                          label="Disable"
                          color="red-darken-3"
                          hide-details
                      ></v-switch>
                      <v-card-actions><v-btn variant="elevated" color="error" @click="deleteItem(index, item.id)">Delete</v-btn></v-card-actions>
                    </v-expansion-panel-text>
                  </v-expansion-panel>
                </v-expansion-panels>
                <v-card-actions><v-spacer /><v-btn variant="elevated" color="success" :loading="saveItemsLoading" @click="saveItems">Save Items</v-btn></v-card-actions>
              </v-card>
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>

      </v-card-text>
      <v-card-actions>

      </v-card-actions>
    </v-card>
    <div>
      <v-snackbar
          v-model="snack.snackbar"
          :color="snack.color"
      >
        {{ snack.text }}
        <template v-slot:actions>
          <v-btn
              variant="text"
              @click="snack.snackbar = false"
          >
            Close
          </v-btn>
        </template>
      </v-snackbar>
    </div>
  </div>
</template>

<script setup>
import {inject, onBeforeMount, onMounted, reactive, ref} from "vue";
import uniqid from "uniqid";
const socket = inject('globalSocket')

const adminItems = reactive({})

onBeforeMount(() => {
  fetchAdminItems()
  listen()
})

// const settings = reactive({
//   password: 'P@ssword',
//   applicationName: 'Activity Center Checkout',
//   timeSettings: timeSettings.value
// })
//
function updateAdminSettings() {
  const settings = {
    password: adminItems.settings.password,
    applicationName: adminItems.settings.applicationName,
    timeSettings: adminItems.settings.timeSettings
  }

  socket.emit('updateAdminSettings', settings, (res) => {
  })
}

function fetchAdminItems(){
  socket.emit('getAllAdminSetupFromDb', (res) => {
    // TODO: Setup this to save to a reactive state
    adminItems.settings = res.adminSettings
    adminItems.settings.timeSettings = adminItems.settings.timeSettings
    adminItems.users = res.users
    adminItems.items = res.items
  })
}

function addNewUserToArray(){
  adminItems.users.push({
    id: uniqid(),
    userName: '',
    userPin: '',
    disabled: false
  })
}

const saveUsersLoading = ref(false)
function saveUsers(){
  saveUsersLoading.value = true
  let users = adminItems.users
  socket.emit('createUsers', users, (res) => {
    adminItems.users = res
    saveUsersLoading.value = false
    setSnackBar(true, 'Users: Saved', 'success')
  })
}

function deleteUser(index, id){
  if(id){
    socket.emit('deleteUserById', id, (res) => {
      setSnackBar(true, 'User: ' + res, 'warning')
    })
  }
  adminItems.users.splice(index, 1)
}

//Item Section
function addNewItemToArray(){
  adminItems.items.push({
    id: uniqid(),
    itemName: '',
    description: '',
    isTimed: false
  })
}

const saveItemsLoading = ref(false)
function saveItems(){
  saveItemsLoading.value = true
  let items = adminItems.items
  socket.emit('createItems', items, (res) => {
    adminItems.items = res
    saveItemsLoading.value = false
    setSnackBar(true, 'Items: Saved', 'success')
  })
}

function deleteItem(index, id){
  if(id){
    socket.emit('deleteItemById', id, (res) => {
      setSnackBar(true, 'Item: Deleted', 'warning')
    })
  }
  adminItems.items.splice(index, 1)
}

const snack = reactive({
  snackbar: false,
  text: '',
  color: 'primary'
})

function setSnackBar(show, text, color){
  snack.snackbar = show
  snack.text = text
  snack.color = color
}

function reloadApp(){
  socket.emit('reloadApp', (res) => {
  })
}

function listen(){
  socket.on('usersChanged', (users) => {
    adminItems.users = users
  })
  socket.on('itemsChanged', (items) => {
    adminItems.items = items
  })
  socket.on('settingsChanged', (settings) => {
    adminItems.settings = settings
  })
  // socket.on('userDeleted', (users) => {
  //   console.log()
  //   adminItems.users = users
  // })
}

</script>

<style scoped>

</style>