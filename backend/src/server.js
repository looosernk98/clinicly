import 'dotenv/config'
import app from './app.js'
import connectDB from './database/connection.js'
import connectCloudinary from './config/cloudinary.js'
import { config } from './config/index.js'
import { startNoShowWatcher } from './jobs/noShow.job.js'

// Initialize database connections
connectDB()
connectCloudinary()

// Start server
app.listen(config.port, () => {
  console.log(`🚀 Server started on PORT: ${config.port}`)
  console.log(`🌍 Environment: ${config.nodeEnv}`)
  console.log(`📅 Started at: ${new Date().toISOString()}`)
  startNoShowWatcher()
})
