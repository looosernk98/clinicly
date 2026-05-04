import express from 'express'
import { 
    loginAdmin, 
    appointmentsAdmin, 
    appointmentCancel, 
    addDoctor, 
    allDoctors, 
    adminDashboard, 
    bulkAddDoctors, 
    updateDoctorImages 
} from '../controllers/admin.controller.js'
import { changeAvailablity } from '../controllers/doctor.controller.js'
import {
    createHoliday,
    createEmergencyBlock,
    getAnalyticsReport
} from '../controllers/scheduling.controller.js'
import authAdmin from '../middlewares/authAdmin.middleware.js'
import upload from '../middlewares/multer.middleware.js'

const adminRouter = express.Router()

// Authentication routes
adminRouter.post("/login", loginAdmin)

// Doctor management routes
adminRouter.post("/add-doctor", authAdmin, upload.single('image'), addDoctor)
adminRouter.post("/bulk-add-doctors", authAdmin, bulkAddDoctors)
adminRouter.post("/update-doctor-images", authAdmin, updateDoctorImages)
adminRouter.get("/all-doctors", authAdmin, allDoctors)
adminRouter.post("/change-availability", authAdmin, changeAvailablity)

// Appointment management routes
adminRouter.get("/appointments", authAdmin, appointmentsAdmin)
adminRouter.post("/cancel-appointment", authAdmin, appointmentCancel)

// Dashboard routes
adminRouter.get("/dashboard", authAdmin, adminDashboard)

// Production scheduling APIs
adminRouter.post("/holidays", authAdmin, createHoliday)
adminRouter.post("/emergency-blocks", authAdmin, createEmergencyBlock)
adminRouter.get("/reports/analytics", authAdmin, getAnalyticsReport)

export default adminRouter
