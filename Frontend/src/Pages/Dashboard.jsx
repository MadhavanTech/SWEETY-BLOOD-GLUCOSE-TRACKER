import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { dashboardApi } from '../api'
import { useAuth } from '../auth/useAuth'
import GlucoseChart from '../components/GlucoseChart'
import { daysAgoAsInputDate, getReadingSuggestion } from '../utils/glucose'
import { formatReadingDate, sortReadingsNewestFirst, todayAsInputDate } from '../utils/readings'
import '../css/Dashboard.css'

const Dashboard = () => {
  const { user } = useAuth()
  const [readings, setReadings] = useState([])
  const [dashboardSummary, setDashboardSummary] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  useEffect(() => {
    dashboardApi.get()
      .then((data) => {
        setReadings(sortReadingsNewestFirst(data.readings))
        setDashboardSummary(data)
      })
      .catch((loadError) => setError(loadError.message))
      .finally(() => setLoading(false))
  }, [])
  const latestReading = readings[0]
  const recentReadings = readings.slice(0, 7).reverse()
  const recentAverage = recentReadings.length
    ? Math.round(recentReadings.reduce((total, reading) => total + Number(reading.value), 0) / recentReadings.length)
    : null
  const getSummaryAverage = (value) => {
    const averageValue = Number(value)
    return value !== null && value !== undefined && Number.isFinite(averageValue)
      ? averageValue
      : null
  }
  const average = getSummaryAverage(dashboardSummary.averageRecent) ?? recentAverage
  const currentWeekStart = daysAgoAsInputDate(6)
  const previousWeekStart = daysAgoAsInputDate(13)
  const previousWeekEnd = daysAgoAsInputDate(7)
  const currentWeekReadings = readings.filter(
    (reading) => reading.date >= currentWeekStart && reading.date <= todayAsInputDate(),
  )
  const latestWeekReading = currentWeekReadings[0]
  const latestWeekValue = latestWeekReading ? Number(latestWeekReading.value) : null
  const readingSuggestion = latestWeekValue !== null && Number.isFinite(latestWeekValue)
    ? getReadingSuggestion(latestWeekValue)
    : null
  const previousWeekReadings = readings.filter(
    (reading) => reading.date >= previousWeekStart && reading.date <= previousWeekEnd,
  )
  const calculatedCurrentWeekAverage = currentWeekReadings.length
    ? currentWeekReadings.reduce((total, reading) => total + Number(reading.value), 0) / currentWeekReadings.length
    : null
  const calculatedPreviousWeekAverage = previousWeekReadings.length
    ? previousWeekReadings.reduce((total, reading) => total + Number(reading.value), 0) / previousWeekReadings.length
    : null
  const currentWeekAverage = getSummaryAverage(dashboardSummary.currentWeek) ?? calculatedCurrentWeekAverage
  const previousWeekAverage = getSummaryAverage(dashboardSummary.previousWeek) ?? calculatedPreviousWeekAverage
  const weeklyChange = currentWeekAverage !== null && previousWeekAverage > 0
    ? ((currentWeekAverage - previousWeekAverage) / previousWeekAverage) * 100
    : null
  const weeklyTrend = weeklyChange === null
    ? 'More data needed'
    : weeklyChange > 0
      ? 'Higher than last week'
      : weeklyChange < 0
        ? 'Lower than last week'
        : 'Unchanged'
  const weeklyTrendDirection = weeklyChange === null
    ? 'unknown'
    : weeklyChange > 0
      ? 'higher'
      : weeklyChange < 0
        ? 'lower'
        : 'unchanged'

  return (
    <div className="dashboard_page">
      <header className="dashboard_header">
        <div>
          <p className="eyebrow">YOUR HEALTH, AT A GLANCE</p>
          <h1>Welcome back</h1>
          <p className="muted_text">Here’s your blood glucose overview.</p>
        </div>
        <Link
          className="profile_badge"
          to="/settings"
          aria-label={`Open settings for ${user?.name || 'your profile'}`}
        >
          {(user?.name || user?.email || 'U').trim().charAt(0).toUpperCase()}
        </Link>
      </header>
      {error && <p className="form_error" role="alert">{error}</p>}
      {loading && <p role="status">Loading your readings…</p>}

      <section className="summary_grid" aria-label="Reading summary">
        <article className="summary_card summary_pink">
          <span className="summary_icon glucose_icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M12 3.5S6.5 9.2 6.5 13.8a5.5 5.5 0 1 0 11 0C17.5 9.2 12 3.5 12 3.5Z" />
              <path d="M9.5 14h1.7l1.1-2.1 1.2 4.2 1.1-2.1h1.4" />
            </svg>
          </span>
          <div className="summary_card_content">
            <p>Current glucose</p>
            <strong>{latestReading ? `${latestReading.value} mg/dL` : 'No readings yet'}</strong>
            <small>{latestReading ? formatReadingDate(latestReading.date) : 'Add a reading to get started'}</small>
          </div>
        </article>
        <article className="summary_card summary_blue">
          <span className="summary_icon calendar_icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none">
              <rect x="3.5" y="5" width="17" height="16" rx="3" />
              <path d="M7.5 3.5v3M16.5 3.5v3M3.5 9.5h17M8 13h2M14 13h2M8 17h2" />
            </svg>
          </span>
          <div className="summary_card_content">
            <p>Last reading</p>
            <strong>{latestReading ? latestReading.slot : '—'}</strong>
            <small>{latestReading ? formatReadingDate(latestReading.date) : 'Waiting for your first entry'}</small>
          </div>
        </article>
        <article className="summary_card summary_lilac">
          <span className="summary_icon average_icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M4 19.5V5M4 19.5h16" />
              <path d="m7 15 3.2-3.5 3 2.2L19 7" />
              <path d="M15.5 7H19v3.5" />
            </svg>
          </span>
          <div className="summary_card_content">
            <p>Average (7 readings)</p>
            <strong>{average === null ? '—' : `${average} mg/dL`}</strong>
            <small>{recentReadings.length ? `${recentReadings.length} recent reading${recentReadings.length === 1 ? '' : 's'}` : 'No data to average'}</small>
          </div>
        </article>
      </section>

      <GlucoseChart readings={readings} />

      <div className="dashboard_bottom_grid">
        <section className="content_card weekly_summary">
          <div className="section_heading weekly_summary_heading">
            <div>
              <p className="eyebrow">LAST 7 DAYS</p>
              <h2>Weekly summary</h2>
            </div>
            <svg className="weekly_summary_icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M4 17 10 11l4 4 6-8" />
              <path d="M15 7h5v5" />
            </svg>
          </div>
          <div className="weekly_summary_grid">
            <div className="weekly_summary_metric">
              <span>Average change</span>
              <strong className="weekly_summary_change">
                {weeklyChange === null ? '—' : `${weeklyChange > 0 ? '+' : ''}${weeklyChange.toFixed(1)}%`}
              </strong>
              <small>Compared with the previous 7 days</small>
            </div>
            <div className="weekly_summary_metric">
              <span>Week-over-week trend</span>
              <strong className={`weekly_summary_trend ${weeklyTrendDirection}`}>
                {weeklyTrendDirection === 'higher' && <span aria-hidden="true">↑</span>}
                {weeklyTrendDirection === 'lower' && <span aria-hidden="true">↓</span>}
                {weeklyTrendDirection === 'unchanged' && <span aria-hidden="true">→</span>}
                {weeklyTrend}
              </strong>
              <small>
                {currentWeekReadings.length
                  ? `${currentWeekReadings.length} reading${currentWeekReadings.length === 1 ? '' : 's'} this week`
                  : 'No readings this week'}
              </small>
            </div>
          </div>
          <p className="weekly_summary_note">Trend comparison only; it does not determine medical stability.</p>
        </section>

        <section className="content_card health_tip">
          <div className="health_tip_content">
            <div className="health_tip_heading">
              <div>
                <p className="eyebrow">HEALTH REMINDERS</p>
                <h2>Everyday tips</h2>
              </div>
            </div>
            <div className="health_tip_current" aria-live="polite">
              {readingSuggestion ? (
                <>
                  <img src={readingSuggestion.image} alt={readingSuggestion.alt} />
                  <div className="health_tip_message">
                    <strong className={`health_tip_status ${readingSuggestion.className}`}>
                      {readingSuggestion.status}: {latestWeekValue} mg/dL
                    </strong>
                    <span>{readingSuggestion.text}</span>
                  </div>
                </>
              ) : (
                <p className="health_tip_empty">No readings in the last 7 days. Add a reading to get a suggestion.</p>
              )}
            </div>
            <p className="health_tip_note">
              Based on your latest reading in the last 7 days ({latestWeekReading ? formatReadingDate(latestWeekReading.date) : 'no recent reading'}).
              Ranges are informational and not a diagnosis.
            </p>
          </div>
        </section>
      </div>
    </div>
  )
}

export default Dashboard
