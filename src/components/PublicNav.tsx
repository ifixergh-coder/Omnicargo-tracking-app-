import { Link } from 'react-router-dom'

export default function PublicNav() {
  return (
    <div className="bg-navy px-6 py-4 flex items-center justify-between">
      <Link to="/" className="flex items-center gap-2">
        <img src="/omnicargo-logo.png" alt="OmniCargo" className="h-8" />
      </Link>
      <div className="flex items-center gap-5 text-sm">
        <Link to="/about" className="text-white/80 hover:text-white">About</Link>
        <Link to="/calculator" className="text-white/80 hover:text-white">Calculate cost</Link>
        <Link to="/book-pickup" className="text-white/80 hover:text-white">Book a pickup</Link>
        <Link to="/track" className="text-white/80 hover:text-white">Track shipment</Link>
        <Link to="/contact" className="text-white/80 hover:text-white">Contact</Link>
      </div>
    </div>
  )
}
