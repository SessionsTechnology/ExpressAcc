let sock = null
import { getIsSetup, getAdminSettings, checkAdminPassword, updateAdminSettings, getAllAdminSetupFromDb } from '../controllers/AdminSettingsController.js'
import { getAllItems, getItemById, createItems, deleteItemById } from '../controllers/ItemController.js'
import { getAllUsers, getUserById, createUsers, deleteUserById, getUserItemsAndTime, getSingleUserItemAndTimeByUserId, checkoutItem, getSetTime, checkInItem } from '../controllers/UserController.js'


class Socket {
   constructor(socket){
      sock = socket
   }

   clientConnection(){

      sock.on('disconnect', () => {
         console.log('client disconnected:', sock.id)
      })

      // TODO: Move enpoints off into different files
      // TODO: Setup logger

      //Item Endpoints
      sock.on('getAllItems', async (cb) => {
         let allItems = await getAllItems()
         cb(allItems)
      })

      sock.on('getItemById', async (itemId, cb) => {
         let item = await getItemById(itemId)
         cb(item)
      })

      sock.on('createItems', async (items, cb) => {
         let created = await createItems(items)
         let allItems = await getAllItems()
         await sock.broadcast.emit('itemsChanged', allItems, () => {})
         await sock.emit('itemsChanged', allItems, () => {})
         cb(allItems)
      })

      sock.on('deleteItemById', async (itemId, cb) => {
         let deleted = deleteItemById(itemId)
         let allItems = await getAllItems()
         await sock.broadcast.emit('itemsChanged', allItems, () => {})
         await sock.emit('itemsChanged', allItems, () => {})
         cb(deleted)
      })

      //User Endpoints
      sock.on('getAllUsers', async (cb) => {
         let allUsers = await getAllUsers()
         cb(allUsers)
      })

      sock.on('getUserById', async (userId, cb) => {
         let user = await getUserById(userId)
         cb(user)
      })

      sock.on('createUsers', async (users, cb) => {
         let created = await createUsers(users)
         let allUsers = await getAllUsers()
         await sock.broadcast.emit('usersChanged', allUsers, () => {})
         await sock.emit('usersChanged', allUsers, () => {})
         cb(allUsers)
      })

      sock.on('deleteUserById', async (userId, cb) => {
         let deleted = await deleteUserById(userId)
         let allUsers = await getAllUsers()
         await sock.broadcast.emit('usersChanged', allUsers, () => {})
         await sock.emit('usersChanged', allUsers, () => {})
         cb(deleted)
      })

      sock.on('getUserItemsAndTime', async (cb) => {
         let allUsers = await getUserItemsAndTime()
         await sock.broadcast.emit('updateCheckout', allUsers, () => {})
         await sock.emit('updateCheckout', allUsers, () => {})
         cb(allUsers)
      })

      sock.on('getSingleUserItemAndTimeByUserId', async (userId, cb) => {
         let allInfo = await getSingleUserItemAndTimeByUserId(userId)
         cb(allInfo)
      })

      sock.on('checkoutItem', async (association, cb) => {
         let checkedOut = await checkoutItem(association)
         cb(checkedOut)
      })

      sock.on('checkInItem', async (associationId, cb) => {
         let checkIn = await checkInItem(associationId)
         cb(checkIn)
      })

      //Admin Settings Endpoints
      sock.on('getIsSetup', async (cb) => {
         let isSetup = await getIsSetup()
         cb(isSetup)
      })

      sock.on('getAdminSettings', async (cb) => {
         let settings = await getAdminSettings()
         cb(settings)
      })

      sock.on('checkAdminPassword', async (pass, cb) => {
         let isCorrect = await checkAdminPassword(pass)
         cb(isCorrect)
      })

      sock.on('updateAdminSettings', async (settings, cb) => {
         let updated = await updateAdminSettings(settings)
         let allSettings = await getAdminSettings()
         await sock.broadcast.emit('settingsChanged', allSettings, () => {})
         await sock.emit('settingsChanged', allSettings, () => {})
         cb(updated)
      })

      sock.on('getAllAdminSetupFromDb', async (cb) => {
         console.log('getAllAdminSetupFromDb')
         let everything = await getAllAdminSetupFromDb()
         cb(everything)
      })

      sock.on('reloadApp', async (cb) => {
         await sock.broadcast.emit('reloadApp', () => {})
         await sock.emit('reloadApp', () => {})
         cb()
      })
   }
}

export { Socket }







// sock.on('checkoutItem', async (association, cb) => {
//    console.log('checkoutItem', association)
   
//    // console.log('userItemAssociation', userItemAssociation)
//    // let intervalId = setInterval(
//    //    async function () {
//    //       await getSetTime(userItemAssociation.id)
//    //       // console.log('intervalRunning', userItemAssociation.id)
//    //       // let allUsers = await getUserItemsAndTime()
//    //       // await sock.broadcast.emit('updateCheckout', allUsers, () => {})
//    //       // await sock.emit('updateCheckout', allUsers, () => {})
//    //    }, 1000)

//    // association.intervalId = JSON.parse(() => {
//    //    getSetTime(userItemAssociation.id)
//    // }, 10000)

//    // association.intervalId = JSON.parse(getSetTime(association.id), 10000)

//    association.intervalId = JSON.parse(setInterval(
//       async function () {
//          await getSetTime(userItemAssociation.id)
//          // console.log('intervalRunning', userItemAssociation.id)
//          // let allUsers = await getUserItemsAndTime()
//          // await sock.broadcast.emit('updateCheckout', allUsers, () => {})
//          // await sock.emit('updateCheckout', allUsers, () => {})
//       }, 10000))
//    // console.log('intervalId', JSON.parse(intervalId))
//    let userItemAssociation = await checkoutItem(association)
//    // db.write()
//    // console.log('intervalId', intervalId)
//    // console.log('userItemAssociation', userItemAssociation)
//    // const test = JSON.parse(intervalId)
//    // console.log('test', test)
//    // clearInterval(test)
//    // userItemAssociation.intervalId = intervalId
//    // userItemAssociation.intervalId = intervalId
//    // userItemAssociation.intervalId = 
//    // userItemAssociation.intervalId = setInterval(console.log('interval running'), 1000)
   
//    // setInterval(
//    //    async function(){
//    //       console.log('interval running')
//    //       // await getSetTime(userItemAssociation.id)
//    //       // let allUsers = await getUserItemsAndTime()
//    //       // await sock.broadcast.emit('updateCheckout', allUsers, () => {})
//    //       // await sock.emit('updateCheckout', allUsers, () => {})
//    //    }, 1000)
      
//    cb('checkedOut')
// })