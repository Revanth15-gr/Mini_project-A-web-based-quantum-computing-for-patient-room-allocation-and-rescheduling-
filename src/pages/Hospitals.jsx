import { useMemo, useState } from 'react'
import './Hospitals.css'

const HOSPITALS = [
  // Coastal Andhra District
  {
    id: 1,
    name: 'Vizag City Care Hospital',
    location: 'Visakhapatnam (విశాఖపట్నం), Coastal Andhra',
    specialty: 'General Medicine',
    patients: 124,
    doctors: 60,
    rooms: 20,
    occupancy: 84,
    district: 'Coastal Andhra',
    image: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  },
  {
    id: 2,
    name: 'Vijayawada Heart Institute',
    location: 'Vijayawada (విజయవాడ), Coastal Andhra',
    specialty: 'Cardiology',
    patients: 98,
    doctors: 48,
    rooms: 20,
    occupancy: 81,
    district: 'Coastal Andhra',
    image: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  },
  {
    id: 3,
    name: 'Guntur Neuro Center',
    location: 'Guntur (గుంటూరు), Coastal Andhra',
    specialty: 'Neurology',
    patients: 86,
    doctors: 44,
    rooms: 20,
    occupancy: 78,
    district: 'Coastal Andhra',
    image: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  },
  {
    id: 4,
    name: 'Kakinada Coastal Medical Center',
    location: 'Kakinada (కాకినాడ), Coastal Andhra',
    specialty: 'General Medicine',
    patients: 65,
    doctors: 36,
    rooms: 20,
    occupancy: 69,
    district: 'Coastal Andhra',
    image: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  },
  {
    id: 5,
    name: 'Rajahmundry River Hospital',
    location: 'Rajahmundry, Coastal Andhra',
    specialty: 'Pediatrics',
    patients: 72,
    doctors: 38,
    rooms: 20,
    occupancy: 76,
    district: 'Coastal Andhra',
    image: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  },
  {
    id: 6,
    name: 'Machilipatnam Port Medical',
    location: 'Machilipatnam, Coastal Andhra',
    specialty: 'Emergency Care',
    patients: 55,
    doctors: 32,
    rooms: 20,
    occupancy: 68,
    district: 'Coastal Andhra',
    image: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
  },
  {
    id: 7,
    name: 'Eluru District Hospital',
    location: 'Eluru, Coastal Andhra',
    specialty: 'General Medicine',
    patients: 68,
    doctors: 40,
    rooms: 20,
    occupancy: 72,
    district: 'Coastal Andhra',
    image: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
  },
  {
    id: 8,
    name: 'Amalapuram Regional Care',
    location: 'Amalapuram, Coastal Andhra',
    specialty: 'Orthopedics',
    patients: 58,
    doctors: 34,
    rooms: 20,
    occupancy: 70,
    district: 'Coastal Andhra',
    image: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
  },
  {
    id: 9,
    name: 'Ongole Medical Institute',
    location: 'Ongole, Coastal Andhra',
    specialty: 'Surgery',
    patients: 80,
    doctors: 45,
    rooms: 20,
    occupancy: 79,
    district: 'Coastal Andhra',
    image: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
  },
  {
    id: 10,
    name: 'Nellore Emergency & Critical Care',
    location: 'Nellore (నెల్లూరు), Coastal Andhra',
    specialty: 'Critical Care',
    patients: 78,
    doctors: 40,
    rooms: 20,
    occupancy: 73,
    district: 'Coastal Andhra',
    image: 'linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)',
  },
  // Rayalaseema District
  {
    id: 11,
    name: 'Tirupati Ortho & Trauma Hospital',
    location: 'Tirupati (తిరుపతి), Rayalaseema',
    specialty: 'Orthopedics',
    patients: 72,
    doctors: 52,
    rooms: 20,
    occupancy: 76,
    district: 'Rayalaseema',
    image: 'linear-gradient(135deg, #d299c2 0%, #fef9d7 100%)',
  },
  {
    id: 12,
    name: 'Anantapur Heart Center',
    location: 'Anantapur, Rayalaseema',
    specialty: 'Cardiology',
    patients: 64,
    doctors: 38,
    rooms: 20,
    occupancy: 74,
    district: 'Rayalaseema',
    image: 'linear-gradient(135deg, #ff6e7f 0%, #bfe9ff 100%)',
  },
  {
    id: 13,
    name: 'Kurnool Multi-Specialty Hospital',
    location: 'Kurnool, Rayalaseema',
    specialty: 'Multi-Specialty',
    patients: 92,
    doctors: 54,
    rooms: 20,
    occupancy: 82,
    district: 'Rayalaseema',
    image: 'linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)',
  },
  {
    id: 14,
    name: 'Kadapa Regional Medical',
    location: 'Kadapa, Rayalaseema',
    specialty: 'General Medicine',
    patients: 70,
    doctors: 42,
    rooms: 20,
    occupancy: 75,
    district: 'Rayalaseema',
    image: 'linear-gradient(135deg, #fbc2eb 0%, #a6c1ee 100%)',
  },
  {
    id: 15,
    name: 'Chittoor Women & Child Care',
    location: 'Chittoor, Rayalaseema',
    specialty: 'Obstetrics',
    patients: 56,
    doctors: 36,
    rooms: 20,
    occupancy: 71,
    district: 'Rayalaseema',
    image: 'linear-gradient(135deg, #fdcbf1 0%, #e6dee9 100%)',
  },
  {
    id: 16,
    name: 'Nandyal District Hospital',
    location: 'Nandyal, Rayalaseema',
    specialty: 'General Medicine',
    patients: 62,
    doctors: 35,
    rooms: 20,
    occupancy: 69,
    district: 'Rayalaseema',
    image: 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)',
  },
  {
    id: 17,
    name: 'Proddatur Eye & ENT Center',
    location: 'Proddatur, Rayalaseema',
    specialty: 'Ophthalmology',
    patients: 48,
    doctors: 28,
    rooms: 20,
    occupancy: 65,
    district: 'Rayalaseema',
    image: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
  },
  {
    id: 18,
    name: 'Hindupur Community Hospital',
    location: 'Hindupur, Rayalaseema',
    specialty: 'Community Care',
    patients: 54,
    doctors: 30,
    rooms: 20,
    occupancy: 67,
    district: 'Rayalaseema',
    image: 'linear-gradient(135deg, #ffeaa7 0%, #dfe6e9 100%)',
  },
  {
    id: 19,
    name: 'Dharmavaram Diabetes Center',
    location: 'Dharmavaram, Rayalaseema',
    specialty: 'Endocrinology',
    patients: 60,
    doctors: 32,
    rooms: 20,
    occupancy: 70,
    district: 'Rayalaseema',
    image: 'linear-gradient(135deg, #fab2ff 0%, #1904e5 100%)',
  },
  {
    id: 20,
    name: 'Madanapalle Maternity Hospital',
    location: 'Madanapalle, Rayalaseema',
    specialty: 'Maternity',
    patients: 66,
    doctors: 40,
    rooms: 20,
    occupancy: 73,
    district: 'Rayalaseema',
    image: 'linear-gradient(135deg, #ff9a56 0%, #ffcb57 100%)',
  },
]

const SPECIALTIES = [
  'All Specialties',
  'General Medicine',
  'Cardiology',
  'Neurology',
  'Orthopedics',
  'Pediatrics',
  'Emergency Care',
  'Surgery',
  'Critical Care',
  'Multi-Specialty',
  'Obstetrics',
  'Ophthalmology',
  'Community Care',
  'Endocrinology',
  'Maternity',
]

const DISTRICTS = ['All Districts', 'Coastal Andhra', 'Rayalaseema']

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
  const [districtFilter, setDistrictFilter] = useState('All Districts')

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
      const matchesDistrict =
        districtFilter === 'All Districts' || hospital.district === districtFilter
      return matchesSearch && matchesLocation && matchesSpecialty && matchesDistrict
    })
  }, [searchQuery, locationQuery, specialtyFilter, districtFilter])

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
          <label htmlFor="districtFilter">District</label>
          <select
            id="districtFilter"
            value={districtFilter}
            onChange={(event) => setDistrictFilter(event.target.value)}
          >
            {DISTRICTS.map((district) => (
              <option key={district} value={district}>
                {district}
              </option>
            ))}
          </select>
        </div>
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
            <div className="hospital-thumb" style={{ background: hospital.image }}>
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
              <h3>Hospital Occupancy Overview</h3>
              <p className="panel-subtitle">Patient occupancy rate by hospital</p>
            </div>
          </div>
          <div style={{ padding: '1.5rem' }}>
            {filteredHospitals.map((hospital) => (
              <div
                key={hospital.id}
                style={{
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                }}
              >
                <div style={{ minWidth: '180px', fontSize: '0.85rem', fontWeight: 500 }}>
                  {hospital.name.length > 30
                    ? hospital.name.substring(0, 27) + '...'
                    : hospital.name}
                </div>
                <div
                  style={{
                    flex: 1,
                    background: 'rgba(15, 34, 65, 0.05)',
                    borderRadius: '8px',
                    height: '32px',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      height: '100%',
                      width: `${hospital.occupancy}%`,
                      background:
                        hospital.occupancy >= 80
                          ? 'linear-gradient(90deg, #f093fb 0%, #f5576c 100%)'
                          : hospital.occupancy >= 70
                          ? 'linear-gradient(90deg, #4facfe 0%, #00f2fe 100%)'
                          : 'linear-gradient(90deg, #43e97b 0%, #38f9d7 100%)',
                      transition: 'width 0.3s ease',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      paddingLeft: '0.75rem',
                      color: '#fff',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                    }}
                  >
                    {hospital.occupancy}%
                  </div>
                </div>
                <div style={{ minWidth: '80px', fontSize: '0.85rem', color: '#666' }}>
                  {hospital.patients} patients
                </div>
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
