import React, { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { readingsApi } from '../api'
import { todayAsInputDate } from '../utils/readings'
import '../css/Add_Reading.css'

const timeSlots = [
  ['morning_fasting', 'Morning (Fasting)'],
  ['after_breakfast', 'After Breakfast'],
  ['after_lunch', 'After Lunch'],
  ['after_dinner', 'After Dinner'],
]

const currentTime = () => {
  const now = new Date()
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
}

const AddReading = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const editingId = searchParams.get('edit')
  const [currentReading, setCurrentReading] = useState(null)
  const [date, setDate] = useState(todayAsInputDate())
  const [time, setTime] = useState(currentTime)
  const [category, setCategory] = useState(timeSlots[0][0])
  const [value, setValue] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(Boolean(editingId))

  useEffect(() => {
    if (!editingId) return

    readingsApi.get(editingId)
      .then(({ reading }) => {
        setCurrentReading(reading)
        setDate(reading.date)
        setTime(reading.time)
        setCategory(reading.category)
        setValue(String(reading.value))
      })
      .catch((loadError) => setError(loadError.message))
      .finally(() => setLoading(false))
  }, [editingId])

  const handleSubmit = async (event) => {
    event.preventDefault()
    const glucoseValue = Number(value)
    if (!value.trim()) {
      setError('Glucose value is required.')
      return
    }
    if (!Number.isInteger(glucoseValue)) {
      setError('Glucose value must be a whole number.')
      return
    }
    if (glucoseValue < 40 || glucoseValue > 600) {
      setError('Glucose value must be between 40 and 600 mg/dL.')
      return
    }
    if (date > todayAsInputDate()) {
      setError('Reading date cannot be in the future.')
      return
    }
    if (!time) {
      setError('Time is required.')
      return
    }
    if (!category) {
      setError('Time slot is required.')
      return
    }

    setError('')
    try {
      const keepsSameSlot = currentReading?.date === date && currentReading?.category === category
      if (!keepsSameSlot) {
        const dateQuery = new URLSearchParams({ startDate: date, endDate: date }).toString()
        const { readings: dayReadings } = await readingsApi.list(dateQuery)
        const otherReadings = dayReadings.filter((reading) => reading.id !== currentReading?.id)
        if (otherReadings.some((reading) => reading.category === category)) {
          setError('A reading already exists for this time slot on this date.')
          return
        }
        if (otherReadings.length >= 4) {
          setError('No more than four readings can be saved per day.')
          return
        }
      }

      const input = { date, time, category, value: glucoseValue }
      if (currentReading) {
        await readingsApi.update(currentReading.id, input)
      } else {
        await readingsApi.create(input)
      }
      navigate('/history')
    } catch (saveError) {
      setError(saveError.message)
    }
  }

  return (
    <div className="form_page">
      <header className="page_header reading_page_header">
        <div>
          <p className="eyebrow">KEEP A SIMPLE RECORD</p>
          <h1>{editingId ? 'Edit reading' : 'Add a reading'}</h1>
          <p className="muted_text">Enter the details from your glucose meter.</p>
        </div>
        <span className="reading_header_icon" aria-hidden="true">
          <svg viewBox="0 0 48 48" fill="none">
            <path d="M24 5S12 17.4 12 27a12 12 0 1 0 24 0C36 17.4 24 5 24 5Z" />
            <path d="M18 28h4l2.5-5 3.5 10 2.5-5H36" />
          </svg>
        </span>
      </header>

      <form className="content_card reading_form" onSubmit={handleSubmit}>
        <label className="form_label reading_field">
          <span className="reading_field_label">Date</span>
          <span className="reading_input_wrap">
            <input type="date" value={date} max={todayAsInputDate()} onChange={(event) => setDate(event.target.value)} required />
            <svg className="reading_field_icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <rect x="3.5" y="5" width="17" height="16" rx="3" />
              <path d="M7.5 3.5v3M16.5 3.5v3M3.5 9.5h17M8 13h2M14 13h2M8 17h2" />
            </svg>
          </span>
        </label>

        <label className="form_label reading_field">
          <span className="reading_field_label">Time</span>
          <span className="reading_input_wrap">
            <input type="time" value={time} onChange={(event) => setTime(event.target.value)} required />
          </span>
        </label>

        <label className="form_label reading_field">
          <span className="reading_field_label">Time slot</span>
          <span className="reading_input_wrap">
            <select value={category} onChange={(event) => setCategory(event.target.value)} required>
              {timeSlots.map(([key, label]) => <option key={key} value={key}>{label}</option>)}
            </select>
            <svg className="reading_field_icon reading_time_icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="12" cy="12" r="8.5" />
              <path d="M12 7v5l3 2" />
            </svg>
          </span>
        </label>

        <label className="form_label reading_field glucose_value_field">
          <span className="reading_field_label">Glucose value</span>
          <span className="reading_input_wrap glucose_input_wrap">
            <svg className="reading_field_icon glucose_field_icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M12 3.5S6.5 9.2 6.5 13.8a5.5 5.5 0 1 0 11 0C17.5 9.2 12 3.5 12 3.5Z" />
            </svg>
            <input
              type="number"
              min="40"
              max="600"
              step="1"
              inputMode="numeric"
              placeholder="Enter your reading"
              value={value}
              onChange={(event) => setValue(event.target.value)}
              aria-describedby="glucose_value_hint"
              required
            />
            <span className="glucose_unit">mg/dL</span>
          </span>
          <span className="reading_field_hint" id="glucose_value_hint">
            Enter the number shown on your glucose meter.
          </span>
        </label>

        {error && <p className="form_error" role="alert">{error}</p>}

        <div className="form_actions">
          <button type="submit" className="button_primary" disabled={loading || Boolean(editingId && !currentReading)}>{editingId ? 'Save changes' : 'Save reading'}</button>
          <Link to="/dashboard" className="button_secondary">Cancel</Link>
        </div>
      </form>

      <aside className="reading_info_card" aria-labelledby="reading_info_title">
        <span className="reading_info_icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 11v5M12 8h.01" />
          </svg>
        </span>
        <div>
          <h2 id="reading_info_title">Recording your reading</h2>
          <p>Enter the value displayed on your glucose meter. Make sure the date and time slot are correct.</p>
        </div>
      </aside>
    </div>
  )
}

export default AddReading
