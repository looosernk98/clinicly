import { useContext, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AppContext } from '../../context/AppContext'
import { assets } from '../../assets/assets'
import RelatedDoctors from '../../components/RelatedDoctors'
import axios from 'axios'
import { toast } from 'react-toastify'
import { AppContextType, Doctor } from '../../types'

interface ApiSlot {
  startTime: string
  endTime: string
}

interface DaySlots {
  date: string
  slots: ApiSlot[]
}

const Appointment: React.FC = () => {
  const { docId } = useParams<{ docId: string }>()
  const { doctors, currencySymbol, backendUrl, token, getDoctosData } = useContext(AppContext) as AppContextType
  const daysOfWeek = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']

  const [docInfo, setDocInfo] = useState<Doctor | null>(null)
  const [docSlots, setDocSlots] = useState<DaySlots[]>([])
  const [slotsByDate, setSlotsByDate] = useState<Record<string, ApiSlot[]>>({})
  const [slotIndex, setSlotIndex] = useState<number>(0)
  const [slotTime, setSlotTime] = useState<string>('')
  const [slotEndTime, setSlotEndTime] = useState<string>('')

  const navigate = useNavigate()

  const fetchDocInfo = async (): Promise<void> => {
    const docInfo = doctors.find((doc) => doc._id === docId)
    if (docInfo) {
      setDocInfo(docInfo)
    }
  }

  const getAvailableSolts = async (): Promise<void> => {
    if (!docId) return

    const today = new Date()
    const next7: DaySlots[] = []

    const toLocalDateText = (d: Date): string => {
      const year = d.getFullYear()
      const month = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }

    for (let i = 0; i < 7; i++) {
      const d = new Date(today)
      d.setDate(today.getDate() + i)
      const dateText = toLocalDateText(d)
      next7.push({ date: dateText, slots: [] })
    }

    setDocSlots(next7)
    setSlotsByDate({})
    setSlotIndex(0)
    setSlotTime('')
    setSlotEndTime('')
  }

  const fetchSlotsForDate = async (dateText: string): Promise<void> => {
    if (!docId) return
    if (slotsByDate[dateText]) return

    try {
      const { data } = await axios.get(
        `${backendUrl}/api/scheduling/doctors/${docId}/slots`,
        { params: { date: dateText } },
      )
      const slots = data?.success ? (data?.data?.slots || []) : []
      setSlotsByDate((prev) => ({ ...prev, [dateText]: slots }))
    } catch (_error) {
      setSlotsByDate((prev) => ({ ...prev, [dateText]: [] }))
    }
  }

  const bookAppointment = async (): Promise<void> => {
    if (!token) {
      toast.warning('Login to book appointment')
      navigate('/login')
      return
    }

    if (!docSlots[slotIndex] || !slotTime || !slotEndTime) {
      toast.error('Please select a time slot')
      return
    }

    const date = docSlots[slotIndex].date

    try {
      const { data } = await axios.post(
        `${backendUrl}/api/scheduling/appointments`,
        {
          doctorId: docId,
          date,
          startTime: slotTime,
          endTime: slotEndTime,
          mode: 'clinic',
          consultationFee: docInfo?.fees ?? 0,
        },
        { headers: { token } },
      )
      if (data.success) {
        toast.success(data.message || 'Appointment booked')
        getDoctosData()
        navigate('/my-appointments')
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
    if (doctors.length > 0) {
      fetchDocInfo()
    }
  }, [doctors, docId])

  useEffect(() => {
    if (docInfo) {
      getAvailableSolts()
    }
  }, [docInfo])

  useEffect(() => {
    const dateText = docSlots[slotIndex]?.date
    if (!dateText) return
    fetchSlotsForDate(dateText)
    setSlotTime('')
    setSlotEndTime('')
  }, [slotIndex, docSlots])

  return docInfo ? (
    <div>

      {/* ---------- Doctor Details ----------- */}
      <div className='flex flex-col sm:flex-row gap-4'>
        <div>
          <img className='bg-primary w-full sm:max-w-72 rounded-lg' src={docInfo.image} alt="" />
        </div>

        <div className='flex-1 border border-[#ADADAD] rounded-lg p-8 py-7 bg-white mx-2 sm:mx-0 mt-[-80px] sm:mt-0'>

          {/* ----- Doc Info : name, degree, experience ----- */}

          <p className='flex items-center gap-2 text-3xl font-medium text-gray-700'>{docInfo.name} <img className='w-5' src={assets.verified_icon} alt="" /></p>
          <div className='flex items-center gap-2 mt-1 text-gray-600'>
            <p>{docInfo.degree} - {docInfo.speciality}</p>
            <button className='py-0.5 px-2 border text-xs rounded-full'>{docInfo.experience}</button>
          </div>

          {/* ----- Doc About ----- */}
          <div>
            <p className='flex items-center gap-1 text-sm font-medium text-[#262626] mt-3'>About <img className='w-3' src={assets.info_icon} alt="" /></p>
            <p className='text-sm text-gray-600 max-w-[700px] mt-1'>{docInfo.about}</p>
          </div>

          <p className='text-gray-600 font-medium mt-4'>Appointment fee: <span className='text-gray-800'>{currencySymbol}{docInfo.fees}</span> </p>
        </div>
      </div>

      {/* Booking slots */}
      <div className='sm:ml-72 sm:pl-4 mt-8 font-medium text-[#565656]'>
        <p >Booking slots</p>
        <div className='flex gap-3 items-center w-full overflow-x-scroll mt-4'>
          {docSlots.length > 0 && docSlots.map((item, index) => {
            const dt = new Date(`${item.date}T00:00:00`)
            return (
            <div onClick={() => setSlotIndex(index)} key={index} className={`text-center py-6 min-w-16 rounded-full cursor-pointer ${slotIndex === index ? 'bg-primary text-white' : 'border border-[#DDDDDD]'}`}>
              <p>{daysOfWeek[dt.getDay()]}</p>
              <p>{dt.getDate()}</p>
            </div>
          )})}
        </div>

        <div className='flex items-center gap-3 w-full overflow-x-scroll mt-4'>
          {docSlots.length > 0 && (slotsByDate[docSlots[slotIndex]?.date] || []).map((item, index) => (
            <p
              onClick={() => {
                setSlotTime(item.startTime)
                setSlotEndTime(item.endTime)
              }}
              key={index}
              className={`text-sm font-light  flex-shrink-0 px-5 py-2 rounded-full cursor-pointer ${item.startTime === slotTime ? 'bg-primary text-white' : 'text-[#949494] border border-[#B4B4B4]'}`}
            >
              {`${item.startTime} - ${item.endTime}`}
            </p>
          ))}
        </div>
        {docSlots.length > 0 && (slotsByDate[docSlots[slotIndex]?.date] || []).length === 0 && (
          <p className='mt-3 text-sm text-gray-500'>No slots available for selected day.</p>
        )}

        <button onClick={bookAppointment} className='bg-primary text-white text-sm font-light px-20 py-3 rounded-full my-6'>Book an appointment</button>
      </div>

      {/* Listing Releated Doctors */}
      <RelatedDoctors speciality={docInfo.speciality} docId={docId || ''} />
    </div>
  ) : null
}

export default Appointment
