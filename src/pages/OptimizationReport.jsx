import { useEffect, useMemo, useState } from 'react'

const REPORT_STORAGE_KEY = 'optimizationReportData'

function readReport() {
  try {
    return JSON.parse(localStorage.getItem(REPORT_STORAGE_KEY) || 'null')
  } catch {
    return null
  }
}

function OptimizationReport() {
  const [report, setReport] = useState(() => readReport())
  const [activeTrendIndex, setActiveTrendIndex] = useState(null)

  useEffect(() => {
    const syncReport = () => {
      setReport(readReport())
    }

    const onStorage = (event) => {
      if (event.key === REPORT_STORAGE_KEY) {
        syncReport()
      }
    }

    const timer = setInterval(syncReport, 2500)
    window.addEventListener('storage', onStorage)

    return () => {
      clearInterval(timer)
      window.removeEventListener('storage', onStorage)
    }
  }, [])

  if (!report) {
    return (
      <div className="report-page">
        <div className="report-card">
          <h1>Optimization Report</h1>
          <p>No QAOA report data found. Run optimization first, then open Full Report.</p>
        </div>
      </div>
    )
  }

  const trend = Array.isArray(report.trend) && report.trend.length ? report.trend : [0]
  const runHistory = Array.isArray(report.runHistory) ? report.runHistory : []
  const activeValue = activeTrendIndex === null ? trend[trend.length - 1] : trend[activeTrendIndex]

  const handleTrendPointer = (event) => {
    const bounds = event.currentTarget.getBoundingClientRect()
    const clientX = event.touches?.[0]?.clientX ?? event.clientX
    if (!bounds.width || !Number.isFinite(clientX)) {
      return
    }
    const relativeX = Math.min(Math.max(clientX - bounds.left, 0), bounds.width)
    const idx = Math.round((relativeX / bounds.width) * (trend.length - 1))
    setActiveTrendIndex(Math.min(Math.max(idx, 0), trend.length - 1))
  }

  return (
    <div className="report-page">
      <header className="report-header">
        <div>
          <p className="report-eyebrow">Quantum Allocation Report</p>
          <h1>Full Optimization Performance Report</h1>
          <p className="report-subtitle">
            Hospital: {report.selectedHospital} | Solver: {report.solver} | Generated: {new Date(report.generatedAt).toLocaleString()}
          </p>
        </div>
      </header>

      <section className="report-metrics">
        <div className="report-metric-card">
          <p className="report-metric-value">{report.satisfactionScore}%</p>
          <p className="report-metric-label">Constraint Satisfaction</p>
        </div>
        <div className="report-metric-card">
          <p className="report-metric-value">{report.throughput}</p>
          <p className="report-metric-label">Assignments / Second</p>
        </div>
        <div className="report-metric-card">
          <p className="report-metric-value">{(report.latencyMs / 1000).toFixed(2)}s</p>
          <p className="report-metric-label">Optimization Latency</p>
        </div>
        <div className="report-metric-card">
          <p className="report-metric-value">{report.fairnessIndex.toFixed(2)}</p>
          <p className="report-metric-label">Fairness Index</p>
        </div>
      </section>

      <section className="report-grid">
        <article className="report-card">
          <div className="report-card-head">
            <h3>Satisfaction Trend</h3>
            <p className="report-hover-value">{activeValue}%</p>
          </div>
          <div
            className="report-chart-area"
            onMouseMove={handleTrendPointer}
            onMouseLeave={() => setActiveTrendIndex(null)}
            onTouchStart={handleTrendPointer}
            onTouchMove={handleTrendPointer}
          >
            <svg viewBox="0 0 300 120" className="report-svg" preserveAspectRatio="none" aria-hidden="true">
              <polyline
                points={trend
                  .map((value, index) => `${(index * 300) / Math.max(trend.length - 1, 1)},${120 - (value / 100) * 120}`)
                  .join(' ')}
              />
              {trend.map((value, index) => (
                <circle
                  key={`trend-${value}-${index}`}
                  cx={(index * 300) / Math.max(trend.length - 1, 1)}
                  cy={120 - (value / 100) * 120}
                  r={index === (activeTrendIndex === null ? trend.length - 1 : activeTrendIndex) ? '4.3' : '3'}
                />
              ))}
            </svg>
          </div>
        </article>

        <article className="report-card">
          <h3>Throughput History</h3>
          <div className="report-bars">
            {(runHistory.length ? runHistory : [{ throughput: report.throughput }]).slice(-10).map((item, index) => {
              const barValue = Math.max(8, Math.min(100, (item.throughput || 0) * 10))
              return <span key={`bar-${index}`} style={{ height: `${barValue}%` }} />
            })}
          </div>
        </article>
      </section>

      <section className="report-grid">
        <article className="report-card">
          <h3>Assignment Details</h3>
          <p className="report-subtitle">Live from latest QAOA run</p>
          <div className="report-table">
            <div className="report-table-row report-table-head">
              <span>Patient</span>
              <span>Assigned Room</span>
            </div>
            {(report.assignments || []).map((item, index) => (
              <div key={`assign-${index}`} className="report-table-row">
                <span>{item.patientName || item.patient}</span>
                <span>{item.room || 'Unassigned'}</span>
              </div>
            ))}
          </div>
        </article>

        <article className="report-card">
          <h3>System Performance</h3>
          <div className="system-metrics">
            <p><strong>CPU Cores:</strong> {report.system?.cores ?? 'n/a'}</p>
            <p><strong>Device Memory:</strong> {report.system?.deviceMemoryGB ?? 'n/a'} GB</p>
            <p><strong>Online:</strong> {String(report.system?.online)}</p>
            <p><strong>Platform:</strong> {report.system?.platform ?? 'n/a'}</p>
            <p className="system-agent"><strong>User Agent:</strong> {report.system?.userAgent ?? 'n/a'}</p>
          </div>
        </article>
      </section>
    </div>
  )
}

export default OptimizationReport
