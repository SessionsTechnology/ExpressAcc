<template>
  <v-card flat width="500">
    <v-card-text>
      <v-text-field
        label="Application Name"
        v-model="settings.applicationName"
      />
      <v-text-field
          label="Password"
          v-model="settings.password"
      />
    </v-card-text>
    <v-card-actions>
      <v-btn @click="updateAdminSettings">Save Settings</v-btn>
    </v-card-actions>
  </v-card>
</template>

<script setup>
import {inject, reactive, watch} from "vue";
import router from "@/router";
import useGlobalComp from '../composables/GlobalComposable'
const socket = inject('globalSocket')
const { isFirstSetupDone, getIsSetup } = useGlobalComp()

watch(isFirstSetupDone, (newVal) => {
  console.log(newVal)
  if(newVal)
    router.push('/')
})

const timeSettings = [
  {
    name: 'Monday',
    hours: 0,
    minutes: 0
  },
  {
    name: 'Tuesday',
    hours: 0,
    minutes: 0
  },
  {
    name: 'Wednesday',
    hours: 0,
    minutes: 0
  },
  {
    name: 'Thursday',
    hours: 0,
    minutes: 0
  },
  {
    name: 'Friday',
    hours: 0,
    minutes: 0
  },
  {
    name: 'Saturday',
    hours: 0,
    minutes: 0
  },
  {
    name: 'Sunday',
    hours: 0,
    minutes: 0
  }
]

const settings = reactive({
  isSetup: true,
  password: 'P@ssword',
  applicationName: 'Activity Center Checkout',
  timeSettings: timeSettings
})

function updateAdminSettings() {
  socket.emit('updateAdminSettings', settings, () => {
    console.log('updated')
  })
  getIsSetup(socket)
}

</script>

<style scoped>

</style>