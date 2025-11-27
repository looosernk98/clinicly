import express from 'express'
import { 
    loginUser, 
    registerUser, 
    getProfile, 
    updateProfile, 
    bookAppointment, 
    listAppointment, 
    cancelAppointment, 
    paymentRazorpay, 
    verifyRazorpay, 
    paymentStripe, 
    verifyStripe 
} from '../controllers/user.controller.js'
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
userRouter.post("/book-appointment", authUser, bookAppointment)
userRouter.get("/appointments", authUser, listAppointment)
userRouter.post("/cancel-appointment", authUser, cancelAppointment)

// Payment routes
userRouter.post("/payment-razorpay", authUser, paymentRazorpay)
userRouter.post("/verifyRazorpay", authUser, verifyRazorpay)
userRouter.post("/payment-stripe", authUser, paymentStripe)
userRouter.post("/verifyStripe", authUser, verifyStripe)

export default userRouter
