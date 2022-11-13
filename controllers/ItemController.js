import { db } from "../lowdb/index.js"

const getAllItems = async () => {
   const items = db.data.items
   let allItems = []
   for(let item of items){
      let association = db.data.userItemAssociations.find(association => association.itemId === item.id)
      if(!association){
         allItems.push(item)
      }
   }
   return allItems
}

const getItemById = async (itemId) => {
   const item = db.data.items.find(item => item.id === itemId)
   return item
}

const createItems = async (items) => {
   db.data.items = items
   db.write()
   return 'created'
}

const deleteItemById = async (itemId) => {
   const itemIndex = db.data.items.findIndex(item => item.id === itemId)
   db.data.items.splice(itemIndex, 1)
   db.write()
   return 'deleted'
}

export {
   getAllItems,
   getItemById,
   createItems,
   deleteItemById,
}