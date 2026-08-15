import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import ManagerRoute from './components/ManagerRoute'

const Home = lazy(() => import('./pages/Home'))
const AboutPage = lazy(() => import('./pages/AboutPage'))
const ContactPage = lazy(() => import('./pages/ContactPage'))
const CalculatorPage = lazy(() => import('./pages/CalculatorPage'))
const BookPickupPage = lazy(() => import('./pages/BookPickupPage'))
const BookPickupConfirmedPage = lazy(() => import('./pages/BookPickupConfirmedPage'))
const TrackPage = lazy(() => import('./pages/TrackPage'))
const DeliveryProofPage = lazy(() => import('./pages/DeliveryProofPage'))
const DriverPage = lazy(() => import('./pages/DriverPage'))
const DriverSignup = lazy(() => import('./pages/DriverSignup'))
const DriverLogin = lazy(() => import('./pages/DriverLogin'))
const StaffLogin = lazy(() => import('./pages/StaffLogin'))
const StaffShipments = lazy(() => import('./pages/StaffShipments'))
const StaffVehicles = lazy(() => import('./pages/StaffVehicles'))
const StaffBatches = lazy(() => import('./pages/StaffBatches'))
const BatchDetail = lazy(() => import('./pages/BatchDetail'))
const BatchWaybill = lazy(() => import('./pages/BatchWaybill'))
const DailyWaybill = lazy(() => import('./pages/DailyWaybill'))
const NewShipment = lazy(() => import('./pages/NewShipment'))
const ShipmentLabel = lazy(() => import('./pages/ShipmentLabel'))
const ShipmentInvoice = lazy(() => import('./pages/ShipmentInvoice'))
const StaffScan = lazy(() => import('./pages/StaffScan'))
const StaffCustomers = lazy(() => import('./pages/StaffCustomers'))
const CustomerDetail = lazy(() => import('./pages/CustomerDetail'))
const StaffPricingSettings = lazy(() => import('./pages/StaffPricingSettings'))
const ManagementDashboard = lazy(() => import('./pages/ManagementDashboard'))

function PageLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex items-center gap-2 text-slate">
        <span className="w-2 h-2 rounded-full bg-orange animate-pulse" />
        <span className="text-sm">Loading…</span>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoading />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/calculator" element={<CalculatorPage />} />
          <Route path="/book-pickup" element={<BookPickupPage />} />
          <Route path="/book-pickup/confirmed" element={<BookPickupConfirmedPage />} />
          <Route path="/track" element={<TrackPage />} />
          <Route path="/track/:trackingNumber" element={<TrackPage />} />
          <Route path="/track/:trackingNumber/proof" element={<DeliveryProofPage />} />
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
          <Route path="/staff/customers" element={<ProtectedRoute><StaffCustomers /></ProtectedRoute>} />
          <Route path="/staff/customers/:id" element={<ProtectedRoute><CustomerDetail /></ProtectedRoute>} />
          <Route path="/management" element={<ProtectedRoute><ManagerRoute><ManagementDashboard /></ManagerRoute></ProtectedRoute>} />
          <Route path="/management/pricing" element={<ProtectedRoute><ManagerRoute><StaffPricingSettings /></ManagerRoute></ProtectedRoute>} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
