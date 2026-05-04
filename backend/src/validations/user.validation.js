import validator from 'validator'

export const validateUserRegistration = (data) => {
    const errors = []
    const { name, first_name, email, password } = data

    const displayName =
        (first_name != null && String(first_name).trim()) ||
        (name != null && String(name).trim()) ||
        ""

    if (!displayName || displayName.length < 2) {
        errors.push('Name must be at least 2 characters long (provide name or first_name)')
    }

    // Email validation
    if (!email) {
        errors.push('Email is required')
    } else if (!validator.isEmail(email)) {
        errors.push('Please provide a valid email address')
    }

    // Password validation
    if (!password) {
        errors.push('Password is required')
    } else if (password.length < 8) {
        errors.push('Password must be at least 8 characters long')
    } else if (!validator.isStrongPassword(password, { 
        minLength: 8, 
        minLowercase: 1, 
        minUppercase: 1, 
        minNumbers: 1, 
        minSymbols: 0 
    })) {
        errors.push('Password must contain at least one uppercase letter, one lowercase letter, and one number')
    }

    return {
        isValid: errors.length === 0,
        errors
    }
}

export const validateUserLogin = (data) => {
    const errors = []
    const { email, password } = data

    // Email validation
    if (!email) {
        errors.push('Email is required')
    } else if (!validator.isEmail(email)) {
        errors.push('Please provide a valid email address')
    }

    // Password validation
    if (!password) {
        errors.push('Password is required')
    }

    return {
        isValid: errors.length === 0,
        errors
    }
}

export const validateUserProfile = (data) => {
    const errors = []
    const { name, phone, address, gender, dob } = data

    // Name validation (if provided)
    if (name && name.trim().length < 2) {
        errors.push('Name must be at least 2 characters long')
    }

    // Phone validation (if provided)
    if (phone && !validator.isMobilePhone(phone, 'any')) {
        errors.push('Please provide a valid phone number')
    }

    // Address validation (if provided)
    if (address && typeof address !== 'object') {
        errors.push('Address must be an object with line1 and line2 properties')
    }

    // Gender validation (if provided)
    const validGenders = ['Male', 'Female', 'Other', 'Not Selected']
    if (gender && !validGenders.includes(gender)) {
        errors.push('Gender must be one of: Male, Female, Other, Not Selected')
    }

    // Date of birth validation (if provided)
    if (dob && dob !== 'Not Selected' && !validator.isDate(dob)) {
        errors.push('Please provide a valid date of birth')
    }

    return {
        isValid: errors.length === 0,
        errors
    }
}

export const validateAppointmentBooking = (data) => {
    const errors = []
    const { docId, slotDate, slotTime } = data

    // Doctor ID validation
    if (!docId || !validator.isMongoId(docId)) {
        errors.push('Valid doctor ID is required')
    }

    // Slot date validation
    if (!slotDate) {
        errors.push('Appointment date is required')
    } else if (!validator.isDate(slotDate)) {
        errors.push('Please provide a valid appointment date')
    } else {
        const appointmentDate = new Date(slotDate)
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        
        if (appointmentDate < today) {
            errors.push('Appointment date cannot be in the past')
        }
    }

    // Slot time validation
    if (!slotTime) {
        errors.push('Appointment time is required')
    }

    return {
        isValid: errors.length === 0,
        errors
    }
}
