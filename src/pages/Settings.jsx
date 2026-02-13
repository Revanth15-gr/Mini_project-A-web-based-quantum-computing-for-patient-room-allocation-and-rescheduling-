import { useState } from 'react'

function Settings() {
  const [saved, setSaved] = useState(false)

  const pushAction = (message) => {
    window.dispatchEvent(new CustomEvent('app-action', { detail: message }))
  }

  const handleSave = () => {
    setSaved(true)
    pushAction('Settings saved successfully')
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="page-grid">
      <section className="panel">
        <div className="panel-header">
          <div>
            <h3>System Settings</h3>
            <p className="panel-subtitle">Tune quantum constraints and alerts</p>
          </div>
          <button className="primary-button" type="button" onClick={handleSave}>
            {saved ? '✓ Saved' : 'Save Settings'}
          </button>
        </div>
        <div className="settings-grid">
          {[
            'Auto-reschedule conflicts',
            'Enable isolation priority',
            'Lock ICU rooms',
            'Notify care teams',
          ].map((setting) => (
            <label key={setting} className="toggle">
              <input
                type="checkbox"
                defaultChecked
                onChange={(e) =>
                  pushAction(
                    `${setting} ${e.target.checked ? 'enabled' : 'disabled'}`
                  )
                }
              />
              <span className="toggle-track" aria-hidden="true" />
              <span>{setting}</span>
            </label>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <h3>Optimization Bounds</h3>
            <p className="panel-subtitle">Real-time constraints for solvers</p>
          </div>
        </div>
        <div className="bounds-grid">
          {[
            { label: 'Max transfer distance', value: '0.6 miles' },
            { label: 'Room change limit', value: '2 per day' },
            { label: 'Priority weight', value: '0.85' },
          ].map((item) => (
            <div
              key={item.label}
              className="bound-card"
              onClick={() =>
                pushAction(`${item.label} | Current value: ${item.value}`)
              }
              style={{ cursor: 'pointer' }}
            >
              <p className="bound-label">{item.label}</p>
              <p className="bound-value">{item.value}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

export default Settings
