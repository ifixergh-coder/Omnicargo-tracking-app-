import { useSearchParams, Link } from 'react-router-dom'
import PublicNav from '../components/PublicNav'

export default function BookPickupConfirmedPage() {
  const [params] = useSearchParams()
  const tracking = params.get('tracking')

  return (
    <div className="min-h-screen bg-gray-50">
      <PublicNav />
      <div className="max-w-md mx-auto px-6 py-16 text-center">
        <div className="w-3 h-3 rounded-full bg-orange mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-navy mb-2">Pickup requested</h1>
        <p className="text-slate mb-6">
          Our team has received your request and will contact you shortly to confirm the pickup.
        </p>
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <p className="text-xs uppercase text-slate mb-1">Your tracking number</p>
          <p className="font-mono font-bold text-lg text-navy">{tracking}</p>
        </div>
        <Link to={`/track/${tracking}`} className="text-orange underline">
          Track this shipment
        </Link>
      </div>
    </div>
  )
}
