import { useContext, useMemo, useState } from 'react'
import { HospitalContext } from '../state/HospitalContext.jsx'

function Doctors() {
  const { doctors, selectedHospital, addDoctor, addNotification, hospitals } = useContext(HospitalContext)
  const [districtFilter, setDistrictFilter] = useState('All Districts')
  const [specialtyFilter, setSpecialtyFilter] = useState('All Specialties')
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    specialty: 'Cardiology',
    hospital: selectedHospital,
    district: 'Coastal Andhra',
    salary: '900000',
  })

  const filteredDoctors = useMemo(() => {
    return doctors.filter((doctor) => {
      const matchesDistrict =
        districtFilter === 'All Districts' || doctor.district === districtFilter
      const matchesSpecialty =
        specialtyFilter === 'All Specialties' || doctor.specialty === specialtyFilter
      return matchesDistrict && matchesSpecialty
    })
  }, [doctors, districtFilter, specialtyFilter])

  const pushAction = (message) => {
    window.dispatchEvent(new CustomEvent('app-action', { detail: message }))
  }

  const handleFormChange = (e) => {
    const { name, value } = e.target
    setFormData((current) => ({ ...current, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      pushAction('Doctor name is required')
      return
    }

    // Randomly assign initial status
    const statuses = ['On Duty', 'On Call', 'Off Shift']
    const randomStatus = statuses[Math.floor(Math.random() * statuses.length)]

    const newDoctor = {
      name: formData.name.trim(),
      specialty: formData.specialty,
      hospital: formData.hospital,
      district: formData.district,
      status: randomStatus,
      salary: parseInt(formData.salary),
    }

    await addDoctor(newDoctor)
    setFormData({
      name: '',
      specialty: 'Cardiology',
      hospital: selectedHospital,
      district: 'Coastal Andhra',
      salary: '900000',
    })
    setShowForm(false)
    pushAction(`Added Dr. ${newDoctor.name} • ${newDoctor.specialty} • Status: ${randomStatus}`)
  }

  return (
    <div className="page-grid">
      <section className="panel">
        <div className="panel-header">
          <div>
            <h3>Doctor Directory</h3>
            <p className="panel-subtitle">{filteredDoctors.length} doctors across both districts</p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <select
              value={districtFilter}
              onChange={(e) => setDistrictFilter(e.target.value)}
              style={{
                padding: '0.5rem 0.75rem',
                borderRadius: '8px',
                border: '1px solid rgba(15, 34, 65, 0.1)',
                fontSize: '0.9rem',
              }}
            >
              <option>All Districts</option>
              <option>Coastal Andhra</option>
              <option>Rayalaseema</option>
            </select>
            <select
              value={specialtyFilter}
              onChange={(e) => setSpecialtyFilter(e.target.value)}
              style={{
                padding: '0.5rem 0.75rem',
                borderRadius: '8px',
                border: '1px solid rgba(15, 34, 65, 0.1)',
                fontSize: '0.9rem',
              }}
            >
              <option>All Specialties</option>
              <option>Cardiology</option>
              <option>Neurology</option>
              <option>Orthopedics</option>
              <option>Pediatrics</option>
              <option>General Medicine</option>
              <option>Emergency Care</option>
              <option>Surgery</option>
              <option>Radiology</option>
              <option>Anesthesiology</option>
              <option>Dermatology</option>
            </select>
            <button
              className="primary-button"
              type="button"
              onClick={() => setShowForm((current) => !current)}
            >
              {showForm ? 'Close Form' : 'Add Doctor'}
            </button>
          </div>
        </div>
        {showForm ? (
          <form className="patient-form" onSubmit={handleSubmit}>
            <div className="form-grid">
              <label>
                Doctor Name
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleFormChange}
                  placeholder="Dr. Name"
                  required
                />
              </label>
              <label>
                Specialty
                <select name="specialty" value={formData.specialty} onChange={handleFormChange}>
                  <option>Cardiology</option>
                  <option>Neurology</option>
                  <option>Orthopedics</option>
                  <option>Pediatrics</option>
                  <option>General Medicine</option>
                  <option>Emergency Care</option>
                  <option>Surgery</option>
                  <option>Radiology</option>
                  <option>Anesthesiology</option>
                  <option>Dermatology</option>
                </select>
              </label>
              <label>
                Hospital
                <select name="hospital" value={formData.hospital} onChange={handleFormChange}>
                  {hospitals.map((hospital) => (
                    <option key={hospital} value={hospital}>
                      {hospital}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                District
                <select name="district" value={formData.district} onChange={handleFormChange}>
                  <option>Coastal Andhra</option>
                  <option>Rayalaseema</option>
                </select>
              </label>
              <label>
                Monthly Salary (₹)
                <input
                  type="number"
                  name="salary"
                  value={formData.salary}
                  onChange={handleFormChange}
                  min="500000"
                  step="10000"
                />
              </label>
            </div>
            <div className="form-footer">
              <button className="primary-button" type="submit">
                Add Doctor
              </button>
            </div>
          </form>
        ) : null}
        <div className="table">
          <div className="table-row table-head">
            <span>Name</span>
            <span>Specialty</span>
            <span>Hospital</span>
            <span>District</span>
            <span>Status</span>
          </div>
          {filteredDoctors.map((doctor) => (
            <div key={doctor.id} className="table-row">
              <span className="table-strong">{doctor.name}</span>
              <span>{doctor.specialty}</span>
              <span style={{ fontSize: '0.85rem' }}>{doctor.hospital}</span>
              <span>{doctor.district}</span>
              <span className="badge">{doctor.status}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <h3>Doctor Performance</h3>
            <p className="panel-subtitle">Monthly summary in rupees</p>
          </div>
        </div>
        <div className="stats-row">
          {(() => {
            const totalSalary = filteredDoctors.reduce((sum, d) => sum + d.salary, 0)
            const avgSalary = filteredDoctors.length > 0 ? totalSalary / filteredDoctors.length : 0
            const totalPatients = filteredDoctors.reduce((sum, d) => sum + d.patients, 0)
            const estimatedRevenue = totalPatients * 2500 // ₹2500 per patient consultation
            
            return [
              { label: 'Total Monthly Payroll', value: `₹${totalSalary.toLocaleString('en-IN')}` },
              { label: 'Average Salary', value: `₹${Math.floor(avgSalary).toLocaleString('en-IN')}` },
              { label: 'Est. Monthly Revenue', value: `₹${estimatedRevenue.toLocaleString('en-IN')}` },
              { label: 'Total Patients', value: totalPatients.toString() },
            ].map((item) => (
              <div key={item.label} className="stat-card">
                <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: '0.5rem' }}>{item.label}</p>
                <strong style={{ fontSize: '1.3rem', color: '#0f2241' }}>{item.value}</strong>
              </div>
            ))
          })()}
        </div>
      </section>
    </div>
  )
}

export default Doctors
