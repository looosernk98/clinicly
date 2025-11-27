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

export default adminRouter
