import React from 'react'
import '../css/intro.css'
import glucoseMeter from '../assets/Modern_Blood_Glucose _Meter_Icon.png'
import sweetyLogo from '../assets/Sweety_Blood_Glucose_Tracker_Logo_(1).png'

const intro = () => {
  return (
    <div className="intro-page">
      <div className="intro-content">

        <div className="intro-illustration">
          <img
            src={glucoseMeter}
            alt="Glucose Meter"
            className="glucose-meter"
          />
        </div>

        <div className="intro-details">
          <img
            src={sweetyLogo}
            alt="Sweety Logo"
            className="sweety-logo"
          />

          {/* <h1>Sweety</h1> */}

          <h2>Blood Glucose Tracker</h2>

          <p className="intro-tagline">
            Track • Monitor • Stay Healthy
          </p>

          <p className="intro-description">
            Take control of your health,
            one reading at a time.
          </p>

          <button className="get-started">
            Get Started <span>→</span>
          </button>
        </div>

      </div>
    </div>
  )
}

export default intro