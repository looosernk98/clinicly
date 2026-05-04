import appointmentModel from '../models/appointment.model.js'

class AppointmentRepository {
    // Create a new appointment
    async create(appointmentData) {
        const appointment = new appointmentModel(appointmentData)
        return await appointment.save()
    }

    // Find appointment by ID
    async findById(appointmentId) {
        return await appointmentModel.findById(appointmentId)
    }

    // Find appointments by user ID
    async findByUserId(userId, options = {}) {
        const { page = 1, limit = 10, sort = { created_at: -1 } } = options
        const skip = (page - 1) * limit

        return await appointmentModel.find({ patient_id: userId })
            .sort(sort)
            .skip(skip)
            .limit(limit)
    }

    // Find appointments by doctor ID
    async findByDoctorId(docId, options = {}) {
        const { page = 1, limit = 10, sort = { created_at: -1 } } = options
        const skip = (page - 1) * limit

        return await appointmentModel.find({ doc_id: docId })
            .sort(sort)
            .skip(skip)
            .limit(limit)
    }

    // Find appointment by slot details
    async findBySlot(docId, slotDate, slotTime) {
        return await appointmentModel.findOne({
            doc_id: docId,
            slot_date: slotDate,
            start_time: slotTime,
            status: { $nin: ["cancelled"] },
        })
    }

    // Update appointment by ID
    async updateById(appointmentId, updateData) {
        return await appointmentModel.findByIdAndUpdate(
            appointmentId,
            updateData,
            { new: true, runValidators: true }
        )
    }

    // Cancel appointment
    async cancelById(appointmentId) {
        return await appointmentModel.findByIdAndUpdate(
            appointmentId,
            { status: "cancelled", cancelled: true },
            { new: true }
        )
    }

    // Mark appointment as completed
    async markCompleted(appointmentId) {
        return await appointmentModel.findByIdAndUpdate(
            appointmentId,
            { status: "completed", isCompleted: true },
            { new: true }
        )
    }

    // Update payment status
    async updatePaymentStatus(appointmentId, paymentStatus) {
        return await appointmentModel.findByIdAndUpdate(
            appointmentId,
            { payment: paymentStatus },
            { new: true }
        )
    }

    // Find all appointments with filters
    async findWithFilters(filters, options = {}) {
        const { page = 1, limit = 10, sort = { created_at: -1 } } = options
        const skip = (page - 1) * limit

        return await appointmentModel.find(filters)
            .sort(sort)
            .skip(skip)
            .limit(limit)
    }

    // Count appointments with filters
    async countWithFilters(filters) {
        return await appointmentModel.countDocuments(filters)
    }

    // Get upcoming appointments for a user
    async getUpcomingAppointments(userId) {
        const today = new Date().toDateString()
        return await appointmentModel.find({
            patient_id: userId,
            slot_date: { $gte: today },
            status: { $nin: ["cancelled"] },
        }).sort({ slot_date: 1, start_time: 1 })
    }

    // Get appointment history for a user
    async getAppointmentHistory(userId) {
        const today = new Date().toDateString()
        return await appointmentModel.find({
            patient_id: userId,
            $or: [
                { slot_date: { $lt: today } },
                { status: "cancelled" },
                { status: "completed" },
            ],
        }).sort({ created_at: -1 })
    }

    // Get statistics
    async getStats(filters = {}) {
        const totalAppointments = await appointmentModel.countDocuments(filters)
        const completedAppointments = await appointmentModel.countDocuments({ ...filters, status: "completed" })
        const cancelledAppointments = await appointmentModel.countDocuments({ ...filters, status: "cancelled" })
        const paidAppointments = await appointmentModel.countDocuments({
            ...filters,
            payment: "completed",
        })

        return {
            total: totalAppointments,
            completed: completedAppointments,
            cancelled: cancelledAppointments,
            paid: paidAppointments,
            pending: totalAppointments - completedAppointments - cancelledAppointments
        }
    }
}

export default new AppointmentRepository()
