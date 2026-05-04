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
import {
    createAvailabilityRule,
    updateAvailabilityRule,
    deleteAvailabilityRule,
    createDoctorLeave,
    createDoctorBlock,
    updateAppointmentStatusByDoctor
} from '../controllers/scheduling.controller.js'
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

// Production scheduling APIs
doctorRouter.post("/availability-rules", authDoctor, createAvailabilityRule)
doctorRouter.put("/availability-rules/:id", authDoctor, updateAvailabilityRule)
doctorRouter.delete("/availability-rules/:id", authDoctor, deleteAvailabilityRule)
doctorRouter.post("/doctor-leaves", authDoctor, createDoctorLeave)
doctorRouter.post("/doctor-blocks", authDoctor, createDoctorBlock)
doctorRouter.patch("/appointments/:id/status", authDoctor, updateAppointmentStatusByDoctor)


export default doctorRouter
