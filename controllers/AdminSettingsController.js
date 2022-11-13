import { db } from "../lowdb/index.js"

const getIsSetup = async () => {
   try{
      return await db.data.adminSettings.isSetup
   }catch{
      return false
   }
}

const getAdminSettings = async () => {
   try{
      const settings = await db.data.adminSettings
      return settings
   }catch{
      return false
   }
}

const checkAdminPassword = async (pass) => {

}

const updateAdminSettings = async (settings) => {
   settings.id = 1
   settings.isSetup = true
   const updated = db.data.adminSettings = settings
   await db.write()
   return updated
}

const getAllAdminSetupFromDb = async () => {
   try{
      const settings = db.data
      return settings
   }catch{
      return false
   }
}

export {
   getIsSetup,
   getAdminSettings,
   checkAdminPassword, 
   updateAdminSettings,
   getAllAdminSetupFromDb
}