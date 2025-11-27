import mongoose from "mongoose";

const connectDB = async () => {
    try {
        mongoose.connection.on('connected', () => console.log("Database Connected"))
        mongoose.connection.on('error', (err) => console.log("Database connection error:", err))
        mongoose.connection.on('disconnected', () => console.log("Database Disconnected"))
        
        await mongoose.connect(`${process.env.MONGODB_URI}/prescripto`)
    } catch (error) {
        console.error("Failed to connect to database:", error)
        process.exit(1)
    }
}

export default connectDB

// Do not use '@' symbol in your databse user's password else it will show an error.
