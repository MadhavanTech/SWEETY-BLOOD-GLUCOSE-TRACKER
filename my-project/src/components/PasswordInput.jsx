import React, { useState } from 'react'
import '../css/PasswordInput.css'

const PasswordInput = (props) => {
  const [visible, setVisible] = useState(false)

  return (
    <span className="password_input_wrap">
      <input {...props} type={visible ? 'text' : 'password'} />
      <button
        type="button"
        className="password_toggle"
        aria-label={visible ? 'Hide password' : 'Show password'}
        aria-pressed={visible}
        onClick={() => setVisible((isVisible) => !isVisible)}
      >
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          {visible ? (
            <>
              <path d="M3 3l18 18" />
              <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
              <path d="M9.9 5.2A10.7 10.7 0 0 1 12 5c5.5 0 9 7 9 7a14.8 14.8 0 0 1-3.1 3.8" />
              <path d="M6.2 6.2C4.1 7.5 3 12 3 12s3.5 7 9 7a10.7 10.7 0 0 0 4-.8" />
            </>
          ) : (
            <>
              <path d="M3 12s3.5-7 9-7 9 7 9 7-3.5 7-9 7-9-7-9-7Z" />
              <circle cx="12" cy="12" r="2.5" />
            </>
          )}
        </svg>
      </button>
    </span>
  )
}

export default PasswordInput
