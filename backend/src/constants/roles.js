// User Roles
export const USER_ROLES = {
    ADMIN: 'admin',
    DOCTOR: 'doctor',
    USER: 'user'
}

// Doctor Specialities
export const DOCTOR_SPECIALITIES = {
    GENERAL_PHYSICIAN: 'General physician',
    GYNECOLOGIST: 'Gynecologist',
    DERMATOLOGIST: 'Dermatologist',
    PEDIATRICIAN: 'Pediatricians',
    NEUROLOGIST: 'Neurologist',
    GASTROENTEROLOGIST: 'Gastroenterologist'
}

// Appointment Status
export const APPOINTMENT_STATUS = {
    PENDING: 'pending',
    CONFIRMED: 'confirmed',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled'
}

// Payment Status
export const PAYMENT_STATUS = {
    PENDING: 'pending',
    PAID: 'paid',
    FAILED: 'failed',
    REFUNDED: 'refunded'
}

export default {
    USER_ROLES,
    DOCTOR_SPECIALITIES,
    APPOINTMENT_STATUS,
    PAYMENT_STATUS
}
