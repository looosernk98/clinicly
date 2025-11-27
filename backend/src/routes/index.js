import express from 'express'
import userRoutes from './user.routes.js'
import adminRoutes from './admin.routes.js'
import doctorRoutes from './doctor.routes.js'

const router = express.Router()

// Health check endpoint
router.get("/", (req, res) => {
    res.json({
        success: true,
        message: "Clinicly API is running successfully",
        timestamp: new Date().toISOString()
    })
})

// Mount route modules
router.use("/user", userRoutes)
router.use("/admin", adminRoutes)
router.use("/doctor", doctorRoutes)

export default router
