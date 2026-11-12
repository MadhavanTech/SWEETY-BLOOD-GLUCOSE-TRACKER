import React, { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import Nave from './Nave'
import '../css/main_page.css'
import '../css/Theme.css'

const MainPage = () => {
  const [darkMode, setDarkMode] = useState(() => {
    try {
      return window.localStorage.getItem('sweety-dark-mode') === 'true'
    } catch (error) {
      console.error('Unable to load display preference.', error)
      return false
    }
  })

  useEffect(() => {
    const updateTheme = () => {
      try {
        setDarkMode(window.localStorage.getItem('sweety-dark-mode') === 'true')
      } catch (error) {
        console.error('Unable to load display preference.', error)
      }
    }

    window.addEventListener('sweety-preferences-change', updateTheme)
    return () => window.removeEventListener('sweety-preferences-change', updateTheme)
  }, [])

  return (
    <div className={`tracker_app${darkMode ? ' is_dark' : ''}`}>
      <Nave />
      <main className="tracker_main">
        <Outlet />
      </main>
    </div>
  )
}

export default MainPage
