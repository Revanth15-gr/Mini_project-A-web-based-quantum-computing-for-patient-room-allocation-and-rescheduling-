import { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import SideNav from './SideNav.jsx'
import TopNav from './TopNav.jsx'

function Layout() {
  const [actionMessage, setActionMessage] = useState('')

  useEffect(() => {
    let timerId

    const handler = (event) => {
      if (!event.detail) {
        return
      }
      setActionMessage(event.detail)
      if (timerId) {
        clearTimeout(timerId)
      }
      timerId = setTimeout(() => setActionMessage(''), 4000)
    }

    window.addEventListener('app-action', handler)
    return () => {
      window.removeEventListener('app-action', handler)
      if (timerId) {
        clearTimeout(timerId)
      }
    }
  }, [])

  return (
    <div className="app-shell">
      <SideNav />
      <div className="app-main">
        <TopNav />
        <main className="app-content">
          {actionMessage ? (
            <div className="action-banner" role="status">
              {actionMessage}
            </div>
          ) : null}
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default Layout
