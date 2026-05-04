import { useEffect, useContext } from 'react'
import { assets } from '../../assets/assets'
import { AdminContext } from '../../context/AdminContext'
import { AppContext } from '../../context/AppContext'

const AllAppointments = () => {

  const { aToken, appointments, cancelAppointment, getAllAppointments } = useContext(AdminContext)
  const { slotDateFormat, calculateAge, currency } = useContext(AppContext)

  useEffect(() => {
    if (aToken) {
      getAllAppointments()
    }
  }, [aToken])

  return (
    <div className='w-full max-w-6xl m-5 '>

      <p className='mb-3 text-lg font-medium'>All Appointments</p>

      <div className='bg-white border rounded text-sm max-h-[80vh] overflow-y-scroll'>
        <div className='hidden sm:grid grid-cols-[0.5fr_3fr_1fr_3fr_3fr_1fr_1fr] grid-flow-col py-3 px-6 border-b'>
          <p>#</p>
          <p>Patient</p>
          <p>Age</p>
          <p>Date & Time</p>
          <p>Doctor</p>
          <p>Fees</p>
          <p>Action</p>
        </div>
        {appointments.map((item, index) => {
          const isCancelled = item.cancelled || item.status === 'cancelled'
          const isCompleted = item.isCompleted || item.status === 'completed'
          const rowKey = item._id || `${item.slot_date}-${item.start_time}-${index}`
          let actionNode = (
            <button onClick={() => cancelAppointment(item._id)} type='button' className='cursor-pointer'>
              <img className='w-10' src={assets.cancel_icon} alt="Cancel appointment" />
            </button>
          )
          if (isCancelled) {
            actionNode = <p className='text-red-400 text-xs font-medium'>Cancelled</p>
          } else if (isCompleted) {
            actionNode = <p className='text-green-500 text-xs font-medium'>Completed</p>
          }
          return (
          <div className='flex flex-wrap justify-between max-sm:gap-2 sm:grid sm:grid-cols-[0.5fr_3fr_1fr_3fr_3fr_1fr_1fr] items-center text-gray-500 py-3 px-6 border-b hover:bg-gray-50' key={rowKey}>
            <p className='max-sm:hidden'>{index+1}</p>
            <div className='flex items-center gap-2'>
              <img src={item.patientData?.image} className='w-8 rounded-full' alt="" /> <p>{item.patientData?.name || 'N/A'}</p>
            </div>
            <p className='max-sm:hidden'>{item.patientData?.age ?? calculateAge(item.patientData?.dob) ?? 'N/A'}</p>
            <p>{slotDateFormat(item.slot_date)}, {item.start_time}</p>
            <div className='flex items-center gap-2'>
              <img src={item.docData?.image} className='w-8 rounded-full bg-gray-200' alt="" /> <p>{item.docData?.name || 'N/A'}</p>
            </div>
            <p>{currency}{item.consultation_fee}</p>
            {actionNode}
          </div>
        )})}
      </div>

    </div>
  )
}

export default AllAppointments