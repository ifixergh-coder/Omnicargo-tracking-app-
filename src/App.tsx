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
const LoginHub = lazy(() => import('./pages/LoginHub'))
const DriverPage = lazy(() => import('./pages/DriverPage'))
const DriverBatch = lazy(() => import('./pages/DriverBatch'))
const DriverRoute = lazy(() => import('./pages/DriverRoute'))
const DriverDashboard = lazy(() => import('./pages/DriverDashboard'))
const DriverProfile = lazy(() => import('./pages/DriverProfile'))
const DriverSignup = lazy(() => import('./pages/DriverSignup'))
const DriverLogin = lazy(() => import('./pages/DriverLogin'))
const CustomerSignup = lazy(() => import('./pages/CustomerSignup'))
const CustomerLogin = lazy(() => import('./pages/CustomerLogin'))
const CustomerDashboard = lazy(() => import('./pages/CustomerDashboard'))
const CustomerAddresses = lazy(() => import('./pages/CustomerAddresses'))
const CustomerProfile = lazy(() => import('./pages/CustomerProfile'))
const CustomerShipmentDetail = lazy(() => import('./pages/CustomerShipmentDetail'))
const StaffLogin = lazy(() => import('./pages/StaffLogin'))
const StaffSignup = lazy(() => import('./pages/StaffSignup'))
const StaffShipments = lazy(() => import('./pages/StaffShipments'))
const StaffVehicles = lazy(() => import('./pages/StaffVehicles'))
const StaffBatches = lazy(() => import('./pages/StaffBatches'))
const BatchDetail = lazy(() => import('./pages/BatchDetail'))
const BatchWaybill = lazy(() => import('./pages/BatchWaybill'))
const DailyWaybill = lazy(() => import('./pages/DailyWaybill'))
const NewShipment = lazy(() => import('./pages/NewShipment'))
const ShipmentEdit = lazy(() => import('./pages/ShipmentEdit'))
const StaffBookPickup = lazy(() => import('./pages/StaffBookPickup'))
const StaffTrackLookup = lazy(() => import('./pages/StaffTrackLookup'))
const ShipmentLabel = lazy(() => import('./pages/ShipmentLabel'))
const ShipmentInvoice = lazy(() => import('./pages/ShipmentInvoice'))
const StaffScan = lazy(() => import('./pages/StaffScan'))
const StaffCustomers = lazy(() => import('./pages/StaffCustomers'))
const CustomerDetail = lazy(() => import('./pages/CustomerDetail'))
const StaffPricingSettings = lazy(() => import('./pages/StaffPricingSettings'))
const ManagementDashboard = lazy(() => import('./pages/ManagementDashboard'))
const ManagementStaff = lazy(() => import('./pages/ManagementStaff'))
const ManagementDailyWaybill = lazy(() => import('./pages/ManagementDailyWaybill'))
const ManagementDrivers = lazy(() => import('./pages/ManagementDrivers'))

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
          <Route path="/login" element={<LoginHub />} />

          <Route path="/account" element={<ProtectedRoute><CustomerDashboard /></ProtectedRoute>} />
          <Route path="/account/addresses" element={<ProtectedRoute><CustomerAddresses /></ProtectedRoute>} />
          <Route path="/account/profile" element={<ProtectedRoute><CustomerProfile /></ProtectedRoute>} />
          <Route path="/account/shipments/:id" element={<ProtectedRoute><CustomerShipmentDetail /></ProtectedRoute>} />
          <Route path="/account/signup" element={<CustomerSignup />} />
          <Route path="/account/login" element={<CustomerLogin />} />

          <Route path="/driver" element={<ProtectedRoute><DriverPage /></ProtectedRoute>} />
          <Route path="/driver/dashboard" element={<ProtectedRoute><DriverDashboard /></ProtectedRoute>} />
          <Route path="/driver/profile" element={<ProtectedRoute><DriverProfile /></ProtectedRoute>} />
          <Route path="/driver/batch" element={<ProtectedRoute><DriverBatch /></ProtectedRoute>} />
          <Route path="/driver/route" element={<ProtectedRoute><DriverRoute /></ProtectedRoute>} />
          <Route path="/driver/signup" element={<DriverSignup />} />
          <Route path="/driver/login" element={<DriverLogin />} />

          <Route path="/staff/login" element={<StaffLogin />} />
          <Route path="/staff/signup" element={<StaffSignup />} />
          <Route path="/staff/shipments" element={<ProtectedRoute><StaffShipments /></ProtectedRoute>} />
          <Route path="/staff/shipments/new" element={<ProtectedRoute><NewShipment /></ProtectedRoute>} />
          <Route path="/staff/shipments/:id/edit" element={<ProtectedRoute><ShipmentEdit /></ProtectedRoute>} />
          <Route path="/staff/book-pickup" element={<ProtectedRoute><StaffBookPickup /></ProtectedRoute>} />
          <Route path="/staff/track" element={<ProtectedRoute><StaffTrackLookup /></ProtectedRoute>} />
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
          <Route path="/management/staff" element={<ProtectedRoute><ManagerRoute><ManagementStaff /></ManagerRoute></ProtectedRoute>} />
          <Route path="/management/waybill" element={<ProtectedRoute><ManagerRoute><ManagementDailyWaybill /></ManagerRoute></ProtectedRoute>} />
          <Route path="/management/drivers" element={<ProtectedRoute><ManagerRoute><ManagementDrivers /></ManagerRoute></ProtectedRoute>} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
