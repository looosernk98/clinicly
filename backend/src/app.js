import express from "express"
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import { config } from './config/index.js'
import apiRoutes from './routes/index.js'

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Create Express app
const app = express()

// Middlewares
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Serve static files from public directory
app.use('/public', express.static(path.join(__dirname, '../public')))

// CORS configuration
app.use(cors({
  origin: config.cors.origin,
  credentials: true
}))

// API Routes
app.use("/api", apiRoutes)

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
    timestamp: new Date().toISOString()
  })
})

// Global error handler
app.use((error, req, res, next) => {
  console.error('Global Error:', error)
  res.status(500).json({
    success: false,
    message: config.nodeEnv === 'development' ? error.message : 'Internal Server Error',
    stack: config.nodeEnv === 'development' ? error.stack : undefined,
    timestamp: new Date().toISOString()
  })
})

export default app
