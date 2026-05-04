import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import doctorModel from "../models/doctor.model.js";
import appointmentModel from "../models/appointment.model.js";
import { mapAppointmentPanelDto } from "../utils/appointmentPanelDto.util.js";

// API for doctor Login 
const loginDoctor = async (req, res) => {

    try {

        const { email, password } = req.body
        const user = await doctorModel.findOne({ email })

        if (!user) {
            return res.json({ success: false, message: "Invalid credentials" })
        }

        const isMatch = await bcrypt.compare(password, user.password_hash)

        if (isMatch) {
            const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET)
            res.json({ success: true, token })
        } else {
            res.json({ success: false, message: "Invalid credentials" })
        }


    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to get doctor appointments for doctor panel
const appointmentsDoctor = async (req, res) => {
    try {

        const { docId } = req.body
        const appointments = await appointmentModel
            .find({ doc_id: docId })
            .populate('patient_id', 'first_name last_name image dob age')
            .populate('doc_id', 'first_name last_name image')

        const mapped = appointments.map((item) => mapAppointmentPanelDto(item))

        res.json({ success: true, appointments: mapped })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to cancel appointment for doctor panel
const appointmentCancel = async (req, res) => {
    try {

        const { docId, appointmentId, cancellationReason = '' } = req.body

        const appointmentData = await appointmentModel.findById(appointmentId)
        if (appointmentData && String(appointmentData.doc_id) === String(docId)) {
            await appointmentModel.findByIdAndUpdate(appointmentId, {
                status: "cancelled",
                cancelled: true,
                updated_by: "DOCTOR",
                cancelled_by: "DOCTOR",
                cancelled_by_actor_id: docId,
                cancelled_at: new Date(),
                cancellation_reason: cancellationReason,
            })
            return res.json({ success: true, message: 'Appointment Cancelled' })
        }

        res.json({ success: false, message: 'Appointment Cancelled' })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }

}

// API to mark appointment completed for doctor panel
const appointmentComplete = async (req, res) => {
    try {

        const { docId, appointmentId } = req.body

        const appointmentData = await appointmentModel.findById(appointmentId)
        if (appointmentData && String(appointmentData.doc_id) === String(docId)) {
            await appointmentModel.findByIdAndUpdate(appointmentId, {
                status: "completed",
                isCompleted: true,
                updated_by: "DOCTOR",
            })
            return res.json({ success: true, message: 'Appointment Completed' })
        }

        res.json({ success: false, message: 'Appointment Cancelled' })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }

}

// API to get all doctors list for Frontend
const doctorList = async (req, res) => {
    try {

        const doctors = await doctorModel.find({}).select(['-password_hash', '-email'])
        res.json({ success: true, doctors })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }

}

// API to change doctor availablity for Admin and Doctor Panel
const changeAvailablity = async (req, res) => {
    try {

        const { docId } = req.body

        const docData = await doctorModel.findById(docId)
        await doctorModel.findByIdAndUpdate(docId, {
            is_profile_active: !docData.is_profile_active,
        })
        res.json({ success: true, message: 'Availablity Changed' })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to get doctor profile for  Doctor Panel
const doctorProfile = async (req, res) => {
    try {

        const { docId } = req.body
        const profileData = await doctorModel.findById(docId).select('-password_hash')

        res.json({ success: true, profileData })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to update doctor profile data from  Doctor Panel
const updateDoctorProfile = async (req, res) => {
    try {

        const { docId, fees, address, available } = req.body

        const update = {}
        if (fees !== undefined) update.consultation_fee = fees
        if (address !== undefined) update.clinic_address = address
        if (available !== undefined) update.is_profile_active = available

        await doctorModel.findByIdAndUpdate(docId, update)

        res.json({ success: true, message: 'Profile Updated' })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to get dashboard data for doctor panel
const doctorDashboard = async (req, res) => {
    try {

        const { docId } = req.body

        const appointments = await appointmentModel
            .find({ doc_id: docId })
            .populate('patient_id', 'first_name last_name image dob age')
            .populate('doc_id', 'first_name last_name image')

        let earnings = 0

        appointments.map((item) => {
            const paid =
                item.payment === "completed" ||
                item.payment === true ||
                item.status === "completed";
            if (paid) {
                earnings += item.consultation_fee ?? 0
            }
        })

        let patients = []

        appointments.forEach((item) => {
            const p = item.patient_id
            const pid = p && typeof p === 'object' && p._id ? p._id : p
            if (pid != null && !patients.includes(String(pid))) {
                patients.push(String(pid))
            }
        })



        const mapped = appointments.map((item) => mapAppointmentPanelDto(item))

        const dashData = {
            earnings,
            appointments: appointments.length,
            patients: patients.length,
            latestAppointments: mapped.toReversed()
        }

        res.json({ success: true, dashData })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

export {
    loginDoctor,
    appointmentsDoctor,
    appointmentCancel,
    doctorList,
    changeAvailablity,
    appointmentComplete,
    doctorDashboard,
    doctorProfile,
    updateDoctorProfile
}