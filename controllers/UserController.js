import { db } from "../lowdb/index.js"

const getAllUsers = async () => {
   const allUsers = db.data.users
   return allUsers
}

const getUserById = async (userId) => {
   const user = db.data.users.find(user => user.id === userId)
   return user
}

const createUsers = async (users) => {
   db.data.users = users
   db.write()
   return 'Created'
}

const deleteUserById = async (userId) => {
   const userIndex = db.data.users.findIndex(user => user.id === userId)
   db.data.users.splice(userIndex, 1)
   db.write()
   return 'deleted'
}

const taskGetUserItemsAndTime = async () => {
   let users = db.data.users
   let allUsers = []
   const days = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
   let currentDay = days[new Date().getDay()]
   let time = db.data.adminSettings.timeSettings.find(time => time.name === currentDay)
   for(let user of users){
      const association = db.data.userItemAssociations.find(association => association.userId === user.id)
      const item = association ? db.data.items.find(item => item.id === association.itemId) : null
      if(user.dayLastCheckedOut !== currentDay){
         user.dayLastCheckedOut = currentDay
         user.timeLeft = setTimeInSeconds(time.hours, time.minutes)
      }
      if(item){
         if(item.isTimed && user.timeLeft > 0){
            user.timeLeft -= 1
            db.write()
         }
      }
      allUsers.push({
         id: user.id,
         userName: user.userName,
         userPin: user.userPin,
         disabled: user.disabled,
         item: item,
         timer: user.timeLeft
      })
   }
   return allUsers
}

const getUserItemsAndTime = async () => {
   let users = db.data.users
   let allUsers = []
   for(let user of users){
      const association = db.data.userItemAssociations.find(association => association.userId === user.id)
      const item = association ? db.data.items.find(item => item.id === association.itemId) : null
      allUsers.push({
         id: user.id,
         userName: user.userName,
         userPin: user.userPin,
         disabled: user.disabled,
         item: item,
         timer: user.timeLeft
      })
   }
   return allUsers
}

const getSingleUserItemAndTimeByUserId = async (userId) => {
   const user = db.data.users.find(user => user.id === userId)
   const association = db.data.userItemAssociations.find(association => association.userId === user.id)
   const item = association ? db.data.items.find(item => item.id === association.itemId) : null

   let userInfo = {
      id: user.id,
      userName: user.userName,
      userPin: user.userPin,
      disabled: user.disabled,
      item: item,
      userItemAssociation: association
   }
   return userInfo
}

const checkoutItem = async (association) => {
   const newAssociation = {
      id: association.associationId,
      userId: association.userId,
      itemId: association.itemId,
      intervalId: association.intervalId
   }
   db.data.userItemAssociations.push(newAssociation)
   db.write()
   const userItemAssociation = db.data.userItemAssociations.find(association => association.associationId === newAssociation.associationId)
   return userItemAssociation
}

const getSetTime = async (associationId) => {
   const association = db.data.userItemAssociations.find(association => association.id === associationId)
   const user = db.data.users.find(user => user.id === association.userId)
   return user.timeLeft
}


const saveUserTime = async (clientUser) => {
   let dbUser = db.data.users.find(user => user.id === clientUser.id)
   dbUser.timeLeft = clientUser.timer
   db.write()
   return 'saved'
}

const setTimeInSeconds = (hours, minutes, seconds = 0) => {
   return (hours * 60 * 60) + (minutes * 60) + seconds
}

const counter = async () => {
   let users = db.data.users
   for(let user of users){
      if(item){
         if(item.isTimed && user.timeLeft > 0){
            user.timeLeft -= 1
         }
      }
   }
   db.write()
   return users
}

const checkInItem = async (associationId) => {
   const associationIndex = db.data.userItemAssociations.findIndex(association => association.id === associationId)
   clearInterval(db.data.userItemAssociations[associationIndex].intervalId)
   db.data.userItemAssociations.splice(associationIndex, 1)
   db.write()
}

export {
   getAllUsers,
   getUserById,
   createUsers,
   deleteUserById,
   taskGetUserItemsAndTime,
   getUserItemsAndTime,
   getSingleUserItemAndTimeByUserId,
   checkoutItem,
   getSetTime,
   saveUserTime,
   checkInItem
}