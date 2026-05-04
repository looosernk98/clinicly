import { createContext, useEffect, useState, ReactNode, useMemo } from 'react'
import { toast } from 'react-toastify'
import axios from 'axios'
import { Doctor, UserData, AppContextType } from '../types/index'

export const AppContext = createContext<AppContextType | null>(null)

interface AppContextProviderProps {
  children: ReactNode
}

const AppContextProvider: React.FC<AppContextProviderProps> = ({ children }) => {
  const currencySymbol = '₹'
  const backendUrl = import.meta.env.VITE_BACKEND_URL

  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [token, setToken] = useState<string>(localStorage.getItem('token') || '')
  const [userData, setUserData] = useState<UserData | false>(false)

  // Getting Doctors using API
  const getDoctosData = async (): Promise<void> => {
    try {
      const { data } = await axios.get(backendUrl + '/api/doctor/list')
      if (data.success) {
        setDoctors(data.doctors)
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      console.log(error)
      if (error instanceof Error) {
        toast.error(error.message)
      }
    }
  }

  // Getting User Profile using API
  const loadUserProfileData = async (): Promise<void> => {
    try {
      const { data } = await axios.get(backendUrl + '/api/user/get-profile', {
        headers: { token }
      })

      if (data.success) {
        setUserData(data.userData)
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      console.log(error)
      if (error instanceof Error) {
        toast.error(error.message)
      }
    }
  }

  useEffect(() => {
    getDoctosData()
  }, [])

  useEffect(() => {
    if (token) {
      loadUserProfileData()
    }
  }, [token])

  const value: AppContextType = useMemo(() => (
    {
      doctors,
      getDoctosData,
      currencySymbol,
      backendUrl,
      token,
      setToken,
      userData,
      setUserData,
      loadUserProfileData
    }
  ), [doctors.length, token, JSON.stringify(userData)])

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  )
}

export default AppContextProvider
