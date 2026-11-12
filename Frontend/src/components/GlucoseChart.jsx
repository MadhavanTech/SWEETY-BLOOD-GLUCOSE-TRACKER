import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { addDaysToInputDate, dateToOrdinal, daysAgoAsInputDate, formatChartDate } from '../utils/glucose'
import { formatReadingDate, todayAsInputDate } from '../utils/readings'

const GlucoseChart = ({ readings }) => {
  const [chartRange, setChartRange] = useState('7days')
  const [customStartDate, setCustomStartDate] = useState(() => daysAgoAsInputDate(6))
  const [customEndDate, setCustomEndDate] = useState(todayAsInputDate)
  const startDate = chartRange === '7days'
    ? daysAgoAsInputDate(6)
    : chartRange === '30days'
      ? daysAgoAsInputDate(29)
      : customStartDate
  const endDate = chartRange === 'custom' ? customEndDate : todayAsInputDate()
  const validDateRange = Boolean(startDate && endDate && startDate <= endDate)
  const chartReadings = validDateRange
    ? readings.filter((reading) => reading.date >= startDate && reading.date <= endDate).reverse()
    : []
  const chartWidth = 680
  const chartHeight = 220
  const chartPlotWidth = chartWidth - 56
  const chartStartDay = startDate ? dateToOrdinal(startDate) : 0
  const chartEndDay = endDate ? dateToOrdinal(endDate) : 0
  const chartDuration = chartEndDay - chartStartDay
  const chartDateTicks = [0, 0.5, 1].map((position) => ({
    x: 36 + position * chartPlotWidth,
    date: addDaysToInputDate(startDate, Math.round(chartDuration * position)),
  }))
  const chartPoints = chartReadings.map((reading) => {
    const readingDay = dateToOrdinal(reading.date)
    const x = chartDuration <= 0
      ? chartWidth / 2
      : 36 + ((readingDay - chartStartDay) / chartDuration) * chartPlotWidth
    const value = Number(reading.value)
    const y = chartHeight - 24 - (Math.min(Math.max(value, 0), 400) / 400) * (chartHeight - 48)
    return { x, y, reading }
  })
  const chartLinePath = chartPoints.reduce((path, point, index) => {
    if (index === 0) return `M ${point.x} ${point.y}`
    const previousPoint = chartPoints[index - 1]
    const controlOffset = (point.x - previousPoint.x) / 3
    return `${path} C ${previousPoint.x + controlOffset} ${previousPoint.y}, ${point.x - controlOffset} ${point.y}, ${point.x} ${point.y}`
  }, '')

  return (
    <section className="content_card trend_card">
      <div className="section_heading">
        <div>
          <p className="eyebrow">YOUR TRACKING</p>
          <h2>Glucose trend</h2>
        </div>
        <Link className="text_link" to="/reports">View reports</Link>
      </div>
      <div className="chart_controls">
        <div className="period_tabs" role="group" aria-label="Chart date range">
          <button
            type="button"
            className={chartRange === '7days' ? 'selected' : ''}
            aria-pressed={chartRange === '7days'}
            onClick={() => setChartRange('7days')}
          >
            7 days
          </button>
          <button
            type="button"
            className={chartRange === '30days' ? 'selected' : ''}
            aria-pressed={chartRange === '30days'}
            onClick={() => setChartRange('30days')}
          >
            30 days
          </button>
          <button
            type="button"
            className={chartRange === 'custom' ? 'selected' : ''}
            aria-pressed={chartRange === 'custom'}
            onClick={() => setChartRange('custom')}
          >
            Custom
          </button>
        </div>
        {chartRange === 'custom' && (
          <div className="chart_date_range">
            <label className="form_label">
              From
              <input
                type="date"
                value={customStartDate}
                max={customEndDate || undefined}
                onChange={(event) => {
                  const value = event.target.value
                  setCustomStartDate(value)
                  if (value && customEndDate && value > customEndDate) setCustomEndDate(value)
                }}
              />
            </label>
            <label className="form_label">
              To
              <input
                type="date"
                value={customEndDate}
                min={customStartDate || undefined}
                onChange={(event) => {
                  const value = event.target.value
                  setCustomEndDate(value)
                  if (value && customStartDate && value < customStartDate) setCustomStartDate(value)
                }}
              />
            </label>
          </div>
        )}
      </div>
      {chartPoints.length ? (
        <div className="chart_container">
          <svg
            className="glucose_chart"
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            preserveAspectRatio="none"
            role="img"
            aria-label="Recent glucose readings in milligrams per deciliter"
          >
            <title>Glucose readings for the selected date range. Hover over a plotted point to inspect it.</title>
            {[0, 100, 200, 300, 400].map((value) => {
              const y = chartHeight - 24 - (value / 400) * (chartHeight - 48)
              return (
                <g key={value}>
                  <line x1="36" x2={chartWidth - 20} y1={y} y2={y} className="chart_gridline" />
                  <text x="0" y={y + 4} className="chart_label">{value}</text>
                </g>
              )
            })}
            {chartDateTicks.map(({ x, date }, index) => (
              <g key={index}>
                <line
                  x1={x}
                  x2={x}
                  y1="24"
                  y2={chartHeight - 24}
                  className="chart_vertical_gridline"
                />
                <text
                  x={x}
                  y={chartHeight - 4}
                  textAnchor={index === 0 ? 'start' : index === 2 ? 'end' : 'middle'}
                  className="chart_label"
                >
                  {formatChartDate(date)}
                </text>
              </g>
            ))}
            {chartPoints.length > 1 && <path d={chartLinePath} className="chart_line" />}
            {chartPoints.map(({ x, y, reading }, index) => (
              <g key={reading.id}>
                <circle
                  cx={x}
                  cy={y}
                  r="5"
                  className="chart_dot"
                  aria-label={`${formatReadingDate(reading.date)}: ${reading.value} mg/dL`}
                >
                  <title>{formatReadingDate(reading.date)} · {reading.value} mg/dL</title>
                </circle>
                {(chartPoints.length <= 14 || index === chartPoints.length - 1) && (
                  <text x={x} y={y - 12} textAnchor="middle" className="chart_value">{reading.value}</text>
                )}
              </g>
            ))}
          </svg>
        </div>
      ) : (
        <div className="empty_chart">
          <p>
            {validDateRange
              ? 'No readings are available for this date range.'
              : 'Choose a valid start and end date to view the chart.'}
          </p>
          {!readings.length && (
            <Link className="button_primary" to="/add-reading">Add a reading</Link>
          )}
        </div>
      )}
    </section>
  )
}

export default GlucoseChart
