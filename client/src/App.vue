<template>
  <v-app>
    <v-main>
      <!-- <v-container fluid fill-height> -->
        <v-row class="pa-12" align="center" justify="center" style="min-height: 100vh;">
          <router-view/>
        </v-row>
      <!-- </v-container> -->
    </v-main>
  </v-app>
</template>

<script setup>
import {inject, onBeforeMount, onMounted, ref, watch} from "vue";
import router from "@/router";
import useGlobalComp from './composables/GlobalComposable'
const { isFirstSetupDone, getIsSetup } = useGlobalComp()

const socket = inject('globalSocket')

// const isFirstSetupDone = ref(false)

onBeforeMount(async () => {
  await getIsSetup(socket)
  await socket.on('reloadApp', () => {
    console.log('reload')
    window.location.reload()
  })
})

watch(isFirstSetupDone, (newVal) => {
  // console.log(newVal)
  if(!newVal)
    router.push('/setup')
})


// async function runCheck() {
//   let isSetup = await socket.emit('getIsSetup', async (res) => {
//     await console.log(!!+res)
//     return !!+res
//   })
//   console.log('isSetup', isSetup)
//   if(!isSetup){
//     await router.push('/setup')
//   }
// }

// async function runCheck() {
//   await console.log('before')
//   await getIsSetup(socket)
//   await console.log('after')
// }
//
// async function getIsSetup() {
//   await socket.emit('getIsSetup', (res) => {
//     isFirstSetupDone.value = !!+res
//     console.log(!!+res)
//   })
// }

</script>

<style>
body{
  overflow: hidden;
  -ms-overflow-style: none;  /* IE and Edge */
  scrollbar-width: none;
}

::-webkit-scrollbar {
    display: none;
}
</style>