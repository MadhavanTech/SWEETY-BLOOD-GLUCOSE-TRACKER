import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import PasswordInput from '../components/PasswordInput'
import '../css/login.css'
import sweetyLogo from '../assets/Sweety_Blood_Glucose_Tracker_Logo_(1).png'

const Login = () => {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!error) return undefined
    const timeoutId = window.setTimeout(() => setError(''), 5000)
    return () => window.clearTimeout(timeoutId)
  }, [error])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      await signIn({ email, password })
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
      <div className="login">
        <img src={sweetyLogo} alt="Sweety Logo" className="login_logo" />
        <h2>Welcome Back</h2>
        <h4>Log in to continue tracking your health.</h4>

        <form className="login_form" onSubmit={handleSubmit}>
          <div className="login_field">
            <svg className="login_field_icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <rect x="3" y="5" width="18" height="14" rx="3" />
              <path d="m4 7 8 6 8-6" />
            </svg>
            <input type="email" placeholder="Email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          </div>
          <div className="login_field">
            <svg className="login_field_icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <rect x="4" y="10" width="16" height="11" rx="2" />
              <path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3" />
            </svg>
            <PasswordInput placeholder="Password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required />
          </div>
          <button type="submit" disabled={submitting}>{submitting ? 'Logging in…' : 'Log In'}</button>
        </form>

        <div className="login_divider"><hr /><span>or</span><hr /></div>
        <h4>Don&apos;t have an account? <Link to="/">Sign up</Link></h4>
      </div>
    </>
  )
}

export default Login
