import express from "express"
import cors from 'cors'
import 'dotenv/config'
import connectDB from "./config/mongodb.js"
import connectCloudinary from "./config/cloudinary.js"
import userRouter from "./routes/userRoute.js"
import doctorRouter from "./routes/doctorRoute.js"
import adminRouter from "./routes/adminRoute.js"
import path from 'path'
import { fileURLToPath } from 'url'

// app config
const app = express()
const port = process.env.PORT || 4000
connectDB()
connectCloudinary()

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// middlewares
app.use(express.json())

// Serve static files from public directory
app.use('/public', express.static(path.join(__dirname, 'public')))

// const allowedOrigins = ['https://clinicly-admin.vercel.app/*', 'https://clinicly.vercel.app/*']
app.use(cors({
  origin: '*',
}))

// api endpoints
app.use("/api/user", userRouter)
app.use("/api/admin", adminRouter)
app.use("/api/doctor", doctorRouter)

app.get("/", (req, res) => {
  res.send("API Working")
});

app.listen(port, () => console.log(`Server started on PORT:${port}`))