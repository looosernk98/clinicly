import express from 'express'
import { 
    loginUser, 
    registerUser, 
    getProfile, 
    updateProfile, 
    listAppointment, 
    cancelAppointment, 
    paymentRazorpay, 
    verifyRazorpay, 
    paymentStripe, 
    verifyStripe 
} from '../controllers/user.controller.js'
import {
    getDoctorSlots,
    createAppointment,
    rescheduleAppointment,
    cancelAppointmentByPatient
} from '../controllers/scheduling.controller.js'
import upload from '../middlewares/multer.middleware.js'
import authUser from '../middlewares/auth.middleware.js'

const userRouter = express.Router()

// Authentication routes
userRouter.post("/register", registerUser)
userRouter.post("/login", loginUser)

// Profile routes
userRouter.get("/get-profile", authUser, getProfile)
userRouter.post("/update-profile", upload.single('image'), authUser, updateProfile)

// Appointment routes
userRouter.get("/appointments", authUser, listAppointment)
userRouter.post("/cancel-appointment", authUser, cancelAppointment)

// Production scheduling APIs
userRouter.get("/doctors/:id/slots", getDoctorSlots)
userRouter.post("/appointments", authUser, createAppointment)
userRouter.put("/appointments/:id/reschedule", authUser, rescheduleAppointment)
userRouter.delete("/appointments/:id", authUser, cancelAppointmentByPatient)

// Payment routes
userRouter.post("/payment-razorpay", authUser, paymentRazorpay)
userRouter.post("/verifyRazorpay", authUser, verifyRazorpay)
userRouter.post("/payment-stripe", authUser, paymentStripe)
userRouter.post("/verifyStripe", authUser, verifyStripe)

export default userRouter
