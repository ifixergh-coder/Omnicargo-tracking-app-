import { Link } from 'react-router-dom'
import { Package, Truck, User } from 'lucide-react'

export default function LoginHub() {
  return (
    <div className="min-h-screen bg-navy flex flex-col items-center justify-center px-6">
      <div className="flex items-center gap-2 mb-10">
        <span className="w-3 h-3 rounded-full bg-orange" />
        <span className="text-white text-lg font-semibold">OmniCargo</span>
      </div>

      <div className="w-full max-w-sm space-y-3">
        <Link to="/staff/login" className="flex items-center gap-3 bg-white rounded-lg p-4 shadow-lg">
          <Package className="text-navy" size={22} />
          <div>
            <p className="font-medium text-navy">Staff</p>
            <p className="text-xs text-slate">Manage shipments, batches, scanning</p>
          </div>
        </Link>

        <Link to="/driver/login" className="flex items-center gap-3 bg-white rounded-lg p-4 shadow-lg">
          <Truck className="text-navy" size={22} />
          <div>
            <p className="font-medium text-navy">Driver</p>
            <p className="text-xs text-slate">Share location, view your deliveries</p>
          </div>
        </Link>

        <Link to="/account/login" className="flex items-center gap-3 bg-white rounded-lg p-4 shadow-lg">
          <User className="text-navy" size={22} />
          <div>
            <p className="font-medium text-navy">Customer</p>
            <p className="text-xs text-slate">Track orders, saved addresses</p>
          </div>
        </Link>
      </div>

      <Link to="/" className="text-white/50 text-sm mt-8 underline">Back to homepage</Link>
    </div>
  )
}
