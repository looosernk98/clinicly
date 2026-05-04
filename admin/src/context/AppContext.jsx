import { createContext } from "react";


export const AppContext = createContext()

const AppContextProvider = (props) => {

    const currency = import.meta.env.VITE_CURRENCY
    const backendUrl = import.meta.env.VITE_BACKEND_URL

    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

    // Supports legacy dd_mm_yyyy and ISO yyyy-mm-dd inputs.
    const slotDateFormat = (slotDate) => {
        if (!slotDate || typeof slotDate !== 'string') return 'N/A'

        if (slotDate.includes('_')) {
            const [day, month, year] = slotDate.split('_')
            if (!day || !month || !year) return slotDate
            return `${day} ${months[Number(month) - 1] || month} ${year}`
        }

        const parsed = new Date(slotDate)
        if (Number.isNaN(parsed.getTime())) return slotDate
        return `${parsed.getDate()} ${months[parsed.getMonth()]} ${parsed.getFullYear()}`
    }

    // Function to calculate the age eg. ( 20_01_2000 => 24 )
    const calculateAge = (dob) => {
        if (!dob) return 'N/A'
        const today = new Date()
        const birthDate = new Date(dob)
        if (Number.isNaN(birthDate.getTime())) return 'N/A'
        let age = today.getFullYear() - birthDate.getFullYear()
        const monthDiff = today.getMonth() - birthDate.getMonth()
        const dayDiff = today.getDate() - birthDate.getDate()
        if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) age--
        return String(age)
    }

    const value = {
        backendUrl,
        currency,
        slotDateFormat,
        calculateAge,
    }

    return (
        <AppContext.Provider value={value}>
            {props.children}
        </AppContext.Provider>
    )

}

export default AppContextProvider