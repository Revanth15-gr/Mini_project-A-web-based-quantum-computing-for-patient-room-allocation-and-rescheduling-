import { useEffect, useState } from 'react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

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

  const downloadPDF = () => {
    try {
      console.log('Generating PDF with', records.length, 'records')
      const doc = new jsPDF()
      
      // Add title
      doc.setFontSize(18)
      doc.text('Discharge History Report', 14, 22)
      
      // Add generation date
      doc.setFontSize(11)
      doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30)
      
      // Prepare table data
      const tableData = records.map(record => [
        record.name,
        record.hospital,
        record.status || 'N/A',
        record.room || '-',
        record.care || '-',
        record.dischargedAt ? new Date(record.dischargedAt).toLocaleString() : '-',
        record.reason || 'Discharged'
      ])
      
      // Add table
      autoTable(doc, {
        startY: 35,
        head: [['Patient', 'Hospital', 'Status', 'Room', 'Care', 'Discharged', 'Reason']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [41, 128, 185], textColor: 255 },
        styles: { fontSize: 9, cellPadding: 3 },
        columnStyles: {
          0: { cellWidth: 30 },
          1: { cellWidth: 30 },
          2: { cellWidth: 20 },
          3: { cellWidth: 15 },
          4: { cellWidth: 20 },
          5: { cellWidth: 35 },
          6: { cellWidth: 35 }
        }
      })
      
      // Save the PDF
      const fileName = `discharge-history-${new Date().toISOString().split('T')[0]}.pdf`
      console.log('Saving PDF as:', fileName)
      doc.save(fileName)
    } catch (err) {
      console.error('Error generating PDF:', err)
      alert('Failed to generate PDF: ' + err.message)
    }
  }

  return (
    <div className="page-grid">
      <section className="panel">
        <div className="panel-header">
          <div>
            <h3>Discharge History</h3>
            <p className="panel-subtitle">Database discharge records</p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              className="outline-button"
              type="button"
              onClick={downloadPDF}
              disabled={!records.length}
            >
              Download PDF
            </button>
            <button
              className="outline-button"
              type="button"
              onClick={() => window.location.reload()}
            >
              Refresh
            </button>
          </div>
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
