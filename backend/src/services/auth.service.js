import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import validator from 'validator'
import { config } from '../config/index.js'
import { generateToken } from '../utils/jwt.util.js'
import userModel from '../models/user.model.js'
import doctorModel from '../models/doctor.model.js'

class AuthService {
    // User Registration
    async registerUser(userData) {
        const { name, email, password } = userData

        // Validation
        if (!name || !email || !password) {
            throw new Error('Missing required fields')
        }

        if (!validator.isEmail(email)) {
            throw new Error('Please enter a valid email')
        }

        if (password.length < 8) {
            throw new Error('Password must be at least 8 characters long')
        }

        // Check if user already exists
        const existingUser = await userModel.findOne({ email })
        if (existingUser) {
            throw new Error('User already exists with this email')
        }

        // Hash password
        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password, salt)

        // Create user
        const newUser = new userModel({
            name,
            email,
            password: hashedPassword,
        })

        const user = await newUser.save()
        const token = generateToken({ id: user._id })

        return { user: { ...user._doc, password: undefined }, token }
    }

    // User Login
    async loginUser(credentials) {
        const { email, password } = credentials

        if (!email || !password) {
            throw new Error('Email and password are required')
        }

        if (!validator.isEmail(email)) {
            throw new Error('Please enter a valid email')
        }

        const user = await userModel.findOne({ email })
        if (!user) {
            throw new Error('Invalid credentials')
        }

        const isMatch = await bcrypt.compare(password, user.password)
        if (!isMatch) {
            throw new Error('Invalid credentials')
        }

        const token = generateToken({ id: user._id })
        return { user: { ...user._doc, password: undefined }, token }
    }

    // Doctor Login
    async loginDoctor(credentials) {
        const { email, password } = credentials

        if (!email || !password) {
            throw new Error('Email and password are required')
        }

        const doctor = await doctorModel.findOne({ email })
        if (!doctor) {
            throw new Error('Invalid credentials')
        }

        const isMatch = await bcrypt.compare(password, doctor.password)
        if (!isMatch) {
            throw new Error('Invalid credentials')
        }

        const token = generateToken({ id: doctor._id })
        return { doctor: { ...doctor._doc, password: undefined }, token }
    }

    // Admin Login
    async loginAdmin(credentials) {
        const { email, password } = credentials

        if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
            const token = jwt.sign(email + password, process.env.JWT_SECRET)
            return { token }
        } else {
            throw new Error('Invalid admin credentials')
        }
    }
}

export default new AuthService()
