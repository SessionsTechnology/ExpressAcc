<template>
<!--    {{ userInfo }}-->
<!--    {{items}}-->
  <div v-if="!pageLoading">
  <Numpad v-if="!isLoggedIn" :user-pin="userInfo.userPin" @set-is-logged-in="setIsLoggedIn" />
  <v-card flat width="500" v-if="isLoggedIn">
    <v-card-title>{{ userInfo.userName }}</v-card-title>
    <v-card-text>
      <v-select v-if="!itemCheckedOut"
          v-model="selectedItem"
          :items="computedItems"
          item-title="itemName"
          item-value="itemName"
          return-object
      ></v-select>
      <div v-else>
        Would you like to check the following item back in?
        <v-text-field v-model="itemCheckedOut" variant="plain" readonly/>
      </div>

    </v-card-text>
    <v-card-actions>
      <v-btn
          block
          variant="elevated"
          color="primary"
          size="x-large"
          @click="checkoutOrCheckIn">
        {{itemCheckedOut ? 'Check-in' : 'Checkout'}}
      </v-btn>
    </v-card-actions>
    <v-card-actions>
      <v-btn block variant="elevated" color="error" size="x-large" @click="router.back()">Back</v-btn>
    </v-card-actions>
  </v-card>
</div>
</template>

<script setup>
import {inject, onBeforeMount, onMounted, ref, computed} from "vue";
import Numpad from '../components/Numapd.vue'
import {useRoute} from "vue-router";
import router from "@/router";
import uniqid from "uniqid";
const socket = inject('globalSocket')

const userInfo = ref({})
const items = ref([])
const selectedItem = ref()
const itemCheckedOut = ref()
const isLoggedIn = ref(false)
const pageLoading = ref(true)

function setIsLoggedIn(){
  isLoggedIn.value = true
}

onMounted(() => {
  // console.log(isLoggedIn)
  // const id = router.currentRoute.value.params.id
  const id = useRoute().params.id

  // socket.emit('getUserById', id, (res) => {
  //   userInfo.value = res
  // })

  socket.emit('getSingleUserItemAndTimeByUserId', id, (res) => {
    userInfo.value = res
    if(res.item !== null){
      itemCheckedOut.value = res.item.itemName
    }
    if(!userInfo.value.userPin){
      isLoggedIn.value = true
    }
    pageLoading.value = false
  })
  socket.emit('getAllItems', (res) => {
    items.value = res
  })
})

const computedItems = computed(() => {
  let selectItems = []
  for(var item of items.value){
    if(item.isTimed)
      item.itemName = item.itemName + ' (Timed)'
    selectItems.push(item)
  }
  return selectItems
})

function checkoutOrCheckIn(){
  // console.log(itemCheckedOut)
  if(itemCheckedOut.value){
    let checkIn = userInfo.value.userItemAssociation.id
    socket.emit('checkInItem', checkIn, (res) => {
      router.back()
      // router.push('/checkout')
    })
  }
  else{
    let checkout = {
      userId: userInfo.value.id,
      itemId: selectedItem.value.id,
      associationId: uniqid()
    }

    socket.emit('checkoutItem', checkout, (res) => {
      router.back()
      // router.push('/checkout')
    })
  }

  // console.log(userId, itemId)

}

</script>

<style scoped>

</style>