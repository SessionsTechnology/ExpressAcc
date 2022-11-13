<template>
   <v-card width="500">
      <v-card-text>
      <v-row>
         <v-col cols="12">
            <v-text-field type="password" v-model="enteredPin" label="Please Enter PIN and Tap OK"/>
         </v-col>
         <v-col v-for="n in 12" cols="4" style="padding: 1px">
            <v-sheet rounded v-if="n < 10" height="75" style="text-align: center" color="primary" @click="addToNumber(n)">
            <div class="keypad">
            {{ n }}
            </div>
            </v-sheet>
            <v-sheet rounded v-if="n === 10" height="75" style="text-align: center" color="warning" @click="enteredPin = ''">
               <div class="keypad">
               Clear
            </div>
            </v-sheet>
            <v-sheet rounded v-if="n === 11" height="75" style="text-align: center" color="primary" @click="addToNumber(0)">
            <div class="keypad">
               {{ 0 }}
            </div>
            </v-sheet>
            <v-sheet rounded v-if="n === 12" height="75" style="text-align: center" color="success" @click="submitPin">
            <div class="keypad">
               OK
            </div>
            </v-sheet>
         </v-col>
      </v-row>
   </v-card-text>
   <v-card-actions>
      <v-btn block variant="elevated" color="error" size="x-large" @click="router.back()">Back</v-btn>
   </v-card-actions>
   </v-card>
   <div>
    <v-snackbar
        v-model="snackbar"
        color="error"
    >
      {{ incorrectPinMsg }}
      <template v-slot:actions>
        <v-btn
            variant="text"
            @click="snackbar = false"
        >
          Close
        </v-btn>
      </template>
    </v-snackbar>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import router from "@/router";

const enteredPin = ref('')
const snackbar = ref(false)
const incorrectPinMsg = ref('Incorrect PIN has been entered. Please try again')

const props = defineProps(['userPin'])

const emit = defineEmits(['setIsLoggedIn'])

function addToNumber(num){
   enteredPin.value = enteredPin.value + num
}
  
function submitPin(){
   if(enteredPin.value == props.userPin){
      emit('setIsLoggedIn')
   }
   else{
      snackbar.value = true
   }
}
</script>

<style scoped>
  .keypad{
    position: relative;
    top: 50%;
    transform: translateY(-50%);
    font-size: 3.2rem;
    cursor: pointer;
  }
</style>
<!-- 
Based off what I created here:
https://play.vuetifyjs.com/?preview=false#eNq1VV1r20AQ/CuLaJFNY9nOBwXVLi2lD6WQ5iEUQlXIWVrZ10h34u7kxDX+7x2dHEeOKSmG+sm7N7s7szqNfqyDZc1O5qvolw3iQJaVNo7WlBoWjr+3Z7Sh3OiSwi02TFSi+MFDU62so+0BTfcLe+tEEbkFlxyjaca5qAt33cZhJsxdSJtEbfqJCk6Cj1UVoRFoTGxqZOXIsqur94na0TKcd8l4Ii2D0s4xHee9MES7ROW1Sp3UikSWXevLupyx6am67HtOgEdLUdSMoqf/bwgA8GkQnQ62npXSXUnVa4tFwcb1bm90HS6ZWDk2nMX0ar3rtLkFh/0pIcii8WTYaoMqBI7LqsC+EBFNlgNRNXIJPwSlkJjtVgVPk0AUcq4Glos8ptSPTIIt1IMdP7hBLrnICJU64wJFmJ8EVIiZj64KFpbpc1NMV18uSaiMrkVF374C9Tiowr6kmg+crmK6GFUPOBt2Jxl9/xwc07jB7VAel+oCVHJtgFMEKeNTtELWInF+OPGwiW9jF8yOjK5Vxo02mft+ExqP0GPBcr5wyLy96HT0y/Abe1pWM9lzqYwshVkh8yEtZHrXLLd7RfrPOIBFJpeUFsI2zO94BcIHmPWaFG38zekUDlG5L2i4VbSXTdzfhU6n06Ol3gujsNmu1PY9wWV8LuCfVCbuEy6ROU7lCxrH/+Vxjo57nInDAx0d/UBfkNq8CEdItXWasrVdqTtrOlIlXv0jBDY5kHpyBcSwhUfrQtR4V2tqCFpXmww7bofQSyab6oozD41alt5iiSptZeO+MUwdRXLJ79qDrTG9fgyNUBYuU8bt32bATW8AQH+LyLVyAyt/45tzFp0aLrf5tDZWmxiTZLNon20dumEGSsHmJEBFdD7G1+ksGkWjwYydiMYXwc8/ZOo6sw== -->