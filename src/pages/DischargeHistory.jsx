import { useEffect, useState } from 'react'

function DischargeHistory() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [records, setRecords] = useState([])

  useEffect(() => {
    let isMounted = true

    const loadDischarges = async () => {
      try {
        const response = await fetch('/api/discharges')
        if (!response.ok) {
          throw new Error(`Failed to load discharges (${response.status})`)
        }
        const data = await response.json()
        if (isMounted) {
          setRecords(data)
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Unable to load discharge history')
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadDischarges()
    return () => {
      isMounted = false
    }
  }, [])

  return (
    <div className="page-grid">
      <section className="panel">
        <div className="panel-header">
          <div>
            <h3>Discharge History</h3>
            <p className="panel-subtitle">Database discharge records</p>
          </div>
          <button
            className="outline-button"
            type="button"
            onClick={() => window.location.reload()}
          >
            Refresh
          </button>
        </div>

        {loading ? <p className="panel-subtitle">Loading...</p> : null}
        {error ? <p className="qaoa-error">{error}</p> : null}

        {!loading && !error ? (
          <div className="table table-7">
            <div className="table-row table-head table-row-7">
              <span>Patient</span>
              <span>Hospital</span>
              <span>Status</span>
              <span>Room</span>
              <span>Care</span>
              <span>Discharged</span>
              <span>Reason</span>
            </div>
            {records.length ? (
              records.map((record) => (
                <div key={record._id} className="table-row table-row-7">
                  <span className="table-strong">{record.name}</span>
                  <span style={{ fontSize: '0.85rem' }}>{record.hospital}</span>
                  <span className="badge">{record.status || 'N/A'}</span>
                  <span>{record.room || '-'}</span>
                  <span>{record.care || '-'}</span>
                  <span>
                    {record.dischargedAt
                      ? new Date(record.dischargedAt).toLocaleString()
                      : '-'}
                  </span>
                  <span>{record.reason || 'Discharged'}</span>
                </div>
              ))
            ) : (
              <div className="table-row">
                <span>No discharge records found.</span>
              </div>
            )}
          </div>
        ) : null}
      </section>
    </div>
  )
}

export default DischargeHistory
