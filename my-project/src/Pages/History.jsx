import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { readingsApi } from '../api'
import { formatReadingDate, sortReadingsNewestFirst } from '../utils/readings'
import '../css/History.css'

const History = () => {
  const [readings, setReadings] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    readingsApi.list()
      .then(({ readings: savedReadings }) => setReadings(sortReadingsNewestFirst(savedReadings)))
      .catch((loadError) => setError(loadError.message))
      .finally(() => setLoading(false))
  }, [])

  const deleteReading = async (id) => {
    try {
      await readingsApi.remove(id)
      setReadings((items) => items.filter((reading) => reading.id !== id))
      setError('')
    } catch (saveError) {
      setError(saveError.message)
    }
  }

  return (
    <div className="list_page history_page">
      <header className="page_header page_header_row history_header">
        <div>
          <p className="eyebrow">YOUR SAVED DATA</p>
          <h1>Reading history</h1>
          <p className="muted_text">Review and update your previous readings.</p>
        </div>
        <Link className="button_primary" to="/add-reading">Add reading</Link>
      </header>

      <section className="content_card table_card history_table_card">
        {error && <p className="form_error" role="alert">{error}</p>}
        {loading ? <p role="status">Loading readings…</p> : readings.length ? (
          <div className="table_scroll">
            <table className="readings_table">
              <thead>
                <tr>
                  <th scope="col">Date</th>
                  <th scope="col">Time slot</th>
                  <th scope="col">Glucose level</th>
                  <th scope="col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {readings.map((reading) => (
                  <tr key={reading.id}>
                    <td>{formatReadingDate(reading.date)}</td>
                    <td>{reading.slot}</td>
                    <td><strong>{reading.value} mg/dL</strong></td>
                    <td>
                      <div className="table_actions">
                        <Link className="table_action edit_action" to={`/add-reading?edit=${encodeURIComponent(reading.id)}`}>
                          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                            <path d="m15 5 4 4M4 20l4-.8L19 8a2.1 2.1 0 0 0-3-3L5 16l-1 4Z" />
                          </svg>
                          Edit
                        </Link>
                        <button type="button" className="table_action delete_action" onClick={() => deleteReading(reading.id)}>
                          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                            <path d="M4 7h16M10 11v6m4-6v6M5 7l1 14h12l1-14M9 7V4h6v3" />
                          </svg>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty_state">
            <span className="history_empty_icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M5 4h14v16H5z" />
                <path d="M8 8h8M8 12h8M8 16h4" />
                <path d="M8 2v4m8-4v4" />
              </svg>
            </span>
            <h2>No readings saved</h2>
            <p>Your readings will show up here once you add them.</p>
            <Link className="button_primary" to="/add-reading">Add your first reading</Link>
          </div>
        )}
      </section>
    </div>
  )
}

export default History
