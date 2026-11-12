import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

const categoryLabels = {
  morning_fasting: 'Morning (Fasting)',
  after_breakfast: 'After Breakfast',
  after_lunch: 'After Lunch',
  after_dinner: 'After Dinner',
}

const formatValue = (value) =>
  value === null || value === undefined ? '—' : Number(value).toFixed(1)

const reportNames = {
  daily: 'Daily Report',
  'month-to-date': 'Month-to-Date Report',
  'previous-month': 'Previous Month Report',
}

const getFileName = (report) => {
  const fileDate = report.reportType === 'daily'
    ? report.period.startDate
    : report.reportType === 'month-to-date'
      ? report.period.endDate.slice(0, 7)
      : report.period.startDate.slice(0, 7)
  const reportName = report.reportType === 'month-to-date'
    ? 'Month-to-Date'
    : report.reportType === 'previous-month'
      ? 'Previous-Month'
      : 'Daily'
  return `Sweety-${reportName}-Report-${fileDate}.pdf`
}

export function downloadReportPdf(report, generatedAt) {
  const document = new jsPDF()
  const pageWidth = document.internal.pageSize.getWidth()
  const pageHeight = document.internal.pageSize.getHeight()
  const margin = 14
  const reportTitle = reportNames[report.reportType] || 'Glucose Report'
  const generatedDate = new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(generatedAt)

  document.setFillColor(91, 52, 175)
  document.rect(0, 0, pageWidth, 30, 'F')
  document.setTextColor(255, 255, 255)
  document.setFont('helvetica', 'bold')
  document.setFontSize(17)
  document.text('SWEETY', margin, 13)
  document.setFont('helvetica', 'normal')
  document.setFontSize(9)
  document.text('Blood Glucose Tracker', margin, 21)

  document.setTextColor(36, 31, 66)
  document.setFont('helvetica', 'bold')
  document.setFontSize(16)
  document.text(reportTitle, margin, 42)
  document.setFont('helvetica', 'normal')
  document.setFontSize(10)
  document.text(
    `Reporting period: ${report.period.startDate} to ${report.period.endDate}`,
    margin,
    50,
  )
  document.text(`Generated: ${generatedDate}`, margin, 57)

  autoTable(document, {
    startY: 65,
    head: [['Highest (mg/dL)', 'Lowest (mg/dL)', 'Average (mg/dL)', 'Total readings']],
    body: [[
      formatValue(report.summary.highest),
      formatValue(report.summary.lowest),
      formatValue(report.summary.average),
      String(report.summary.totalReadings),
    ]],
    theme: 'grid',
    margin: { left: margin, right: margin },
    styles: { font: 'helvetica', fontSize: 9, cellPadding: 3, textColor: [42, 38, 67] },
    headStyles: { fillColor: [91, 52, 175], textColor: [255, 255, 255], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [247, 244, 255] },
    tableLineColor: [226, 220, 241],
    tableLineWidth: 0.2,
  })

  const readings = report.readings || []
  const tableTop = document.lastAutoTable.finalY + 12
  document.setTextColor(36, 31, 66)
  document.setFont('helvetica', 'bold')
  document.setFontSize(12)
  document.text('Glucose reading history', margin, tableTop)

  if (readings.length) {
    autoTable(document, {
      startY: tableTop + 5,
      head: [['Date & time', 'Measurement slot', 'Glucose level (mg/dL)']],
      body: readings.map((reading) => [
        `${reading.reading_date} ${reading.reading_time}`,
        categoryLabels[reading.measurement_category] || reading.measurement_category,
        formatValue(reading.glucose_value),
      ]),
      theme: 'grid',
      margin: { left: margin, right: margin, top: 18, bottom: 18 },
      styles: { font: 'helvetica', fontSize: 9, cellPadding: 3, textColor: [42, 38, 67] },
      headStyles: { fillColor: [91, 52, 175], textColor: [255, 255, 255], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [247, 244, 255] },
      tableLineColor: [226, 220, 241],
      tableLineWidth: 0.2,
      rowPageBreak: 'avoid',
      didDrawPage: () => {
        if (document.internal.getCurrentPageInfo().pageNumber > 1) {
          document.setFont('helvetica', 'normal')
          document.setFontSize(8)
          document.setTextColor(111, 101, 140)
          document.text('Sweety · Blood Glucose Tracker', margin, 10)
        }
      },
    })
  } else {
    document.setFont('helvetica', 'normal')
    document.setFontSize(10)
    document.setTextColor(111, 101, 140)
    document.text('No glucose readings were recorded in this period.', margin, tableTop + 8)
  }

  const pageCount = document.internal.getNumberOfPages()
  for (let page = 1; page <= pageCount; page += 1) {
    document.setPage(page)
    document.setFont('helvetica', 'normal')
    document.setFontSize(8)
    document.setTextColor(111, 101, 140)
    document.text(`Page ${page} of ${pageCount}`, pageWidth - margin, pageHeight - 8, {
      align: 'right',
    })
  }

  document.save(getFileName(report))
}
