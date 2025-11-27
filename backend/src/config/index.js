import 'dotenv/config'

export const config = {
    // Server Configuration
    port: process.env.PORT || 4000,
    nodeEnv: process.env.NODE_ENV || 'development',
    
    // Database Configuration
    mongodb: {
        uri: process.env.MONGODB_URI,
        dbName: 'prescripto'
    },
    
    // Cloudinary Configuration
    cloudinary: {
        cloudName: process.env.CLOUDINARY_NAME,
        apiKey: process.env.CLOUDINARY_API_KEY,
        secretKey: process.env.CLOUDINARY_SECRET_KEY
    },
    
    // JWT Configuration
    jwt: {
        secret: process.env.JWT_SECRET || 'your-secret-key',
        expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    },
    
    // CORS Configuration
    cors: {
        origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*'
    },
    
    // Payment Gateways
    razorpay: {
        keyId: process.env.RAZORPAY_KEY_ID,
        keySecret: process.env.RAZORPAY_KEY_SECRET
    },
    
    stripe: {
        secretKey: process.env.STRIPE_SECRET_KEY,
        publishableKey: process.env.STRIPE_PUBLISHABLE_KEY
    }
}

export default config
