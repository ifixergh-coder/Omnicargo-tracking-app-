import { Link, useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const LINKS = [
  { to: '/account', label: 'My orders' },
  { to: '/account/addresses', label: 'Saved addresses' },
  { to: '/account/profile', label: 'Profile' },
]

export default function CustomerNav() {
  const location = useLocation()
  const navigate = useNavigate()

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/')
  }

  return (
    <div className="bg-navy px-6 py-3 mb-6 flex items-center justify-between flex-wrap gap-2">
      <img src="/omnicargo-logo.png" alt="OmniCargo" className="h-7" />
      <div className="flex items-center gap-4 flex-wrap">
        {LINKS.map((l) => (
          <Link key={l.to} to={l.to} className={`text-sm ${location.pathname === l.to ? 'text-orange font-semibold' : 'text-white/80'}`}>
            {l.label}
          </Link>
        ))}
        <button onClick={handleLogout} className="text-sm text-white/50">Log out</button>
      </div>
    </div>
  )
}
