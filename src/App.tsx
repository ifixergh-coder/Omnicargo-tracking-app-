import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import TrackPage from './pages/TrackPage'
import DriverPage from './pages/DriverPage'
import DriverSignup from './pages/DriverSignup'
import DriverLogin from './pages/DriverLogin'
import StaffLogin from './pages/StaffLogin'
import StaffShipments from './pages/StaffShipments'
import StaffVehicles from './pages/StaffVehicles'
import StaffBatches from './pages/StaffBatches'
import BatchDetail from './pages/BatchDetail'
import BatchWaybill from './pages/BatchWaybill'
import DailyWaybill from './pages/DailyWaybill'
import NewShipment from './pages/NewShipment'
import ShipmentLabel from './pages/ShipmentLabel'
import ShipmentInvoice from './pages/ShipmentInvoice'
import StaffScan from './pages/StaffScan'
import ProtectedRoute from './components/ProtectedRoute'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/track" element={<TrackPage />} />
        <Route path="/track/:trackingNumber" element={<TrackPage />} />
        <Route path="/driver" element={<ProtectedRoute><DriverPage /></ProtectedRoute>} />
        <Route path="/driver/signup" element={<DriverSignup />} />
        <Route path="/driver/login" element={<DriverLogin />} />
        <Route path="/staff/login" element={<StaffLogin />} />
        <Route path="/staff/shipments" element={<ProtectedRoute><StaffShipments /></ProtectedRoute>} />
        <Route path="/staff/shipments/new" element={<ProtectedRoute><NewShipment /></ProtectedRoute>} />
        <Route path="/staff/shipments/:id/label" element={<ProtectedRoute><ShipmentLabel /></ProtectedRoute>} />
        <Route path="/staff/shipments/:id/invoice" element={<ProtectedRoute><ShipmentInvoice /></ProtectedRoute>} />
        <Route path="/staff/vehicles" element={<ProtectedRoute><StaffVehicles /></ProtectedRoute>} />
        <Route path="/staff/batches" element={<ProtectedRoute><StaffBatches /></ProtectedRoute>} />
        <Route path="/staff/batches/:id" element={<ProtectedRoute><BatchDetail /></ProtectedRoute>} />
        <Route path="/staff/batches/:id/waybill" element={<ProtectedRoute><BatchWaybill /></ProtectedRoute>} />
        <Route path="/staff/waybill/daily" element={<ProtectedRoute><DailyWaybill /></ProtectedRoute>} />
        <Route path="/staff/scan" element={<ProtectedRoute><StaffScan /></ProtectedRoute>} />
        <Route path="/staff/scan/:trackingNumber" element={<ProtectedRoute><StaffScan /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  )
}
