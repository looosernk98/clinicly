import jwt from "jsonwebtoken";
import appointmentModel from "../models/appointmentModel.js";
import doctorModel from "../models/doctorModel.js";
import bcrypt from "bcrypt";
import validator from "validator";
import { v2 as cloudinary } from "cloudinary";
import userModel from "../models/userModel.js";

// API for admin login
const loginAdmin = async (req, res) => {
    try {

        const { email, password } = req.body

        if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
            const token = jwt.sign(email + password, process.env.JWT_SECRET)
            res.json({ success: true, token })
        } else {
            res.json({ success: false, message: "Invalid credentials" })
        }

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }

}


// API to get all appointments list
const appointmentsAdmin = async (req, res) => {
    try {

        const appointments = await appointmentModel.find({})
        res.json({ success: true, appointments })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }

}

// API for appointment cancellation
const appointmentCancel = async (req, res) => {
    try {

        const { appointmentId } = req.body
        await appointmentModel.findByIdAndUpdate(appointmentId, { cancelled: true })

        res.json({ success: true, message: 'Appointment Cancelled' })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }

}

// API for adding Doctor
const addDoctor = async (req, res) => {

    try {

        const { name, email, password, speciality, degree, experience, about, fees, address } = req.body
        const imageFile = req.file

        // checking for all data to add doctor
        if (!name || !email || !password || !speciality || !degree || !experience || !about || !fees || !address) {
            return res.json({ success: false, message: "Missing Details" })
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

        // upload image to cloudinary
        const imageUpload = await cloudinary.uploader.upload(imageFile.path, { resource_type: "image" })
        const imageUrl = imageUpload.secure_url

        const doctorData = {
            name,
            email,
            image: imageUrl,
            password: hashedPassword,
            speciality,
            degree,
            experience,
            about,
            fees,
            address: JSON.parse(address),
            date: Date.now()
        }

        const newDoctor = new doctorModel(doctorData)
        await newDoctor.save()
        res.json({ success: true, message: 'Doctor Added' })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to get all doctors list for admin panel
const allDoctors = async (req, res) => {
    try {

        const doctors = await doctorModel.find({}).select('-password')
        res.json({ success: true, doctors })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to get dashboard data for admin panel
const adminDashboard = async (req, res) => {
    try {

        const doctors = await doctorModel.find({})
        const users = await userModel.find({})
        const appointments = await appointmentModel.find({})

        const dashData = {
            doctors: doctors.length,
            appointments: appointments.length,
            patients: users.length,
            latestAppointments: appointments.reverse()
        }

        res.json({ success: true, dashData })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to bulk add doctors from static data
const bulkAddDoctors = async (req, res) => {
    try {
        const staticDoctors = [
            {
                name: 'Dr. Richard James',
                email: 'richard.james@clinicly.com',
                password: 'password123',
                speciality: 'General physician',
                degree: 'MBBS',
                experience: '4 Years',
                about: 'Dr. Davis has a strong commitment to delivering comprehensive medical care, focusing on preventive medicine, early diagnosis, and effective treatment strategies. Dr. Davis has a strong commitment to delivering comprehensive medical care, focusing on preventive medicine, early diagnosis, and effective treatment strategies.',
                fees: 500,
                address: {
                    line1: '17th Cross, Richmond',
                    line2: 'Circle, Ring Road, London'
                },
                imagePath: './public/images/doctors/doc1.png'
            },
            {
                name: 'Dr. Emily Larson',
                email: 'emily.larson@clinicly.com',
                password: 'password123',
                speciality: 'Gynecologist',
                degree: 'MBBS',
                experience: '3 Years',
                about: 'Dr. Davis has a strong commitment to delivering comprehensive medical care, focusing on preventive medicine, early diagnosis, and effective treatment strategies. Dr. Davis has a strong commitment to delivering comprehensive medical care, focusing on preventive medicine, early diagnosis, and effective treatment strategies.',
                fees: 600,
                address: {
                    line1: '27th Cross, Richmond',
                    line2: 'Circle, Ring Road, London'
                },
                imagePath: './public/images/doctors/doc2.png'
            },
            {
                name: 'Dr. Sarah Patel',
                email: 'sarah.patel@clinicly.com',
                password: 'password123',
                speciality: 'Dermatologist',
                degree: 'MBBS',
                experience: '1 Years',
                about: 'Dr. Davis has a strong commitment to delivering comprehensive medical care, focusing on preventive medicine, early diagnosis, and effective treatment strategies. Dr. Davis has a strong commitment to delivering comprehensive medical care, focusing on preventive medicine, early diagnosis, and effective treatment strategies.',
                fees: 300,
                address: {
                    line1: '37th Cross, Richmond',
                    line2: 'Circle, Ring Road, London'
                },
                imagePath: './public/images/doctors/doc3.png'
            },
            {
                name: 'Dr. Christopher Lee',
                email: 'christopher.lee@clinicly.com',
                password: 'password123',
                speciality: 'Pediatricians',
                degree: 'MBBS',
                experience: '2 Years',
                about: 'Dr. Davis has a strong commitment to delivering comprehensive medical care, focusing on preventive medicine, early diagnosis, and effective treatment strategies. Dr. Davis has a strong commitment to delivering comprehensive medical care, focusing on preventive medicine, early diagnosis, and effective treatment strategies.',
                fees: 400,
                address: {
                    line1: '47th Cross, Richmond',
                    line2: 'Circle, Ring Road, London'
                },
                imagePath: './public/images/doctors/doc4.png'
            },
            {
                name: 'Dr. Jennifer Garcia',
                email: 'jennifer.garcia@clinicly.com',
                password: 'password123',
                speciality: 'Neurologist',
                degree: 'MBBS',
                experience: '4 Years',
                about: 'Dr. Davis has a strong commitment to delivering comprehensive medical care, focusing on preventive medicine, early diagnosis, and effective treatment strategies. Dr. Davis has a strong commitment to delivering comprehensive medical care, focusing on preventive medicine, early diagnosis, and effective treatment strategies.',
                fees: 500,
                address: {
                    line1: '57th Cross, Richmond',
                    line2: 'Circle, Ring Road, London'
                },
                imagePath: './public/images/doctors/doc5.png'
            },
            {
                name: 'Dr. Andrew Williams',
                email: 'andrew.williams@clinicly.com',
                password: 'password123',
                speciality: 'Neurologist',
                degree: 'MBBS',
                experience: '4 Years',
                about: 'Dr. Davis has a strong commitment to delivering comprehensive medical care, focusing on preventive medicine, early diagnosis, and effective treatment strategies. Dr. Davis has a strong commitment to delivering comprehensive medical care, focusing on preventive medicine, early diagnosis, and effective treatment strategies.',
                fees: 500,
                address: {
                    line1: '57th Cross, Richmond',
                    line2: 'Circle, Ring Road, London'
                },
                imagePath: './public/images/doctors/doc6.png'
            },
            {
                name: 'Dr. Christopher Davis',
                email: 'christopher.davis@clinicly.com',
                password: 'password123',
                speciality: 'General physician',
                degree: 'MBBS',
                experience: '4 Years',
                about: 'Dr. Davis has a strong commitment to delivering comprehensive medical care, focusing on preventive medicine, early diagnosis, and effective treatment strategies. Dr. Davis has a strong commitment to delivering comprehensive medical care, focusing on preventive medicine, early diagnosis, and effective treatment strategies.',
                fees: 500,
                address: {
                    line1: '17th Cross, Richmond',
                    line2: 'Circle, Ring Road, London'
                },
                imagePath: './public/images/doctors/doc7.png'
            },
            {
                name: 'Dr. Timothy White',
                email: 'timothy.white@clinicly.com',
                password: 'password123',
                speciality: 'Gynecologist',
                degree: 'MBBS',
                experience: '3 Years',
                about: 'Dr. Davis has a strong commitment to delivering comprehensive medical care, focusing on preventive medicine, early diagnosis, and effective treatment strategies. Dr. Davis has a strong commitment to delivering comprehensive medical care, focusing on preventive medicine, early diagnosis, and effective treatment strategies.',
                fees: 600,
                address: {
                    line1: '27th Cross, Richmond',
                    line2: 'Circle, Ring Road, London'
                },
                imagePath: './public/images/doctors/doc8.png'
            },
            {
                name: 'Dr. Ava Mitchell',
                email: 'ava.mitchell@clinicly.com',
                password: 'password123',
                speciality: 'Dermatologist',
                degree: 'MBBS',
                experience: '1 Years',
                about: 'Dr. Davis has a strong commitment to delivering comprehensive medical care, focusing on preventive medicine, early diagnosis, and effective treatment strategies. Dr. Davis has a strong commitment to delivering comprehensive medical care, focusing on preventive medicine, early diagnosis, and effective treatment strategies.',
                fees: 300,
                address: {
                    line1: '37th Cross, Richmond',
                    line2: 'Circle, Ring Road, London'
                },
                imagePath: './public/images/doctors/doc9.png'
            },
            {
                name: 'Dr. Jeffrey King',
                email: 'jeffrey.king@clinicly.com',
                password: 'password123',
                speciality: 'Pediatricians',
                degree: 'MBBS',
                experience: '2 Years',
                about: 'Dr. Davis has a strong commitment to delivering comprehensive medical care, focusing on preventive medicine, early diagnosis, and effective treatment strategies. Dr. Davis has a strong commitment to delivering comprehensive medical care, focusing on preventive medicine, early diagnosis, and effective treatment strategies.',
                fees: 400,
                address: {
                    line1: '47th Cross, Richmond',
                    line2: 'Circle, Ring Road, London'
                },
                imagePath: './public/images/doctors/doc10.png'
            },
            {
                name: 'Dr. Zoe Kelly',
                email: 'zoe.kelly@clinicly.com',
                password: 'password123',
                speciality: 'Neurologist',
                degree: 'MBBS',
                experience: '4 Years',
                about: 'Dr. Davis has a strong commitment to delivering comprehensive medical care, focusing on preventive medicine, early diagnosis, and effective treatment strategies. Dr. Davis has a strong commitment to delivering comprehensive medical care, focusing on preventive medicine, early diagnosis, and effective treatment strategies.',
                fees: 500,
                address: {
                    line1: '57th Cross, Richmond',
                    line2: 'Circle, Ring Road, London'
                },
                imagePath: './public/images/doctors/doc11.png'
            },
            {
                name: 'Dr. Patrick Harris',
                email: 'patrick.harris@clinicly.com',
                password: 'password123',
                speciality: 'Neurologist',
                degree: 'MBBS',
                experience: '4 Years',
                about: 'Dr. Davis has a strong commitment to delivering comprehensive medical care, focusing on preventive medicine, early diagnosis, and effective treatment strategies. Dr. Davis has a strong commitment to delivering comprehensive medical care, focusing on preventive medicine, early diagnosis, and effective treatment strategies.',
                fees: 500,
                address: {
                    line1: '57th Cross, Richmond',
                    line2: 'Circle, Ring Road, London'
                },
                imagePath: './public/images/doctors/doc12.png'
            },
            {
                name: 'Dr. Chloe Evans',
                email: 'chloe.evans@clinicly.com',
                password: 'password123',
                speciality: 'General physician',
                degree: 'MBBS',
                experience: '4 Years',
                about: 'Dr. Davis has a strong commitment to delivering comprehensive medical care, focusing on preventive medicine, early diagnosis, and effective treatment strategies. Dr. Davis has a strong commitment to delivering comprehensive medical care, focusing on preventive medicine, early diagnosis, and effective treatment strategies.',
                fees: 500,
                address: {
                    line1: '17th Cross, Richmond',
                    line2: 'Circle, Ring Road, London'
                },
                imagePath: './public/images/doctors/doc13.png'
            },
            {
                name: 'Dr. Ryan Martinez',
                email: 'ryan.martinez@clinicly.com',
                password: 'password123',
                speciality: 'Gynecologist',
                degree: 'MBBS',
                experience: '3 Years',
                about: 'Dr. Davis has a strong commitment to delivering comprehensive medical care, focusing on preventive medicine, early diagnosis, and effective treatment strategies. Dr. Davis has a strong commitment to delivering comprehensive medical care, focusing on preventive medicine, early diagnosis, and effective treatment strategies.',
                fees: 600,
                address: {
                    line1: '27th Cross, Richmond',
                    line2: 'Circle, Ring Road, London'
                },
                imagePath: './public/images/doctors/doc14.png'
            }
        ];

        let addedCount = 0;
        let skippedCount = 0;

        for (const doctorData of staticDoctors) {
            try {
                // Check if doctor already exists
                const existingDoctor = await doctorModel.findOne({ email: doctorData.email });
                
                if (existingDoctor) {
                    skippedCount++;
                    continue;
                }

                // Upload image to Cloudinary
                let imageUrl = '';
                try {
                    const imageUpload = await cloudinary.uploader.upload(doctorData.imagePath, { 
                        resource_type: "image",
                        folder: "doctors"
                    });
                    imageUrl = imageUpload.secure_url;
                } catch (uploadError) {
                    console.log(`Error uploading image for ${doctorData.name}:`, uploadError.message);
                    // Use a default image if upload fails
                    imageUrl = 'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg';
                }

                // Hash password
                const salt = await bcrypt.genSalt(10);
                const hashedPassword = await bcrypt.hash(doctorData.password, salt);

                // Create doctor object
                const newDoctor = new doctorModel({
                    name: doctorData.name,
                    email: doctorData.email,
                    password: hashedPassword,
                    image: imageUrl,
                    speciality: doctorData.speciality,
                    degree: doctorData.degree,
                    experience: doctorData.experience,
                    about: doctorData.about,
                    fees: doctorData.fees,
                    address: doctorData.address,
                    date: Date.now()
                });

                await newDoctor.save();
                addedCount++;
                console.log(`✅ Added doctor: ${doctorData.name}`);

            } catch (error) {
                console.log(`Error adding doctor ${doctorData.name}:`, error.message);
                skippedCount++;
            }
        }

        res.json({ 
            success: true, 
            message: `Bulk doctor addition completed. Added: ${addedCount}, Skipped: ${skippedCount}`,
            addedCount,
            skippedCount
        });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// API to update existing doctors with proper images
const updateDoctorImages = async (req, res) => {
    try {
        const doctorImageMap = [
            { email: 'richard.james@clinicly.com', imagePath: './public/images/doctors/doc1.png' },
            { email: 'emily.larson@clinicly.com', imagePath: './public/images/doctors/doc2.png' },
            { email: 'sarah.patel@clinicly.com', imagePath: './public/images/doctors/doc3.png' },
            { email: 'christopher.lee@clinicly.com', imagePath: './public/images/doctors/doc4.png' },
            { email: 'jennifer.garcia@clinicly.com', imagePath: './public/images/doctors/doc5.png' },
            { email: 'andrew.williams@clinicly.com', imagePath: './public/images/doctors/doc6.png' },
            { email: 'christopher.davis@clinicly.com', imagePath: './public/images/doctors/doc7.png' },
            { email: 'timothy.white@clinicly.com', imagePath: './public/images/doctors/doc8.png' },
            { email: 'ava.mitchell@clinicly.com', imagePath: './public/images/doctors/doc9.png' },
            { email: 'jeffrey.king@clinicly.com', imagePath: './public/images/doctors/doc10.png' },
            { email: 'zoe.kelly@clinicly.com', imagePath: './public/images/doctors/doc11.png' },
            { email: 'patrick.harris@clinicly.com', imagePath: './public/images/doctors/doc12.png' },
            { email: 'chloe.evans@clinicly.com', imagePath: './public/images/doctors/doc13.png' },
            { email: 'ryan.martinez@clinicly.com', imagePath: './public/images/doctors/doc14.png' }
        ];

        let updatedCount = 0;
        let skippedCount = 0;

        for (const doctorImage of doctorImageMap) {
            try {
                // Find the doctor by email
                const existingDoctor = await doctorModel.findOne({ email: doctorImage.email });
                
                if (!existingDoctor) {
                    skippedCount++;
                    continue;
                }

                // Upload image to Cloudinary
                let imageUrl = '';
                try {
                    const imageUpload = await cloudinary.uploader.upload(doctorImage.imagePath, { 
                        resource_type: "image",
                        folder: "doctors"
                    });
                    imageUrl = imageUpload.secure_url;
                } catch (uploadError) {
                    console.log(`Error uploading image for ${doctorImage.email}:`, uploadError.message);
                    // Use a default image if upload fails
                    imageUrl = 'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg';
                }

                // Update the doctor's image
                await doctorModel.findByIdAndUpdate(existingDoctor._id, { image: imageUrl });
                updatedCount++;
                console.log(`✅ Updated image for: ${existingDoctor.name}`);

            } catch (error) {
                console.log(`Error updating doctor ${doctorImage.email}:`, error.message);
                skippedCount++;
            }
        }

        res.json({ 
            success: true, 
            message: `Doctor image updates completed. Updated: ${updatedCount}, Skipped: ${skippedCount}`,
            updatedCount,
            skippedCount
        });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

export {
    loginAdmin,
    appointmentsAdmin,
    appointmentCancel,
    addDoctor,
    allDoctors,
    adminDashboard,
    bulkAddDoctors,
    updateDoctorImages
}