import { useMemo, useState } from 'react'
import './Hospitals.css'

const HOSPITALS = [
  {
    id: 1,
    name: 'Vizag City Care Hospital',
    location: 'Visakhapatnam (విశాఖపట్నం), Andhra Pradesh',
    specialty: 'General Medicine',
    patients: 124,
    doctors: 60,
    rooms: 130,
    occupancy: 84,
  },
  {
    id: 2,
    name: 'Vijayawada Heart Institute',
    location: 'Vijayawada (విజయవాడ), Andhra Pradesh',
    specialty: 'Cardiology',
    patients: 98,
    doctors: 48,
    rooms: 96,
    occupancy: 81,
  },
  {
    id: 3,
    name: 'Guntur Neuro Center',
    location: 'Guntur (గుంటూరు), Andhra Pradesh',
    specialty: 'Neurology',
    patients: 86,
    doctors: 44,
    rooms: 104,
    occupancy: 78,
  },
  {
    id: 4,
    name: 'Tirupati Ortho & Trauma Hospital',
    location: 'Tirupati (తిరుపతి), Andhra Pradesh',
    specialty: 'Orthopedics',
    patients: 72,
    doctors: 52,
    rooms: 80,
    occupancy: 76,
  },
  {
    id: 5,
    name: 'Kakinada Coastal Medical Center',
    location: 'Kakinada (కాకినాడ), Andhra Pradesh',
    specialty: 'General Medicine',
    patients: 65,
    doctors: 36,
    rooms: 70,
    occupancy: 69,
  },
  {
    id: 6,
    name: 'Nellore Emergency & Critical Care',
    location: 'Nellore (నెల్లూరు), Andhra Pradesh',
    specialty: 'General Medicine',
    patients: 78,
    doctors: 40,
    rooms: 85,
    occupancy: 73,
  },
]

const SPECIALTIES = [
  'All Specialties',
  'General Medicine',
  'Cardiology',
  'Neurology',
  'Orthopedics',
]

function getInitials(name) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
}

function pushAction(message) {
  window.dispatchEvent(new CustomEvent('app-action', { detail: message }))
}

function Hospitals() {
  const [searchQuery, setSearchQuery] = useState('')
  const [locationQuery, setLocationQuery] = useState('')
  const [specialtyFilter, setSpecialtyFilter] = useState('All Specialties')

  const filteredHospitals = useMemo(() => {
    return HOSPITALS.filter((hospital) => {
      const matchesSearch = hospital.name
        .toLowerCase()
        .includes(searchQuery.trim().toLowerCase())
      const matchesLocation = hospital.location
        .toLowerCase()
        .includes(locationQuery.trim().toLowerCase())
      const matchesSpecialty =
        specialtyFilter === 'All Specialties' || hospital.specialty === specialtyFilter
      return matchesSearch && matchesLocation && matchesSpecialty
    })
  }, [searchQuery, locationQuery, specialtyFilter])

  const totals = filteredHospitals.reduce(
    (acc, hospital) => {
      acc.patients += hospital.patients
      acc.rooms += hospital.rooms
      acc.doctors += hospital.doctors
      acc.occupancy += hospital.occupancy
      return acc
    },
    { patients: 0, rooms: 0, doctors: 0, occupancy: 0 },
  )

  const avgOccupancy =
    filteredHospitals.length > 0
      ? Math.round(totals.occupancy / filteredHospitals.length)
      : 0

  return (
    <div className="hospitals-page">
      <header className="hospitals-header">
        <div>
          <p className="hospitals-label">Hospitals</p>
          <h2 className="hospitals-title">Hospitals</h2>
          <p className="hospitals-breadcrumb">Home / Hospitals</p>
        </div>
        <button
          className="primary-button"
          type="button"
          onClick={() => pushAction('Add hospital form opened')}
        >
          Add Hospital
        </button>
      </header>

      <section className="hospitals-kpis">
        <div className="kpi-card">
          <p>Total Hospitals</p>
          <strong>{filteredHospitals.length}</strong>
        </div>
        <div className="kpi-card">
          <p>Total Patients</p>
          <strong>{totals.patients}</strong>
        </div>
        <div className="kpi-card">
          <p>Total Rooms</p>
          <strong>{totals.rooms}</strong>
        </div>
        <div className="kpi-card">
          <p>Avg. Occupancy</p>
          <strong>{avgOccupancy}%</strong>
        </div>
        <div className="kpi-search">
          <input
            type="search"
            placeholder="Search hospitals"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
          />
        </div>
      </section>

      <section className="hospitals-filters">
        <div className="filter-group">
          <label htmlFor="locationFilter">Location</label>
          <input
            id="locationFilter"
            type="text"
            placeholder="Enter city or region"
            value={locationQuery}
            onChange={(event) => setLocationQuery(event.target.value)}
          />
        </div>
        <div className="filter-group">
          <label htmlFor="specialtyFilter">Specialty</label>
          <select
            id="specialtyFilter"
            value={specialtyFilter}
            onChange={(event) => setSpecialtyFilter(event.target.value)}
          >
            {SPECIALTIES.map((specialty) => (
              <option key={specialty} value={specialty}>
                {specialty}
              </option>
            ))}
          </select>
        </div>
      </section>

      <section className="hospitals-grid">
        {filteredHospitals.map((hospital) => (
          <article key={hospital.id} className="hospital-card">
            <div className="hospital-thumb">
              <span>{getInitials(hospital.name)}</span>
            </div>
            <div className="hospital-body">
              <h3>{hospital.name}</h3>
              <p className="hospital-location">{hospital.location}</p>
              <div className="hospital-stats">
                <div>
                  <p>{hospital.patients}</p>
                  <span>Patients</span>
                </div>
                <div>
                  <p>{hospital.doctors}</p>
                  <span>Doctors</span>
                </div>
                <div>
                  <p>{hospital.rooms}</p>
                  <span>Rooms</span>
                </div>
              </div>
              <div className="hospital-occupancy">
                <span>Avg. Occupancy</span>
                <div className="occupancy-bar">
                  <span style={{ width: `${hospital.occupancy}%` }} />
                </div>
                <strong>{hospital.occupancy}%</strong>
              </div>
              <div className="hospital-actions">
                <button
                  className="ghost-button"
                  type="button"
                  onClick={() => pushAction(`Viewing details for ${hospital.name}`)}
                >
                  View Details
                </button>
                <button
                  className="outline-button"
                  type="button"
                  onClick={() => pushAction(`Managing ${hospital.name}`)}
                >
                  Manage Hospital
                </button>
              </div>
            </div>
          </article>
        ))}
      </section>

      <section className="hospitals-summary">
        <div className="panel">
          <div className="panel-header">
            <div>
              <h3>Hospital Assignment Overview</h3>
              <p className="panel-subtitle">Distribution by hospital</p>
            </div>
          </div>
          <div className="assignment-chart">
            {filteredHospitals.map((hospital) => (
              <div key={hospital.id} className="assignment-bar">
                <span style={{ height: `${hospital.occupancy}%` }} />
                <p>{hospital.name.split(' ')[0]}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="panel">
          <div className="panel-header">
            <div>
              <h3>Doctor Performance</h3>
              <p className="panel-subtitle">Monthly summary</p>
            </div>
            <button
              className="ghost-button"
              type="button"
              onClick={() => pushAction('Viewing doctor analytics')}
            >
              View Analytics
            </button>
          </div>
          <div className="performance-list">
            <div>
              <strong>$9,740</strong>
              <p>Total Revenue</p>
            </div>
            <div>
              <strong>1,282</strong>
              <p>Total Visits</p>
            </div>
            <div>
              <strong>78%</strong>
              <p>Patients Treated</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Hospitals
