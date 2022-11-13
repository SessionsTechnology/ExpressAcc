<template>
  <div>
    <v-row style="padding-bottom: 16px;">
      <v-btn to="/settings">Settings</v-btn>
    </v-row>
    <!-- <v-row>
      <v-col cols="12" sm="6" md="6" lg="4" xl="3" v-for="user in enabledUsers" :key="user.id" class="d-flex justify-center">
        <v-card style="text-align: center;" @click="navToUser(user.id)" width="100%">
          <v-card-title>{{ user.userName }}</v-card-title>
          <v-card-text>
            <v-text-field variant="plain" readonly>{{ user.item === null ? 'Tap to Checkout Item' : 'Checked Out: ' +
                user.item.itemName
            }}</v-text-field>
            <h1>{{ user.timer === 0 ? 'Time is up' : convertSecondsToString(user.timer) }}</h1>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row> -->
  </div>
</template>

<script setup>
import router from "@/router";
import { inject, onBeforeMount, ref, computed } from "vue";

const socket = inject('globalSocket')

const users = ref([])
onBeforeMount(() => {
  socket.emit('getUserItemsAndTime', (res) => {
    users.value = res
  })
  listen()
})

const enabledUsers = computed(() => {
  return users.value.filter(user => !user.disabled)
})

// function convertSecondsToString(time) {
//   const hours = Math.floor(time / 3600)
//   const minutes = Math.floor((time % 3600) / 60)
//   const seconds = Math.floor(time % 60)
//   return `${formatNum(hours)}:${formatNum(minutes)}:${formatNum(seconds)}`
// }

// function formatNum(num) {
//   return num < 10 ? '0' + num : num
// }

// function navToUser(id) {
//   router.push('/user/' + id)
// }

function listen() {
  socket.on('updateCheckout', (res) => {
    users.value = res
  })
}
</script>