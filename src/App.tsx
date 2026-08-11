import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import TrackPage from './pages/TrackPage'
import DriverPage from './pages/DriverPage'
import StaffLogin from './pages/StaffLogin'
import StaffShipments from './pages/StaffShipments'
import NewShipment from './pages/NewShipment'
import ShipmentLabel from './pages/ShipmentLabel'
import ShipmentInvoice from './pages/ShipmentInvoice'
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
        <Route path="/staff/shipments" element={<ProtectedRoute><StaffShipments /></ProtectedRoute>} />
        <Route path="/staff/shipments/new" element={<ProtectedRoute><NewShipment /></ProtectedRoute>} />
        <Route path="/staff/shipments/:id/label" element={<ProtectedRoute><ShipmentLabel /></ProtectedRoute>} />
        <Route path="/staff/shipments/:id/invoice" element={<ProtectedRoute><ShipmentInvoice /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  )
}
