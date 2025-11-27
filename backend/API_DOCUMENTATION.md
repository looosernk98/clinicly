# Clinicly API Documentation

Base URL: `/api`

## Table of Contents
- [How to Create a New API](#how-to-create-a-new-api)
- [Health Check](#health-check)
- [User APIs](#user-apis)
  - [Authentication](#user-authentication)
  - [Profile Management](#profile-management)
  - [Appointments](#user-appointments)
  - [Payments](#payments)
- [Admin APIs](#admin-apis)
  - [Authentication](#admin-authentication)
  - [Doctor Management](#doctor-management)
  - [Appointment Management](#admin-appointment-management)
  - [Dashboard](#admin-dashboard)
- [Doctor APIs](#doctor-apis)
  - [Authentication](#doctor-authentication)
  - [Public Routes](#doctor-public-routes)
  - [Appointment Management](#doctor-appointment-management)
  - [Profile & Dashboard](#doctor-profile--dashboard)

---

## How to Create a New API

### Steps:

1. **Create Model/Schema** (if needed) in `src/models/[name].model.js`
   - Define Mongoose schema
   - Export the model

2. **Create Repository** (optional, for database operations) in `src/repositories/[name].repo.js`
   - Add database query functions
   - Export repository functions

3. **Create Service** (optional, for business logic) in `src/services/[name].service.js`
   - Add business logic functions
   - Export service functions

4. **Create Controller Function** in `src/controllers/[user|admin|doctor].controller.js`
   - Write the API logic
   - Handle request/response
   - Add try-catch for error handling
   - Export the controller function

5. **Add Route** in `src/routes/[user|admin|doctor].routes.js`
   - Import the controller function at the top
   - Define HTTP method (GET/POST/PUT/DELETE)
   - Set the endpoint path
   - Add authentication middleware if needed (`authUser`, `authAdmin`, or `authDoctor`)
   - Add file upload middleware if needed (`upload.single('image')`)

6. **Add Validation** (optional) in `src/validations/[name].validation.js`
   - Define input validation rules
   - Export validation middleware

7. **Test the API** using Postman or similar tool
   - Test success cases
   - Test error cases
   - Verify authentication
   - Check response format

---

## Health Check

### Check API Status
Get the current status of the API server.

**Endpoint:** `GET /api/`

**Authentication:** Not required

**Response:**
```json
{
  "success": true,
  "message": "Clinicly API is running successfully",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

---

## User APIs

Base path: `/api/user`

### User Authentication

#### 1. Register User
Register a new user account.

**Endpoint:** `POST /api/user/register`

**Authentication:** Not required

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john.doe@example.com",
  "password": "password123"
}
```

**Validation:**
- `name`, `email`, and `password` are required
- Email must be valid format
- Password must be at least 8 characters

**Response:**
```json
{
  "success": true,
  "token": "jwt_token_here"
}
```

---

#### 2. Login User
Login with existing user credentials.

**Endpoint:** `POST /api/user/login`

**Authentication:** Not required

**Request Body:**
```json
{
  "email": "john.doe@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "token": "jwt_token_here"
}
```

---

### Profile Management

#### 3. Get User Profile
Get the logged-in user's profile information.

**Endpoint:** `GET /api/user/get-profile`

**Authentication:** Required (Bearer Token)

**Response:**
```json
{
  "success": true,
  "userData": {
    "_id": "user_id",
    "name": "John Doe",
    "email": "john.doe@example.com",
    "image": "image_url",
    "phone": "+1234567890",
    "address": {
      "line1": "123 Main St",
      "line2": "Apt 4B"
    },
    "dob": "1990-01-01",
    "gender": "Male"
  }
}
```

---

#### 4. Update User Profile
Update user profile information.

**Endpoint:** `POST /api/user/update-profile`

**Authentication:** Required (Bearer Token)

**Content-Type:** `multipart/form-data`

**Request Body:**
- `name` (string, required)
- `phone` (string, required)
- `address` (JSON string, required) - e.g., `{"line1": "123 Main St", "line2": "Apt 4B"}`
- `dob` (string, required)
- `gender` (string, required)
- `image` (file, optional) - Profile image file

**Response:**
```json
{
  "success": true,
  "message": "Profile Updated"
}
```

---

### User Appointments

#### 5. Book Appointment
Book a new appointment with a doctor.

**Endpoint:** `POST /api/user/book-appointment`

**Authentication:** Required (Bearer Token)

**Request Body:**
```json
{
  "docId": "doctor_id",
  "slotDate": "2024-01-15",
  "slotTime": "10:00 AM"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Appointment Booked"
}
```

---

#### 6. List User Appointments
Get all appointments for the logged-in user.

**Endpoint:** `GET /api/user/appointments`

**Authentication:** Required (Bearer Token)

**Response:**
```json
{
  "success": true,
  "appointments": [
    {
      "_id": "appointment_id",
      "docId": "doctor_id",
      "userId": "user_id",
      "slotDate": "2024-01-15",
      "slotTime": "10:00 AM",
      "amount": 500,
      "cancelled": false,
      "payment": false,
      "isCompleted": false,
      "docData": { /* doctor details */ },
      "userData": { /* user details */ }
    }
  ]
}
```

---

#### 7. Cancel Appointment
Cancel an existing appointment.

**Endpoint:** `POST /api/user/cancel-appointment`

**Authentication:** Required (Bearer Token)

**Request Body:**
```json
{
  "appointmentId": "appointment_id"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Appointment Cancelled"
}
```

---

### Payments

#### 8. Create Razorpay Payment
Initialize a Razorpay payment for an appointment.

**Endpoint:** `POST /api/user/payment-razorpay`

**Authentication:** Required (Bearer Token)

**Request Body:**
```json
{
  "appointmentId": "appointment_id"
}
```

**Response:**
```json
{
  "success": true,
  "order": {
    "id": "order_id",
    "amount": 50000,
    "currency": "INR",
    "receipt": "appointment_id"
  }
}
```

---

#### 9. Verify Razorpay Payment
Verify a completed Razorpay payment.

**Endpoint:** `POST /api/user/verifyRazorpay`

**Authentication:** Required (Bearer Token)

**Request Body:**
```json
{
  "razorpay_order_id": "order_id"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Payment Successful"
}
```

---

#### 10. Create Stripe Payment
Initialize a Stripe payment session for an appointment.

**Endpoint:** `POST /api/user/payment-stripe`

**Authentication:** Required (Bearer Token)

**Request Body:**
```json
{
  "appointmentId": "appointment_id"
}
```

**Response:**
```json
{
  "success": true,
  "session_url": "https://checkout.stripe.com/session_url"
}
```

---

#### 11. Verify Stripe Payment
Verify a completed Stripe payment.

**Endpoint:** `POST /api/user/verifyStripe`

**Authentication:** Required (Bearer Token)

**Request Body:**
```json
{
  "appointmentId": "appointment_id",
  "success": "true"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Payment Successful"
}
```

---

## Admin APIs

Base path: `/api/admin`

### Admin Authentication

#### 12. Admin Login
Login with admin credentials.

**Endpoint:** `POST /api/admin/login`

**Authentication:** Not required

**Request Body:**
```json
{
  "email": "admin@clinicly.com",
  "password": "admin_password"
}
```

**Response:**
```json
{
  "success": true,
  "token": "jwt_token_here"
}
```

---

### Doctor Management

#### 13. Add Doctor
Add a new doctor to the system.

**Endpoint:** `POST /api/admin/add-doctor`

**Authentication:** Required (Admin Token)

**Content-Type:** `multipart/form-data`

**Request Body:**
- `name` (string, required)
- `email` (string, required)
- `password` (string, required, min 8 characters)
- `speciality` (string, required)
- `degree` (string, required)
- `experience` (string, required)
- `about` (string, required)
- `fees` (number, required)
- `address` (JSON string, required) - e.g., `{"line1": "123 Main St", "line2": "London"}`
- `image` (file, required) - Doctor's profile image

**Response:**
```json
{
  "success": true,
  "message": "Doctor Added"
}
```

---

#### 14. Bulk Add Doctors
Add multiple predefined doctors to the system at once.

**Endpoint:** `POST /api/admin/bulk-add-doctors`

**Authentication:** Required (Admin Token)

**Request Body:** None (uses predefined doctor list)

**Response:**
```json
{
  "success": true,
  "message": "Bulk doctor addition completed. Added: 14, Skipped: 0",
  "addedCount": 14,
  "skippedCount": 0
}
```

---

#### 15. Update Doctor Images
Update images for existing doctors in the system.

**Endpoint:** `POST /api/admin/update-doctor-images`

**Authentication:** Required (Admin Token)

**Request Body:** None (uses predefined doctor-image mapping)

**Response:**
```json
{
  "success": true,
  "message": "Doctor image updates completed. Updated: 14, Skipped: 0",
  "updatedCount": 14,
  "skippedCount": 0
}
```

---

#### 16. Get All Doctors
Retrieve a list of all doctors in the system.

**Endpoint:** `GET /api/admin/all-doctors`

**Authentication:** Required (Admin Token)

**Response:**
```json
{
  "success": true,
  "doctors": [
    {
      "_id": "doctor_id",
      "name": "Dr. Richard James",
      "email": "richard.james@clinicly.com",
      "image": "image_url",
      "speciality": "General physician",
      "degree": "MBBS",
      "experience": "4 Years",
      "about": "Doctor description...",
      "fees": 500,
      "address": {
        "line1": "17th Cross, Richmond",
        "line2": "Circle, Ring Road, London"
      },
      "available": true,
      "slots_booked": {}
    }
  ]
}
```

---

#### 17. Change Doctor Availability
Toggle a doctor's availability status.

**Endpoint:** `POST /api/admin/change-availability`

**Authentication:** Required (Admin Token)

**Request Body:**
```json
{
  "docId": "doctor_id"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Availablity Changed"
}
```

---

### Admin Appointment Management

#### 18. Get All Appointments
Retrieve all appointments in the system.

**Endpoint:** `GET /api/admin/appointments`

**Authentication:** Required (Admin Token)

**Response:**
```json
{
  "success": true,
  "appointments": [
    {
      "_id": "appointment_id",
      "docId": "doctor_id",
      "userId": "user_id",
      "slotDate": "2024-01-15",
      "slotTime": "10:00 AM",
      "amount": 500,
      "cancelled": false,
      "payment": false,
      "isCompleted": false,
      "docData": { /* doctor details */ },
      "userData": { /* user details */ }
    }
  ]
}
```

---

#### 19. Cancel Appointment (Admin)
Cancel an appointment as admin.

**Endpoint:** `POST /api/admin/cancel-appointment`

**Authentication:** Required (Admin Token)

**Request Body:**
```json
{
  "appointmentId": "appointment_id"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Appointment Cancelled"
}
```

---

### Admin Dashboard

#### 20. Get Admin Dashboard Data
Get statistics and data for the admin dashboard.

**Endpoint:** `GET /api/admin/dashboard`

**Authentication:** Required (Admin Token)

**Response:**
```json
{
  "success": true,
  "dashData": {
    "doctors": 14,
    "appointments": 25,
    "patients": 10,
    "latestAppointments": [ /* array of appointments */ ]
  }
}
```

---

## Doctor APIs

Base path: `/api/doctor`

### Doctor Authentication

#### 21. Doctor Login
Login with doctor credentials.

**Endpoint:** `POST /api/doctor/login`

**Authentication:** Not required

**Request Body:**
```json
{
  "email": "doctor@clinicly.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "token": "jwt_token_here"
}
```

---

### Doctor Public Routes

#### 22. Get Doctor List
Retrieve a list of all available doctors (public access).

**Endpoint:** `GET /api/doctor/list`

**Authentication:** Not required

**Response:**
```json
{
  "success": true,
  "doctors": [
    {
      "_id": "doctor_id",
      "name": "Dr. Richard James",
      "image": "image_url",
      "speciality": "General physician",
      "degree": "MBBS",
      "experience": "4 Years",
      "about": "Doctor description...",
      "fees": 500,
      "address": {
        "line1": "17th Cross, Richmond",
        "line2": "Circle, Ring Road, London"
      },
      "available": true
    }
  ]
}
```

---

### Doctor Appointment Management

#### 23. Get Doctor Appointments
Get all appointments for the logged-in doctor.

**Endpoint:** `GET /api/doctor/appointments`

**Authentication:** Required (Doctor Token)

**Response:**
```json
{
  "success": true,
  "appointments": [
    {
      "_id": "appointment_id",
      "docId": "doctor_id",
      "userId": "user_id",
      "slotDate": "2024-01-15",
      "slotTime": "10:00 AM",
      "amount": 500,
      "cancelled": false,
      "payment": false,
      "isCompleted": false,
      "docData": { /* doctor details */ },
      "userData": { /* user details */ }
    }
  ]
}
```

---

#### 24. Cancel Appointment (Doctor)
Cancel an appointment as doctor.

**Endpoint:** `POST /api/doctor/cancel-appointment`

**Authentication:** Required (Doctor Token)

**Request Body:**
```json
{
  "appointmentId": "appointment_id"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Appointment Cancelled"
}
```

---

#### 25. Mark Appointment Complete
Mark an appointment as completed.

**Endpoint:** `POST /api/doctor/complete-appointment`

**Authentication:** Required (Doctor Token)

**Request Body:**
```json
{
  "appointmentId": "appointment_id"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Appointment Completed"
}
```

---

#### 26. Change Doctor Availability (Self)
Toggle the logged-in doctor's availability status.

**Endpoint:** `POST /api/doctor/change-availability`

**Authentication:** Required (Doctor Token)

**Request Body:**
```json
{
  "docId": "doctor_id"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Availablity Changed"
}
```

---

### Doctor Profile & Dashboard

#### 27. Get Doctor Profile
Get the logged-in doctor's profile information.

**Endpoint:** `GET /api/doctor/profile`

**Authentication:** Required (Doctor Token)

**Response:**
```json
{
  "success": true,
  "profileData": {
    "_id": "doctor_id",
    "name": "Dr. Richard James",
    "email": "richard.james@clinicly.com",
    "image": "image_url",
    "speciality": "General physician",
    "degree": "MBBS",
    "experience": "4 Years",
    "about": "Doctor description...",
    "fees": 500,
    "address": {
      "line1": "17th Cross, Richmond",
      "line2": "Circle, Ring Road, London"
    },
    "available": true,
    "slots_booked": {}
  }
}
```

---

#### 28. Update Doctor Profile
Update the logged-in doctor's profile information.

**Endpoint:** `POST /api/doctor/update-profile`

**Authentication:** Required (Doctor Token)

**Request Body:**
```json
{
  "fees": 600,
  "address": {
    "line1": "17th Cross, Richmond",
    "line2": "Circle, Ring Road, London"
  },
  "available": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Profile Updated"
}
```

---

#### 29. Get Doctor Dashboard Data
Get statistics and data for the doctor dashboard.

**Endpoint:** `GET /api/doctor/dashboard`

**Authentication:** Required (Doctor Token)

**Response:**
```json
{
  "success": true,
  "dashData": {
    "earnings": 5000,
    "appointments": 25,
    "patients": 15,
    "latestAppointments": [ /* array of appointments */ ]
  }
}
```

---

## Authentication Headers

For protected routes, include the JWT token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

---

## Error Responses

All endpoints return errors in the following format:

```json
{
  "success": false,
  "message": "Error message here"
}
```

Common HTTP status codes:
- `200` - Success
- `400` - Bad Request
- `401` - Unauthorized
- `404` - Not Found
- `500` - Internal Server Error

---

## Notes

1. **Authentication Tokens**: Store the JWT token received after login and include it in the `Authorization` header for protected routes.

2. **File Uploads**: Use `multipart/form-data` content type for endpoints that accept file uploads (profile images, doctor images).

3. **Date Format**: Use ISO 8601 format for dates (e.g., `2024-01-15`).

4. **Address Format**: Send address as a JSON object with `line1` and `line2` properties. When sending as form data, stringify the JSON object.

5. **Payment Integration**: The API supports both Razorpay and Stripe payment gateways. Choose the appropriate endpoints based on your payment provider.

6. **Slot Booking**: Before booking an appointment, ensure the doctor is available and the selected time slot is not already booked.

7. **Currency**: Payment amounts are in the smallest currency unit (e.g., paise for INR, cents for USD).

---

## Environment Variables Required

```env
JWT_SECRET=your_jwt_secret
ADMIN_EMAIL=admin@clinicly.com
ADMIN_PASSWORD=admin_password
STRIPE_SECRET_KEY=your_stripe_secret_key
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
CURRENCY=INR
CLOUDINARY_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_SECRET_KEY=your_cloudinary_secret_key
```

---

**Last Updated:** November 2024  
**API Version:** 1.0  
**Base URL:** `/api`

