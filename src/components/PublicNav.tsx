import { Link, useLocation } from 'react-router-dom'

const LINKS = [
  { to: '/about', label: 'About' },
  { to: '/calculator', label: 'Calculate cost' },
  { to: '/book-pickup', label: 'Book a pickup' },
  { to: '/', label: 'Track shipment' },
  { to: '/contact', label: 'Contact' },
]

export default function PublicNav() {
  const location = useLocation()

  return (
    <div className="bg-navy px-6 py-4 flex items-center justify-between flex-wrap gap-2">
      <Link to="/" className="flex items-center gap-2">
        <img src="/omnicargo-logo.png" alt="OmniCargo" className="h-8" />
      </Link>
      <div className="flex items-center gap-1 text-sm flex-wrap">
        {LINKS.map((l) => (
          <Link
            key={l.to + l.label}
            to={l.to}
            className={`px-3 py-1.5 rounded-full ${
              location.pathname === l.to ? 'bg-orange text-white font-medium' : 'text-white/80 hover:text-white'
            }`}
          >
            {l.label}
          </Link>
        ))}
        <Link to="/login" className="px-3 py-1.5 rounded-full text-orange font-medium border border-orange ml-2">
          Log in
        </Link>
        <Link to="/account" className="px-3 py-1.5 rounded-full text-white/80 hover:text-white">
          My account
        </Link>
      </div>
    </div>
  )
}
