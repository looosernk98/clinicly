import userModel from '../models/user.model.js'
import doctorModel from '../models/doctor.model.js'
import { splitFullNameToFirstLast } from '../utils/doctorName.util.js'
import { mapPatientGender, parsePatientDob } from '../utils/patient.util.js'
import appointmentModel from '../models/appointment.model.js'
import { v2 as cloudinary } from 'cloudinary'

class UserService {
    // Get user profile
    async getProfile(userId) {
        const user = await userModel.findById(userId).select('-password_hash')
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

        const allowedUpdates = ['first_name', 'last_name', 'phone', 'address', 'gender', 'dob']
        const updates = {}

        allowedUpdates.forEach((field) => {
            if (updateData[field] !== undefined) {
                updates[field] = updateData[field]
            }
        })

        if (updateData.name !== undefined) {
            const split = splitFullNameToFirstLast(updateData.name)
            updates.first_name = split.first_name
            updates.last_name = split.last_name ?? ''
        }

        if (updates.dob !== undefined) {
            updates.dob = parsePatientDob(updates.dob)
        }
        if (updates.gender !== undefined) {
            updates.gender = mapPatientGender(updates.gender)
        }

        if (imageFile) {
            updates.image = imageUrl
        }

        const updatedUser = await userModel.findByIdAndUpdate(
            userId,
            updates,
            { new: true, runValidators: true }
        ).select('-password_hash')

        return updatedUser
    }

    // Get user appointments
    async getUserAppointments(userId) {
        const appointments = await appointmentModel.find({ patient_id: userId })
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
        const doctor = await doctorModel.findById(docId).select('-password_hash')
        if (!doctor) {
            throw new Error('Doctor not found')
        }

        if (!doctor.is_profile_active) {
            throw new Error('Doctor is not available')
        }

        // Check if slot is already booked
        const existingAppointment = await appointmentModel.findOne({
            doc_id: docId,
            slot_date: slotDate,
            start_time: slotTime,
            status: { $nin: ['cancelled'] },
        })

        if (existingAppointment) {
            throw new Error('This time slot is already booked')
        }

        // Get user data
        const user = await userModel.findById(userId).select('-password_hash')
        if (!user) {
            throw new Error('User not found')
        }

        const durationMin = doctor.default_slot_duration || 30
        const [h, m] = String(slotTime).split(':').map(Number)
        let endMinutes = h * 60 + m + durationMin
        endMinutes = ((endMinutes % (24 * 60)) + (24 * 60)) % (24 * 60)
        const endTime = `${String(Math.floor(endMinutes / 60)).padStart(2, '0')}:${String(endMinutes % 60).padStart(2, '0')}`

        const appointmentObj = {
            patient_id: userId,
            doc_id: docId,
            slot_date: slotDate,
            start_time: slotTime,
            end_time: endTime,
            consultation_fee: doctor.consultation_fee,
            mode: 'clinic',
            payment: 'pending',
            status: 'booked',
            created_by: 'PATIENT',
            updated_by: 'PATIENT',
        }

        const newAppointment = new appointmentModel(appointmentObj)
        await newAppointment.save()

        return newAppointment
    }

    // Cancel appointment
    async cancelAppointment(userId, appointmentId) {
        const appointment = await appointmentModel.findById(appointmentId)
        
        if (!appointment) {
            throw new Error('Appointment not found')
        }

        const uid = appointment.patient_id
        if (String(uid) !== String(userId)) {
            throw new Error('Unauthorized to cancel this appointment')
        }

        if (appointment.cancelled || appointment.status === 'cancelled') {
            throw new Error('Appointment is already cancelled')
        }

        appointment.status = 'cancelled'
        appointment.cancelled = true
        appointment.updated_by = 'PATIENT'
        await appointment.save()

        return appointment
    }
}

export default new UserService()
