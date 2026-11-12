import React, { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import dropIcon from '../assets/Glossy_Red_Blood_Drop_Icon (1).png'
import '../css/Nave.css'

// Each menu item has a route, label, and matching line icon.
const menuItems = [
  {
    to: '/dashboard',
    name: 'Dashboard',
    icon: <><path d="m3 10 9-7 9 7" /><path d="M5 9v12h14V9M9 21v-7h6v7" /></>,
  },
  {
    to: '/add-reading',
    name: 'Add Reading',
    icon: <svg viewBox="0 0 24 24" fill="none">
              <path d="M12 3.5S6.5 9.2 6.5 13.8a5.5 5.5 0 1 0 11 0C17.5 9.2 12 3.5 12 3.5Z" />
              <path d="M9.5 14h1.7l1.1-2.1 1.2 4.2 1.1-2.1h1.4" />
            </svg>,
  },
  {
    to: '/reports',
    name: 'Reports',
    icon: <><path d="M4 20V4M4 20h17" /><path d="M8 16v-5m5 5V7m5 9v-8" /></>,
  },
  {
    to: '/history',
    name: 'History',
    icon: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  },
  {
    to: '/settings',
    name: 'Settings',
    icon: <><path d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z" /><path d="m19.4 15 .1.1 1.4 1.1-1.4 2.4-1.7-.7a8 8 0 0 1-1.7 1l-.3 1.8h-2.8l-.3-1.8a8 8 0 0 1-1.7-1l-1.7.7-1.4-2.4L7.3 15a8 8 0 0 1 0-2l-1.4-1.1 1.4-2.4 1.7.7a8 8 0 0 1 1.7-1l.3-1.8h2.8l.3 1.8a8 8 0 0 1 1.7 1l1.7-.7 1.4 2.4-1.4 1.1a8 8 0 0 1-.1 2Z" /></>,
  },
]

const Nave = () => {
  const [showLogout, setShowLogout] = useState(false)
  const navigate = useNavigate()
  const { signOut } = useAuth()

  const handleLogout = () => {
    signOut()
    setShowLogout(false)
    navigate('/login')
  }

  return (
    <>
      <aside className="sidebar">
        <NavLink to="/dashboard" className="sidebar_brand">
          <img src={dropIcon} alt="" />
          <span>Sweety</span>
        </NavLink>

        <nav className="sidebar_menu">
          {menuItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => (isActive ? 'menu_link active' : 'menu_link')}
            >
              <svg
                className="menu_icon"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                {item.icon}
              </svg>
              <b>{item.name}</b>
            </NavLink>
          ))}
        </nav>

        <button
          type="button"
          className="menu_link logout_button"
          onClick={() => setShowLogout(true)}
          aria-haspopup="dialog"
        >
          <svg className="menu_icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M10 17l5-5-5-5m5 5H3" />
            <path d="M12 3h7a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-7" />
          </svg>
          <b>Logout</b>
        </button>
      </aside>

      {showLogout && (
        <div className="popup_background">
          <section
            className="popup_box"
            role="dialog"
            aria-modal="true"
            aria-labelledby="logout_dialog_title"
            aria-describedby="logout_dialog_description"
          >
            <span className="popup_icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M10 17l5-5-5-5m5 5H3" />
                <path d="M12 3h7a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-7" />
              </svg>
            </span>
            <h2 id="logout_dialog_title">Are you sure you want to logout?</h2>
            <p id="logout_dialog_description">You will need to login again to access your data.</p>

            <div className="popup_buttons">
              <button type="button" className="btn btn_outline" onClick={() => setShowLogout(false)}>
                Cancel
              </button>
              <button type="button" className="btn" onClick={handleLogout}>
                Logout
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  )
}

export default Nave