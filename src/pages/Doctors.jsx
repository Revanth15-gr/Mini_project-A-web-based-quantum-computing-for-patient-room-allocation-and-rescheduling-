function Doctors() {
  const doctors = [
    {
      name: 'Dr. A. Patel',
      specialty: 'Cardiology',
      status: 'On Duty',
      patients: 18,
      location: 'Visakhapatnam (విశాఖపట్నం), Andhra Pradesh',
    },
    {
      name: 'Dr. R. Nair',
      specialty: 'Neurology',
      status: 'On Call',
      patients: 12,
      location: 'Guntur (గుంటూరు), Andhra Pradesh',
    },
    {
      name: 'Dr. S. Iyer',
      specialty: 'Orthopedics',
      status: 'On Duty',
      patients: 15,
      location: 'Tirupati (తిరుపతి), Andhra Pradesh',
    },
    {
      name: 'Dr. M. Singh',
      specialty: 'Pediatrics',
      status: 'Off Shift',
      patients: 9,
      location: 'Vijayawada (విజయవాడ), Andhra Pradesh',
    },
    {
      name: 'Dr. S. Rao',
      specialty: 'Emergency Medicine',
      status: 'On Duty',
      patients: 14,
      location: 'Kakinada (కాకినాడ), Andhra Pradesh',
    },
    {
      name: 'Dr. N. Reddy',
      specialty: 'Pulmonology',
      status: 'On Call',
      patients: 11,
      location: 'Nellore (నెల్లూరు), Andhra Pradesh',
    },
  ]

  const pushAction = (message) => {
    window.dispatchEvent(new CustomEvent('app-action', { detail: message }))
  }

  return (
    <div className="page-grid">
      <section className="panel">
        <div className="panel-header">
          <div>
            <h3>Doctor Directory</h3>
            <p className="panel-subtitle">Availability and patient load</p>
          </div>
          <button
            className="primary-button"
            type="button"
            onClick={() => pushAction('Add doctor form opened')}
          >
            Add Doctor
          </button>
        </div>
        <div className="table">
          <div className="table-row table-head">
            <span>Name</span>
            <span>Specialty</span>
            <span>Location</span>
            <span>Status</span>
            <span>Patients</span>
            <span>Action</span>
          </div>
          {doctors.map((doctor) => (
            <div key={doctor.name} className="table-row">
              <span className="table-strong">{doctor.name}</span>
              <span>{doctor.specialty}</span>
              <span>{doctor.location}</span>
              <span className="badge">{doctor.status}</span>
              <span>{doctor.patients}</span>
              <button
                className="ghost-button"
                type="button"
                onClick={() => pushAction(`Viewing profile for ${doctor.name}`)}
              >
                View
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <h3>Performance Highlights</h3>
            <p className="panel-subtitle">Monthly care impact</p>
          </div>
        </div>
        <div className="stats-row">
          {[
            'Patient Satisfaction 4.7/5',
            'Avg. Response Time 12 mins',
            'Successful Transfers 92%',
          ].map((item) => (
            <div key={item} className="stat-card">
              <p>{item}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

export default Doctors
