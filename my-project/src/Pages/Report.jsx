import React, { useMemo, useState } from 'react'
import { Download, FileText } from 'lucide-react'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { reportsApi } from '../api'
import { formatReadingDate, todayAsInputDate } from '../utils/readings'
import { downloadReportPdf } from '../utils/reportPdf'
import '../css/Report.css'

const reportOptions = [
  { value: 'daily', label: 'Daily Report' },
  { value: 'month-to-date', label: 'Month to Date' },
  { value: 'previous-month', label: 'Previous Month' },
]

const reportTitles = {
  daily: 'Daily Report',
  'month-to-date': 'Month-to-Date Report',
  'previous-month': 'Previous Month Report',
}

const measurementLabels = {
  morning_fasting: 'Morning (Fasting)',
  after_breakfast: 'After Breakfast',
  after_lunch: 'After Lunch',
  after_dinner: 'After Dinner',
}

const formatGlucose = (value) =>
  value === null || value === undefined ? '—' : Number(value).toFixed(1)

const formatShortDate = (date) =>
  new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short' })
    .format(new Date(`${date}T00:00:00`))

const Report = () => {
  const [reportType, setReportType] = useState('daily')
  const [selectedDate, setSelectedDate] = useState(todayAsInputDate)
  const [report, setReport] = useState(null)
  const [generatedAt, setGeneratedAt] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const readings = report?.readings || []
  const summary = report?.summary
  const isMonthlyReport = report?.reportType !== 'daily'
  const dailyTrend = useMemo(() => {
    const readingsByDate = new Map()

    readings.forEach((reading) => {
      const current = readingsByDate.get(reading.reading_date) || {
        date: reading.reading_date,
        total: 0,
        count: 0,
      }
      current.total += Number(reading.glucose_value)
      current.count += 1
      readingsByDate.set(reading.reading_date, current)
    })

    return [...readingsByDate.values()]
      .map(({ date, total, count }) => ({ date, average: total / count }))
      .sort((left, right) => left.date.localeCompare(right.date))
  }, [readings])

  const generateReport = async () => {
    setLoading(true)
    setError('')
    setReport(null)
    setGeneratedAt(null)

    try {
      let result
      if (reportType === 'daily') {
        result = await reportsApi.daily(selectedDate)
      } else if (reportType === 'month-to-date') {
        result = await reportsApi.monthToDate()
      } else {
        result = await reportsApi.previousMonth()
      }
      setReport(result)
      setGeneratedAt(new Date())
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }

  const downloadPdf = () => {
    try {
      downloadReportPdf(report, generatedAt)
      setError('')
    } catch (downloadError) {
      setError(`The PDF could not be generated. ${downloadError.message}`)
    }
  }

  const selectReportType = (nextType) => {
    setReportType(nextType)
    setReport(null)
    setGeneratedAt(null)
    setError('')
  }

  const reportPeriod = report?.period
  const generationDate = generatedAt
    ? new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' })
      .format(generatedAt)
    : ''

  return (
    <div className="list_page report_page">
      <header className="page_header report_header">
        <p className="eyebrow">YOUR PROGRESS</p>
        <h1>Reports</h1>
        <p className="muted_text">Generate a clear summary of your recorded glucose readings.</p>
      </header>

      <section className="content_card report_controls" aria-label="Report options">
        <div className="period_tabs" role="group" aria-label="Report type">
          {reportOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              className={reportType === option.value ? 'selected' : ''}
              aria-pressed={reportType === option.value}
              onClick={() => selectReportType(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
        {reportType === 'daily' && (
          <label className="form_label report_date">
            Select date
            <input
              type="date"
              value={selectedDate}
              onChange={(event) => {
                setSelectedDate(event.target.value)
                setReport(null)
                setGeneratedAt(null)
                setError('')
              }}
            />
          </label>
        )}
        <button
          type="button"
          className="button_primary report_generate_button"
          onClick={generateReport}
          disabled={loading || (reportType === 'daily' && !selectedDate)}
        >
          <FileText size={17} aria-hidden="true" />
          {loading ? 'Generating…' : 'Generate Report'}
        </button>
      </section>

      {error && <p className="form_error report_error" role="alert">{error}</p>}
      {loading && <p className="report_loading" role="status">Loading report data…</p>}

      {report && (
        <section className="content_card report_preview" aria-labelledby="report_preview_title">
          <header className="report_preview_header">
            <div>
              <p className="eyebrow">REPORT PREVIEW</p>
              <h2 id="report_preview_title">{reportTitles[report.reportType]}</h2>
              <p className="report_period">
                {reportPeriod.startDate === reportPeriod.endDate
                  ? formatReadingDate(reportPeriod.startDate)
                  : `${formatReadingDate(reportPeriod.startDate)} – ${formatReadingDate(reportPeriod.endDate)}`}
              </p>
              <p className="report_generated_at">Generated {generationDate}</p>
            </div>
            <button type="button" className="button_primary report_download_button" onClick={downloadPdf}>
              <Download size={17} aria-hidden="true" />
              Download PDF
            </button>
          </header>

          {readings.length ? (
            <>
              <section className="report_summary" aria-label="Report statistics">
                <article className="content_card report_stat">
                  <div className="report_stat_content">
                    <span>Highest glucose</span>
                    <strong>{formatGlucose(summary.highest)} mg/dL</strong>
                  </div>
                </article>
                <article className="content_card report_stat">
                  <div className="report_stat_content">
                    <span>Lowest glucose</span>
                    <strong>{formatGlucose(summary.lowest)} mg/dL</strong>
                  </div>
                </article>
                <article className="content_card report_stat">
                  <div className="report_stat_content">
                    <span>Average glucose</span>
                    <strong>{formatGlucose(summary.average)} mg/dL</strong>
                  </div>
                </article>
                <article className="content_card report_stat">
                  <div className="report_stat_content">
                    <span>Total readings</span>
                    <strong>{summary.totalReadings}</strong>
                  </div>
                </article>
              </section>

              {isMonthlyReport && dailyTrend.length > 0 && (
                <section className="content_card report_trend" aria-labelledby="report_trend_title">
                  <div className="report_subheading">
                    <p className="eyebrow">DAILY AVERAGES</p>
                    <h3 id="report_trend_title">Glucose trend</h3>
                  </div>
                  <div className="report_trend_chart">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={dailyTrend} margin={{ top: 8, right: 12, bottom: 4, left: 0 }}>
                        <CartesianGrid stroke="#e9e3f4" strokeDasharray="4 4" vertical={false} />
                        <XAxis
                          dataKey="date"
                          tickFormatter={formatShortDate}
                          minTickGap={24}
                          tick={{ fill: '#77738f', fontSize: 12 }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          width={48}
                          tick={{ fill: '#77738f', fontSize: 12 }}
                          axisLine={false}
                          tickLine={false}
                          domain={['auto', 'auto']}
                        />
                        <Tooltip
                          labelFormatter={(date) => formatReadingDate(date)}
                          formatter={(value) => [`${Number(value).toFixed(1)} mg/dL`, 'Daily average']}
                        />
                        <Line
                          type="monotone"
                          dataKey="average"
                          name="Daily average"
                          stroke="#7047c7"
                          strokeWidth={2.5}
                          dot={{ r: 3, fill: '#7047c7', strokeWidth: 0 }}
                          activeDot={{ r: 5 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </section>
              )}

              <section className="content_card table_card report_history" aria-labelledby="report_history_title">
                <div className="section_heading report_table_heading">
                  <div>
                    <p className="eyebrow">DETAIL</p>
                    <h3 id="report_history_title">Glucose reading history</h3>
                  </div>
                </div>
                <div className="table_scroll">
                  <table className="readings_table">
                    <thead>
                      <tr>
                        <th scope="col">Date &amp; time</th>
                        <th scope="col">Measurement slot</th>
                        <th scope="col">Glucose level</th>
                      </tr>
                    </thead>
                    <tbody>
                      {readings.map((reading) => (
                        <tr key={reading.id}>
                          <td>{formatReadingDate(reading.reading_date)} · {reading.reading_time}</td>
                          <td>{measurementLabels[reading.measurement_category] || reading.measurement_category}</td>
                          <td><strong>{formatGlucose(reading.glucose_value)} mg/dL</strong></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          ) : (
            <div className="empty_message report_empty">
              <FileText size={24} aria-hidden="true" />
              <h3>No readings for this period</h3>
              <p>There are no recorded glucose readings in the selected reporting period.</p>
            </div>
          )}
        </section>
      )}
    </div>
  )
}

export default Report
