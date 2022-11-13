<template>
  {{ allItems }}
  <!-- <v-row align="center"> -->
  <!-- <v-row> -->
    <v-card max-width="374">
      <v-card-text>
        <v-text-field label="Item Name" v-model="itemName"></v-text-field>
        <v-text-field label="description" v-model="itemDescription"></v-text-field>
      </v-card-text>
      <v-card-actions>
        <v-btn @click="createItem">Create Item</v-btn>
      </v-card-actions>
    </v-card>
  <!-- </v-row> -->
  <br /><br /><br />
  <v-btn @click="getAllItems">Get All Items</v-btn><br /><br /><br />

  <v-text-field label="Item Id" v-model="itemIdField"></v-text-field>
  <v-btn @click="getItemById">Get Item</v-btn>
  <v-btn @click="deleteItemById">Delete Item</v-btn><br /><br /><br />


  <v-card>
    <v-card-text>
      <v-text-field label="Item Id" v-model="updateItemId"></v-text-field>
      <v-text-field label="Item Name" v-model="updateItemName"></v-text-field>
      <v-text-field label="Description" v-model="updateItemDescription"></v-text-field>
    </v-card-text>
    <v-card-actions>
      <v-btn @click="updateItem">Update Item</v-btn>
    </v-card-actions>
  </v-card><br /><br /><br />
  <v-btn @click="createItems">Create Items</v-btn>
</template>

<script setup>
import { ref, inject } from 'vue'
const socket = inject('globalSocket')

const itemIdField = ref()
const allItems = ref({})
const itemName = ref()
const itemDescription = ref()

function getAllItems() {
  socket.emit('getAllItems', (res) => {
    console.log(res)
    allItems.value = res
  })
}

function getItemById() {
  socket.emit('getItemById', itemIdField.value, (res) => {
    console.log(res)
  })
}

// function createItem() {
//   const item = {
//     itemName: itemName.value,
//     description: itemDescription.value
//   }
//   socket.emit('createItem', item, (res) => {
//     console.log(res)
//   })
// }

function deleteItemById() {
  socket.emit('deleteItemById', itemIdField.value, (res) => {
    console.log(res)
  })
}

const updateItemId = ref()
const updateItemName = ref()
const updateItemDescription = ref()

// function updateItem() {
//   const item = {
//     id: updateItemId.value,
//     itemName: updateItemName.value,
//     description: updateItemDescription.value
//   }
//   socket.emit('updateItem', item, (res) => {
//     console.log(res)
//   })
// }

function createItems() {
  let items = [
    { id: 29, itemName: 'updated: item 2', description: 'item 2' },
    { id: 30, itemName: 'updated: item 3', description: 'item 3' },
    { id: 31, itemName: 'updated: item 4', description: 'item 4' }
  ]
  socket.emit('createItems', items, (res) => {
    console.log(res)
  })
}
// import { io } from 'socket.io-client'
// let socket = io('http://localhost:3001')

// function deleteItemById() {
//   socket.emit("deleteItemById", 1);
// }
</script>