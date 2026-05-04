// Doctor related types
export interface DoctorAddress {
  line1: string
  line2: string
}

export interface Doctor {
  _id: string
  name: string
  image: string
  speciality: string
  degree: string
  experience: string
  about: string
  fees: number
  available?: boolean
  address: DoctorAddress
  slots_booked: Record<string, string[]>
}

// Speciality data type
export interface SpecialityItem {
  speciality: string
  image: string
}

// User related types
export interface UserAddress {
  line1: string
  line2: string
}

export interface UserData {
  _id: string
  name: string
  email: string
  phone: string
  image: string
  address: UserAddress
  gender: string
  dob: string
}

// Appointment related types
export interface AppointmentDocData {
  _id: string
  name: string
  image: string
  speciality: string
  address: DoctorAddress
}

export interface Appointment {
  _id: string
  docData: AppointmentDocData
  slot_date: string
  start_time: string
  cancelled: boolean
  payment: string
  isCompleted: boolean
}

// Slot types
export interface TimeSlot {
  datetime: Date
  time: string
}

// Razorpay Order type
export interface RazorpayOrder {
  id: string
  amount: number
  currency: string
  receipt: string
}

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean
  message?: string
  data?: T
}

export interface DoctorListResponse {
  success: boolean
  doctors: Doctor[]
  message?: string
}

export interface UserProfileResponse {
  success: boolean
  userData: UserData
  message?: string
}

export interface AppointmentsResponse {
  success: boolean
  appointments: Appointment[]
  message?: string
}

export interface AuthResponse {
  success: boolean
  token: string
  message?: string
}

export interface PaymentResponse {
  success: boolean
  order?: RazorpayOrder
  session_url?: string
  message?: string
}

// App Context type
export interface AppContextType {
  doctors: Doctor[]
  getDoctosData: () => Promise<void>
  currencySymbol: string
  backendUrl: string
  token: string
  setToken: React.Dispatch<React.SetStateAction<string>>
  userData: UserData | false
  setUserData: React.Dispatch<React.SetStateAction<UserData | false>>
  loadUserProfileData: () => Promise<void>
}
