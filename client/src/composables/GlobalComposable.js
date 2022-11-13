import {inject, onBeforeMount, ref} from "vue";
import router from "@/router";

const isFirstSetupDone = ref()

export default () => {
    async function getIsSetup(socket) {
        await socket.emit('getIsSetup', async (res) => {
            isFirstSetupDone.value = !!+res
        })
    }

    return {
        isFirstSetupDone,
        getIsSetup
    }
}