import { Link, useLocation, useNavigate } from 'react-router-dom'
import { LayoutDashboard, DollarSign, Users, Truck, ClipboardList, LogOut, ArrowLeft } from 'lucide-react'
import { supabase } from '../lib/supabase'

const LINKS = [
  { to: '/management', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/management/pricing', label: 'Pricing', icon: DollarSign },
  { to: '/management/staff', label: 'Staff', icon: Users },
  { to: '/management/drivers', label: 'Drivers', icon: Truck },
  { to: '/management/waybill', label: 'Daily waybill', icon: ClipboardList },
]

export default function ManagementNav() {
  const location = useLocation()
  const navigate = useNavigate()

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/staff/login')
  }

  return (
    <div className="bg-navy px-6 py-3 mb-6 flex items-center justify-between flex-wrap gap-3">
      <div className="flex items-center gap-3">
        <img src="/omnicargo-logo.png" alt="OmniCargo" className="h-7" />
        <span className="text-white/40 text-sm">Management</span>
      </div>
      <div className="flex items-center gap-1 flex-wrap">
        <Link to="/staff/shipments" className="flex items-center gap-2 px-4 py-2 rounded-full text-sm text-white/60 hover:text-white/90">
          <ArrowLeft size={16} />
          Back to staff
        </Link>
        {LINKS.map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              location.pathname === to ? 'bg-orange text-white shadow-sm' : 'text-white/70 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Icon size={16} />
            {label}
          </Link>
        ))}
        <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 rounded-full text-sm text-white/50 hover:text-white/80">
          <LogOut size={16} />
          Log out
        </button>
      </div>
    </div>
  )
}
