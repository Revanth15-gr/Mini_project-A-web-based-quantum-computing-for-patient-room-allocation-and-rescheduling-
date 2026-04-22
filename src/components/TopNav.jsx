function TopNav() {
  const careDirectorLogoUrl = 'data:image/png;base64,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'

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
          <div
            className="user-avatar user-avatar-logo"
            aria-hidden="true"
            style={{ backgroundImage: `url(${careDirectorLogoUrl}), linear-gradient(135deg, #7ad4ff, #4f8dff)` }}
          />
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
