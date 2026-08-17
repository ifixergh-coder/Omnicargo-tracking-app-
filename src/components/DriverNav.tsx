import { Link, useLocation, useNavigate } from 'react-router-dom'
import { LayoutDashboard, MapPin, Boxes, Route as RouteIcon, ScanLine, User, LogOut } from 'lucide-react'
import { supabase } from '../lib/supabase'

const LINKS = [
  { to: '/driver/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/driver', label: 'Location', icon: MapPin },
  { to: '/driver/batch', label: 'Today', icon: Boxes },
  { to: '/driver/route', label: 'Route', icon: RouteIcon },
  { to: '/staff/scan', label: 'Scan', icon: ScanLine },
]

export default function DriverNav() {
  const location = useLocation()
  const navigate = useNavigate()

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/driver/login')
  }

  const isActive = (to: string) => location.pathname === to

  return (
    <div className="bg-navy px-4 py-3 mb-4 flex items-center justify-between flex-wrap gap-2">
      <div className="flex items-center gap-2">
        <img src="/omnicargo-logo.png" alt="OmniCargo" className="h-6" />
        <span className="text-white/40 text-xs">Driver</span>
      </div>
      <div className="flex items-center gap-3 flex-wrap">
        {LINKS.map(({ to, label, icon: Icon }) => (
          <Link key={to} to={to} className={`flex items-center gap-1 text-xs ${isActive(to) ? 'text-orange font-semibold' : 'text-white/70'}`}>
            <Icon size={14} />
            {label}
          </Link>
        ))}
        <Link to="/driver/profile" className={`flex items-center gap-1 text-xs ${isActive('/driver/profile') ? 'text-orange font-semibold' : 'text-white/70'}`}>
          <User size={14} />
          Profile
        </Link>
        <button onClick={handleLogout} className="flex items-center gap-1 text-xs text-white/50">
          <LogOut size={14} />
          Log out
        </button>
      </div>
    </div>
  )
}
