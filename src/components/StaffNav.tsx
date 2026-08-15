import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Package, PlusCircle, Truck, ScanLine, LogOut, Boxes, ClipboardList, Users, ShieldCheck } from 'lucide-react'
import { supabase } from '../lib/supabase'

const LINKS = [
  { to: '/staff/shipments', label: 'Shipments', icon: Package },
  { to: '/staff/shipments/new', label: 'New', icon: PlusCircle },
  { to: '/staff/batches', label: 'Batches', icon: Boxes },
  { to: '/staff/vehicles', label: 'Vehicles', icon: Truck },
  { to: '/staff/scan', label: 'Scan', icon: ScanLine },
]

export default function StaffNav() {
  const location = useLocation()
  const navigate = useNavigate()

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/staff/login')
  }

  const isActive = (to: string) =>
    to === '/staff/shipments' ? location.pathname === to : location.pathname.startsWith(to)

  return (
    <>
      <div className="hidden md:flex items-center justify-between bg-navy px-6 py-3 mb-6">
        <div className="flex items-center gap-3">
          <img src="/omnicargo-logo.png" alt="OmniCargo" className="h-7" />
          <span className="text-white/40 text-sm">Staff</span>
        </div>
        <div className="flex items-center gap-1">
          {LINKS.map(({ to, label, icon: Icon }) => (
            <Link key={to} to={to} className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${isActive(to) ? 'bg-orange text-white shadow-sm' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}>
              <Icon size={16} />
              {label}
            </Link>
          ))}
          <Link to="/staff/customers" className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${isActive('/staff/customers') ? 'bg-orange text-white shadow-sm' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}>
            <Users size={16} />
            Customers
          </Link>
          <Link to="/staff/waybill/daily" className="flex items-center gap-2 px-4 py-2 rounded-full text-sm text-white/70 hover:bg-white/10 hover:text-white">
            <ClipboardList size={16} />
            Daily list
          </Link>
          <Link to="/management" className="flex items-center gap-2 px-4 py-2 rounded-full text-sm text-white/70 hover:bg-white/10 hover:text-white">
            <ShieldCheck size={16} />
            Management
          </Link>
          <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 rounded-full text-sm text-white/50 hover:text-white/80 transition-colors">
            <LogOut size={16} />
            Log out
          </button>
        </div>
      </div>

      <div className="flex md:hidden items-center justify-between bg-navy px-4 py-3 mb-4">
        <img src="/omnicargo-logo.png" alt="OmniCargo" className="h-6" />
        <div className="flex items-center gap-3">
          <Link to="/staff/customers" className="text-white/60 text-xs">Customers</Link>
          <Link to="/staff/waybill/daily" className="text-white/60 text-xs">Daily list</Link>
          <Link to="/management" className="text-white/60 text-xs">Management</Link>
          <button onClick={handleLogout} className="text-white/60 text-xs flex items-center gap-1">
            <LogOut size={14} />
            Log out
          </button>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 md:hidden bg-navy border-t border-white/10 flex items-center justify-around py-2 z-50">
        {LINKS.map(({ to, label, icon: Icon }) => (
          <Link key={to} to={to} className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl transition-colors ${isActive(to) ? 'text-orange' : 'text-white/60'}`}>
            <div className={`p-1.5 rounded-full ${isActive(to) ? 'bg-orange/15' : ''}`}>
              <Icon size={18} />
            </div>
            <span className="text-[9px] font-medium">{label}</span>
          </Link>
        ))}
      </div>
    </>
  )
}
