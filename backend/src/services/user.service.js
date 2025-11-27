import userModel from '../models/user.model.js'
import doctorModel from '../models/doctor.model.js'
import appointmentModel from '../models/appointment.model.js'
import { v2 as cloudinary } from 'cloudinary'

class UserService {
    // Get user profile
    async getProfile(userId) {
        const user = await userModel.findById(userId).select('-password')
        if (!user) {
            throw new Error('User not found')
        }
        return user
    }

    // Update user profile
    async updateProfile(userId, updateData, imageFile = null) {
        const user = await userModel.findById(userId)
        if (!user) {
            throw new Error('User not found')
        }

        // Handle image upload if provided
        let imageUrl = user.image
        if (imageFile) {
            try {
                const imageUpload = await cloudinary.uploader.upload(imageFile.path, { resource_type: "image" })
                imageUrl = imageUpload.secure_url
            } catch (error) {
                throw new Error('Image upload failed')
            }
        }

        // Update user data
        const allowedUpdates = ['name', 'phone', 'address', 'gender', 'dob']
        const updates = {}
        
        allowedUpdates.forEach(field => {
            if (updateData[field] !== undefined) {
                updates[field] = updateData[field]
            }
        })

        if (imageFile) {
            updates.image = imageUrl
        }

        const updatedUser = await userModel.findByIdAndUpdate(
            userId,
            updates,
            { new: true, runValidators: true }
        ).select('-password')

        return updatedUser
    }

    // Get user appointments
    async getUserAppointments(userId) {
        const appointments = await appointmentModel.find({ userId })
        return appointments
    }

    // Book appointment
    async bookAppointment(appointmentData) {
        const { userId, docId, slotDate, slotTime } = appointmentData

        // Validate required fields
        if (!userId || !docId || !slotDate || !slotTime) {
            throw new Error('Missing required appointment data')
        }

        // Check if doctor exists
        const doctor = await doctorModel.findById(docId).select('-password')
        if (!doctor) {
            throw new Error('Doctor not found')
        }

        if (!doctor.available) {
            throw new Error('Doctor is not available')
        }

        // Check if slot is already booked
        const existingAppointment = await appointmentModel.findOne({
            docId,
            slotDate,
            slotTime,
            cancelled: false
        })

        if (existingAppointment) {
            throw new Error('This time slot is already booked')
        }

        // Get user data
        const user = await userModel.findById(userId).select('-password')
        if (!user) {
            throw new Error('User not found')
        }

        // Create appointment
        const appointmentObj = {
            userId,
            docId,
            slotDate,
            slotTime,
            userData: user,
            docData: doctor,
            amount: doctor.fees,
            date: Date.now()
        }

        const newAppointment = new appointmentModel(appointmentObj)
        await newAppointment.save()

        // Update doctor's booked slots
        const slots_booked = doctor.slots_booked || {}
        if (slots_booked[slotDate]) {
            slots_booked[slotDate].push(slotTime)
        } else {
            slots_booked[slotDate] = [slotTime]
        }

        await doctorModel.findByIdAndUpdate(docId, { slots_booked })

        return newAppointment
    }

    // Cancel appointment
    async cancelAppointment(userId, appointmentId) {
        const appointment = await appointmentModel.findById(appointmentId)
        
        if (!appointment) {
            throw new Error('Appointment not found')
        }

        if (appointment.userId !== userId) {
            throw new Error('Unauthorized to cancel this appointment')
        }

        if (appointment.cancelled) {
            throw new Error('Appointment is already cancelled')
        }

        // Mark appointment as cancelled
        appointment.cancelled = true
        await appointment.save()

        // Remove slot from doctor's booked slots
        const doctor = await doctorModel.findById(appointment.docId)
        if (doctor && doctor.slots_booked && doctor.slots_booked[appointment.slotDate]) {
            doctor.slots_booked[appointment.slotDate] = doctor.slots_booked[appointment.slotDate].filter(
                time => time !== appointment.slotTime
            )
            await doctor.save()
        }

        return appointment
    }
}

export default new UserService()
