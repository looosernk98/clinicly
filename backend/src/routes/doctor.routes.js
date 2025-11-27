import express from 'express'
import { 
    loginDoctor, 
    appointmentsDoctor, 
    appointmentCancel, 
    doctorList, 
    changeAvailablity, 
    appointmentComplete, 
    doctorDashboard, 
    doctorProfile, 
    updateDoctorProfile 
} from '../controllers/doctor.controller.js'
import authDoctor from '../middlewares/authDoctor.middleware.js'

const doctorRouter = express.Router()

// Authentication routes
doctorRouter.post("/login", loginDoctor)

// Public routes
doctorRouter.get("/list", doctorList)

// Protected doctor routes
doctorRouter.get("/appointments", authDoctor, appointmentsDoctor)
doctorRouter.post("/cancel-appointment", authDoctor, appointmentCancel)
doctorRouter.post("/change-availability", authDoctor, changeAvailablity)
doctorRouter.post("/complete-appointment", authDoctor, appointmentComplete)

// Doctor profile and dashboard
doctorRouter.get("/dashboard", authDoctor, doctorDashboard)
doctorRouter.get("/profile", authDoctor, doctorProfile)
doctorRouter.post("/update-profile", authDoctor, updateDoctorProfile)

// Doctor's available slots
// doctorRouter.post()


export default doctorRouter
