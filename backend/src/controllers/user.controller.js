import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import validator from "validator";
import userModel from "../models/user.model.js";
import doctorModel from "../models/doctor.model.js";
import { splitFullNameToFirstLast } from "../utils/doctorName.util.js";
import { mapPatientGender, parsePatientDob } from "../utils/patient.util.js";
import appointmentModel from "../models/appointment.model.js";
import { v2 as cloudinary } from 'cloudinary'
import stripe from "stripe";
import razorpay from 'razorpay';

function addMinutesToTimeString(timeStr, minutesToAdd) {
    const parts = String(timeStr || "").split(":");
    const h = Number(parts[0]);
    const m = Number(parts[1] ?? 0);
    if (!Number.isFinite(h) || !Number.isFinite(m)) return String(timeStr || "");
    let totalMinutes = h * 60 + m + minutesToAdd;
    totalMinutes = ((totalMinutes % (24 * 60)) + (24 * 60)) % (24 * 60);
    const hh = Math.floor(totalMinutes / 60);
    const mm = totalMinutes % 60;
    return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

// Gateway Initialize
const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY)
const razorpayInstance = new razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
})

// API to register user
const registerUser = async (req, res) => {

    try {
        const { name, first_name, last_name, email, password } = req.body;

        let resolvedFirst = first_name?.trim();
        let resolvedLast = (last_name ?? "").trim();
        if (!resolvedFirst && name) {
            const split = splitFullNameToFirstLast(name);
            resolvedFirst = split.first_name;
            resolvedLast = split.last_name ?? "";
        }

        if (!resolvedFirst || !email || !password) {
            return res.json({ success: false, message: 'Missing Details' })
        }

        // validating email format
        if (!validator.isEmail(email)) {
            return res.json({ success: false, message: "Please enter a valid email" })
        }

        // validating strong password
        if (password.length < 8) {
            return res.json({ success: false, message: "Please enter a strong password" })
        }

        // hashing user password
        const salt = await bcrypt.genSalt(10); // the more no. round the more time it will take
        const hashedPassword = await bcrypt.hash(password, salt)

        const userData = {
            first_name: resolvedFirst,
            last_name: resolvedLast,
            email,
            password_hash: hashedPassword,
        }

        const newUser = new userModel(userData)
        const user = await newUser.save()
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET)

        res.json({ success: true, token })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to login user
const loginUser = async (req, res) => {

    try {
        const { email, password } = req.body;
        const user = await userModel.findOne({ email })

        if (!user) {
            return res.json({ success: false, message: "User does not exist" })
        }

        const isMatch = await bcrypt.compare(password, user.password_hash)

        if (isMatch) {
            const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET)
            res.json({ success: true, token })
        }
        else {
            res.json({ success: false, message: "Invalid credentials" })
        }
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to get user profile data
const getProfile = async (req, res) => {

    try {
        const { userId } = req.body
        const userData = await userModel.findById(userId).select('-password_hash')

        res.json({ success: true, userData })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to update user profile
const updateProfile = async (req, res) => {

    try {

        const { userId, name, first_name, last_name, phone, address, dob, gender } = req.body
        const imageFile = req.file

        let fn = first_name?.trim();
        let ln = (last_name ?? "").trim();
        if (!fn && name) {
            const split = splitFullNameToFirstLast(name);
            fn = split.first_name;
            ln = split.last_name ?? "";
        }

        if (!fn || !phone || !dob || !gender) {
            return res.json({ success: false, message: "Data Missing" })
        }

        const dobDate = parsePatientDob(dob);
        const genderStored = mapPatientGender(gender);

        await userModel.findByIdAndUpdate(userId, {
            first_name: fn,
            last_name: ln,
            phone,
            address: JSON.parse(address),
            dob: dobDate,
            gender: genderStored,
        })

        if (imageFile) {

            // upload image to cloudinary
            const imageUpload = await cloudinary.uploader.upload(imageFile.path, { resource_type: "image" })
            const imageURL = imageUpload.secure_url

            await userModel.findByIdAndUpdate(userId, { image: imageURL })
        }

        res.json({ success: true, message: 'Profile Updated' })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to book appointment 
const bookAppointment = async (req, res) => {

    try {

        const { userId, docId, slotDate, slotTime } = req.body
        const docData = await doctorModel.findById(docId).select("-password_hash")

        if (!docData?.is_profile_active) {
            return res.json({ success: false, message: 'Doctor Not Available' })
        }

        const durationMin = docData.default_slot_duration || 30
        const endTime = addMinutesToTimeString(slotTime, durationMin)

        const appointmentData = {
            patient_id: userId,
            doc_id: docId,
            slot_date: slotDate,
            start_time: slotTime,
            end_time: endTime,
            consultation_fee: docData.consultation_fee,
            mode: "clinic",
            payment: "pending",
            status: "booked",
            created_by: "PATIENT",
            updated_by: "PATIENT",
        }

        const newAppointment = new appointmentModel(appointmentData)
        await newAppointment.save()

        res.json({ success: true, message: 'Appointment Booked' })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }

}

// API to cancel appointment
const cancelAppointment = async (req, res) => {
    try {

        const { userId, appointmentId, cancellationReason = '' } = req.body
        const appointmentData = await appointmentModel.findById(appointmentId)

        // verify appointment user 
        const uid = appointmentData.patient_id
        if (String(uid) !== String(userId)) {
            return res.json({ success: false, message: 'Unauthorized action' })
        }

        await appointmentModel.findByIdAndUpdate(appointmentId, {
            status: "cancelled",
            cancelled: true,
            updated_by: "PATIENT",
            cancelled_by: "PATIENT",
            cancelled_by_actor_id: userId,
            cancelled_at: new Date(),
            cancellation_reason: cancellationReason,
        })

        res.json({ success: true, message: 'Appointment Cancelled' })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to get user appointments for frontend my-appointments page
const listAppointment = async (req, res) => {
    try {

        const { userId } = req.body
        const appointments = await appointmentModel
            .find({ patient_id: userId })
            .populate('doc_id', 'first_name last_name image specialization clinic_address')

        const mapped = appointments.map((item) => {
            const doctor = item.doc_id
            return {
                ...item.toObject({ virtuals: false }),
                docData: doctor ? {
                    _id: doctor._id,
                    name: doctor.name,
                    image: doctor.image || '',
                    speciality: doctor.specialization,
                    address: doctor.clinic_address || {},
                } : null,
            }
        })

        res.json({ success: true, appointments: mapped })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to make payment of appointment using razorpay
const paymentRazorpay = async (req, res) => {
    try {

        const { appointmentId } = req.body
        const appointmentData = await appointmentModel.findById(appointmentId)
        console.log("appointmentData", appointmentData)

        if (!appointmentData || appointmentData.cancelled) {
            return res.json({ success: false, message: 'Appointment Cancelled or not found' })
        }

        // creating options for razorpay payment
        const options = {
            amount: (appointmentData.consultation_fee ?? 0) * 100,
            currency: process.env.CURRENCY,
            receipt: appointmentId,
        }

        // creation of an order
        const order = await razorpayInstance.orders.create(options)
        console.log("order", order)
        res.json({ success: true, order })

    } catch (error) {
        console.log("error in razorpay", error)
        res.json({ success: false, message: error.message })
    }
}

// API to verify payment of razorpay
const verifyRazorpay = async (req, res) => {
    try {
        const { razorpay_order_id } = req.body
        const orderInfo = await razorpayInstance.orders.fetch(razorpay_order_id)

        if (orderInfo.status === 'paid') {
            await appointmentModel.findByIdAndUpdate(orderInfo.receipt, { payment: "completed" })
            res.json({ success: true, message: "Payment Successful" })
        }
        else {
            res.json({ success: false, message: 'Payment Failed' })
        }
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to make payment of appointment using Stripe
const paymentStripe = async (req, res) => {
    try {

        const { appointmentId } = req.body
        const { origin } = req.headers

        const appointmentData = await appointmentModel.findById(appointmentId)

        if (!appointmentData || appointmentData.cancelled) {
            return res.json({ success: false, message: 'Appointment Cancelled or not found' })
        }

        const currency = process.env.CURRENCY.toLocaleLowerCase()

        const line_items = [{
            price_data: {
                currency,
                product_data: {
                    name: "Appointment Fees"
                },
                unit_amount: (appointmentData.consultation_fee ?? 0) * 100
            },
            quantity: 1
        }]

        const session = await stripeInstance.checkout.sessions.create({
            success_url: `${origin}/verify?success=true&appointmentId=${appointmentData._id}`,
            cancel_url: `${origin}/verify?success=false&appointmentId=${appointmentData._id}`,
            line_items: line_items,
            mode: 'payment',
        })

        res.json({ success: true, session_url: session.url });

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

const verifyStripe = async (req, res) => {
    try {

        const { appointmentId, success } = req.body

        if (success === "true") {
            await appointmentModel.findByIdAndUpdate(appointmentId, { payment: "completed" })
            return res.json({ success: true, message: 'Payment Successful' })
        }

        res.json({ success: false, message: 'Payment Failed' })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }

}

export {
    loginUser,
    registerUser,
    getProfile,
    updateProfile,
    bookAppointment,
    listAppointment,
    cancelAppointment,
    paymentRazorpay,
    verifyRazorpay,
    paymentStripe,
    verifyStripe
}