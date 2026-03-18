import { Navigate, Route, Routes } from 'react-router-dom'
import { HospitalProvider } from './state/HospitalContext.jsx'
import Layout from './components/Layout.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Hospitals from './pages/Hospitals.jsx'
import PatientsInfo from './pages/PatientsInfo.jsx'
import Rooms from './pages/Rooms.jsx'
import Doctors from './pages/Doctors.jsx'
import Emergency from './pages/Analytics.jsx'
import DischargeHistory from './pages/DischargeHistory.jsx'
import Settings from './pages/Settings.jsx'
import OptimizationReport from './pages/OptimizationReport.jsx'
import './App.css'

function App() {
  return (
    <HospitalProvider>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="hospitals" element={<Hospitals />} />
          <Route path="patients" element={<PatientsInfo />} />
          <Route path="rooms" element={<Rooms />} />
          <Route path="doctors" element={<Doctors />} />
          <Route path="analytics" element={<Emergency />} />
          <Route path="discharges" element={<DischargeHistory />} />
          <Route path="settings" element={<Settings />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
        <Route path="optimization-report" element={<OptimizationReport />} />
      </Routes>
    </HospitalProvider>
  )
}

export default App
