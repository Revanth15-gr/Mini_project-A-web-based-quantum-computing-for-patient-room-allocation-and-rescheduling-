function TopNav() {
  const pushAction = (message) => {
    window.dispatchEvent(new CustomEvent('app-action', { detail: message }))
  }

  return (
    <header className="top-nav">
      <div>
        <p className="page-eyebrow">Quantum-Based Patient Room Allocation</p>
        <h1 className="page-title">Scheduling Command Center</h1>
      </div>
      <div className="top-actions">
        <div className="search-field">
          <span className="search-icon" aria-hidden="true" />
          <input
            type="search"
            placeholder="Search patients, rooms, staff"
            aria-label="Search"
            onChange={(e) =>
              e.target.value && pushAction(`Searching for: ${e.target.value}`)
            }
          />
        </div>
        <button
          className="ghost-button"
          type="button"
          onClick={() =>
            pushAction(
              'Active alerts: Room 105 near capacity, Sarah Lee ready for discharge, John Miller transfer pending'
            )
          }
        >
          Alerts
        </button>
        <div
          className="user-chip"
          onClick={() => pushAction('User profile: Dr. Smith (Care Director)')}
          style={{ cursor: 'pointer' }}
        >
          <div className="user-avatar" aria-hidden="true" />
          <div>
            <p className="user-name">Dr. Smith</p>
            <p className="user-role">Care Director</p>
          </div>
        </div>
      </div>
    </header>
  )
}

export default TopNav
