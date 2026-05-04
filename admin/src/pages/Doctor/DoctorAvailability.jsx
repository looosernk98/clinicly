import React, { useContext, useState } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import { DoctorContext } from '../../context/DoctorContext'

const dayOptions = [
  { label: 'Sunday', value: 0 },
  { label: 'Monday', value: 1 },
  { label: 'Tuesday', value: 2 },
  { label: 'Wednesday', value: 3 },
  { label: 'Thursday', value: 4 },
  { label: 'Friday', value: 5 },
  { label: 'Saturday', value: 6 },
]

const DoctorAvailability = () => {
  const { backendUrl, dToken } = useContext(DoctorContext)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    day_of_week: 1,
    start_time: '09:00',
    end_time: '17:00',
    slot_duration: 30,
    buffer_duration: 0,
    timezone: 'UTC',
    is_active: true,
    effective_from: '',
    effective_to: '',
  })

  const onChange = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }))
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    if (!dToken) return
    if (!formData.start_time || !formData.end_time) {
      toast.error('Start time and end time are required')
      return
    }

    setSaving(true)
    try {
      const payload = {
        day_of_week: Number(formData.day_of_week),
        start_time: formData.start_time,
        end_time: formData.end_time,
        slot_duration: Number(formData.slot_duration),
        buffer_duration: Number(formData.buffer_duration),
        timezone: formData.timezone.trim() || 'UTC',
        is_active: Boolean(formData.is_active),
        effective_from: formData.effective_from || null,
        effective_to: formData.effective_to || null,
      }

      const { data } = await axios.post(
        `${backendUrl}/api/scheduling/availability-rules`,
        payload,
        { headers: { dToken } },
      )
      if (data.success) {
        toast.success('Availability rule created')
      } else {
        toast.error(data.message || 'Failed to create availability rule')
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || error.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className='w-full max-w-3xl m-5'>
      <p className='mb-4 text-lg font-medium'>Doctor Availability</p>
      <form onSubmit={onSubmit} className='bg-white border rounded p-5 grid grid-cols-1 md:grid-cols-2 gap-4'>
        <div className='flex flex-col gap-1'>
          <label className='text-sm text-gray-700'>Day of week</label>
          <select
            className='border rounded px-3 py-2'
            value={formData.day_of_week}
            onChange={(e) => onChange('day_of_week', e.target.value)}
          >
            {dayOptions.map((d) => (
              <option key={d.value} value={d.value}>{d.label}</option>
            ))}
          </select>
        </div>

        <div className='flex flex-col gap-1'>
          <label className='text-sm text-gray-700'>Timezone</label>
          <input
            className='border rounded px-3 py-2'
            value={formData.timezone}
            onChange={(e) => onChange('timezone', e.target.value)}
            placeholder='UTC'
          />
        </div>

        <div className='flex flex-col gap-1'>
          <label className='text-sm text-gray-700'>Start time</label>
          <input
            className='border rounded px-3 py-2'
            type='time'
            value={formData.start_time}
            onChange={(e) => onChange('start_time', e.target.value)}
            required
          />
        </div>

        <div className='flex flex-col gap-1'>
          <label className='text-sm text-gray-700'>End time</label>
          <input
            className='border rounded px-3 py-2'
            type='time'
            value={formData.end_time}
            onChange={(e) => onChange('end_time', e.target.value)}
            required
          />
        </div>

        <div className='flex flex-col gap-1'>
          <label className='text-sm text-gray-700'>Slot duration (minutes)</label>
          <input
            className='border rounded px-3 py-2'
            type='number'
            min='5'
            max='240'
            value={formData.slot_duration}
            onChange={(e) => onChange('slot_duration', e.target.value)}
          />
        </div>

        <div className='flex flex-col gap-1'>
          <label className='text-sm text-gray-700'>Buffer duration (minutes)</label>
          <input
            className='border rounded px-3 py-2'
            type='number'
            min='0'
            max='120'
            value={formData.buffer_duration}
            onChange={(e) => onChange('buffer_duration', e.target.value)}
          />
        </div>

        <div className='flex flex-col gap-1'>
          <label className='text-sm text-gray-700'>Effective from</label>
          <input
            className='border rounded px-3 py-2'
            type='date'
            value={formData.effective_from}
            onChange={(e) => onChange('effective_from', e.target.value)}
          />
        </div>

        <div className='flex flex-col gap-1'>
          <label className='text-sm text-gray-700'>Effective to</label>
          <input
            className='border rounded px-3 py-2'
            type='date'
            value={formData.effective_to}
            onChange={(e) => onChange('effective_to', e.target.value)}
          />
        </div>

        <label className='flex items-center gap-2 mt-2 md:col-span-2'>
          <input
            type='checkbox'
            checked={formData.is_active}
            onChange={(e) => onChange('is_active', e.target.checked)}
          />
          <span className='text-sm text-gray-700'>Rule is active</span>
        </label>

        <div className='md:col-span-2'>
          <button
            type='submit'
            disabled={saving}
            className='px-5 py-2 rounded bg-primary text-white disabled:opacity-60'
          >
            {saving ? 'Saving...' : 'Save Availability Rule'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default DoctorAvailability

