import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import PasswordInput from '../components/PasswordInput'
import '../css/Sing_in.css'
import sweetyLogo from '../assets/Sweety_Blood_Glucose_Tracker_Logo_(1).png'

const SignIn = () => {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!error) return undefined
    const timeoutId = window.setTimeout(() => setError(''), 5000)
    return () => window.clearTimeout(timeoutId)
  }, [error])

  const handleChange = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setSubmitting(true)
    setError('')
    try {
      await register({ name: form.name, email: form.email, password: form.password })
      navigate('/dashboard')
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      {error && <p className="auth_error" role="alert" aria-live="polite">{error}</p>}
      <div className="sing_in">
        <img src={sweetyLogo} alt="Sweety Logo" className="logo" />
        <h2>Create your Account</h2>
        <h4>Start tracking your health today!</h4>

        <form className="sing_form" onSubmit={handleSubmit}>
          <div className="sing_field">
            <svg className="sing_field_icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="12" cy="8" r="4" />
              <path d="M4 21a8 8 0 0 1 16 0" />
            </svg>
            <input name="name" type="text" placeholder="Full name" autoComplete="name" value={form.name} onChange={handleChange} required maxLength={100} />
          </div>
          <div className="sing_field">
            <svg className="sing_field_icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <rect x="3" y="5" width="18" height="14" rx="3" />
              <path d="m4 7 8 6 8-6" />
            </svg>
            <input name="email" type="email" placeholder="Email" autoComplete="email" value={form.email} onChange={handleChange} required />
          </div>
          <div className="sing_field">
            <svg className="sing_field_icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <rect x="4" y="10" width="16" height="11" rx="2" />
              <path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3" />
            </svg>
            <PasswordInput name="password" placeholder="Password" autoComplete="new-password" value={form.password} onChange={handleChange} required minLength={8} />
          </div>
          <div className="sing_field">
            <svg className="sing_field_icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <rect x="4" y="10" width="16" height="11" rx="2" />
              <path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3" />
            </svg>
            <PasswordInput name="confirmPassword" placeholder="Confirm Password" autoComplete="new-password" value={form.confirmPassword} onChange={handleChange} required minLength={8} />
          </div>
          <button type="submit" disabled={submitting}>{submitting ? 'Creating account…' : 'Sign Up'}</button>
        </form>

        <div className="sing_divider"><hr /><span>or</span><hr /></div>
        <h4>Already have an account? <Link to="/login">Log in</Link></h4>
      </div>
    </>
  )
}

export default SignIn
