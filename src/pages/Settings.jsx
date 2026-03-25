import { useContext, useState } from 'react'
import { HospitalContext } from '../state/HospitalContext.jsx'

function Settings() {
  const [saved, setSaved] = useState(false)
  const { systemSettings, updateSystemSetting } = useContext(HospitalContext)

  const settingItems = [
    { key: 'autoRescheduleConflicts', label: 'Auto-reschedule conflicts' },
    { key: 'enableIsolationPriority', label: 'Enable isolation priority' },
    { key: 'lockIcuRooms', label: 'Lock ICU rooms' },
    { key: 'notifyCareTeams', label: 'Notify care teams' },
  ]

  const pushAction = (message) => {
    window.dispatchEvent(new CustomEvent('app-action', { detail: message }))
  }

  const handleSave = () => {
    setSaved(true)
    pushAction('Settings saved successfully')
    setTimeout(() => setSaved(false), 2000)
  }

  const handleToggleChange = (settingKey, settingLabel, checked) => {
    updateSystemSetting(settingKey, checked)
    setSaved(false)
    pushAction(`${settingLabel} ${checked ? 'enabled' : 'disabled'}`)
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
          {settingItems.map((setting) => (
            <label key={setting.key} className="toggle">
              <input
                type="checkbox"
                checked={Boolean(systemSettings?.[setting.key])}
                onChange={(e) =>
                  handleToggleChange(setting.key, setting.label, e.target.checked)
                }
              />
              <span className="toggle-track" aria-hidden="true" />
              <span>{setting.label}</span>
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
