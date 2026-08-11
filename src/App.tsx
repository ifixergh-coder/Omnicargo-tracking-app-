import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import TrackPage from './pages/TrackPage'
import DriverPage from './pages/DriverPage'
import StaffLogin from './pages/StaffLogin'
import NewShipment from './pages/NewShipment'
import ProtectedRoute from './components/ProtectedRoute'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/track" element={<TrackPage />} />
        <Route path="/track/:trackingNumber" element={<TrackPage />} />
        <Route path="/driver" element={<DriverPage />} />
        <Route path="/staff/login" element={<StaffLogin />} />
        <Route path="/staff/shipments/new" element={<ProtectedRoute><NewShipment /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  )
}
