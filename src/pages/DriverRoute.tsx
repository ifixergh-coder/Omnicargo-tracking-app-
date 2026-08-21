import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { orderByProximity, distanceKm } from '../lib/geo'
import DriverNav from '../components/DriverNav'

type Stop = {
  shipmentId: string
  trackingNumber: string
  kind: 'pickup' | 'delivery'
  label: string
  address: string | null
  lat: number | null
  lng: number | null
}

export default function DriverRoute() {
  const [stops, setStops] = useState<Stop[]>([])
  const [currentLat, setCurrentLat] = useState<number | null>(null)
  const [currentLng, setCurrentLng] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [locating, setLocating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function loadStops() {
    setLoading(true)
    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) { setLoading(false); return }

    const { data: vehicle } = await supabase.from('vehicles').select('id').eq('driver_user_id', userData.user.id).maybeSingle()
    if (!vehicle) { setLoading(false); return }

    const { data: shipments } = await supabase
      .from('shipments')
      .select('id, tracking_number, status, sender_name, recipient_name, pickup_location, pickup_lat, pickup_lng, destination_address, destination_lat, destination_lng')
      .eq('assigned_vehicle_id', vehicle.id)
      .not('status', 'in', '("delivered","cancelled","failed")')

    const built: Stop[] = []
    for (const s of shipments ?? []) {
      if (s.status === 'pending' && s.pickup_lat != null) {
        built.push({
          shipmentId: s.id, trackingNumber: s.tracking_number, kind: 'pickup',
          label: `Pick up from ${s.sender_name}`, address: s.pickup_location,
          lat: s.pickup_lat, lng: s.pickup_lng,
        })
      } else if (s.destination_lat != null) {
        built.push({
          shipmentId: s.id, trackingNumber: s.tracking_number, kind: 'delivery',
          label: `Deliver to ${s.recipient_name}`, address: s.destination_address,
          lat: s.destination_lat, lng: s.destination_lng,
        })
      }
    }
    setStops(built)
    setLoading(false)
  }

  useEffect(() => { loadStops() }, [])

  function useCurrentLocation() {
    if (!('geolocation' in navigator)) {
      setError('This device does not support location.')
      return
    }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCurrentLat(pos.coords.latitude)
        setCurrentLng(pos.coords.longitude)
        setLocating(false)
      },
      () => { setError('Could not get your location.'); setLocating(false) },
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }

  const orderedStops = currentLat != null && currentLng != null
    ? orderByProximity(currentLat, currentLng, stops)
    : stops

  return (
    <div className="min-h-screen bg-gray-50">
      <DriverNav />
      <div className="max-w-md mx-auto px-6 pb-8">
        <h1 className="text-xl font-semibold text-navy mt-2 mb-2">Today's route</h1>
        <p className="text-sm text-slate mb-4">
          Stops ordered by distance from your current position — always showing the nearest one next.
        </p>

        <button onClick={useCurrentLocation} disabled={locating} className="w-full bg-navy text-white font-medium py-3 rounded-md mb-4 disabled:opacity-50">
          {locating ? 'Getting your location…' : currentLat ? 'Refresh my location' : 'Use my current location to order stops'}
        </button>
        {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

        {loading && <p className="text-sm text-slate">Loading…</p>}
        {!loading && orderedStops.length === 0 && <p className="text-sm text-slate">No pending pickups or deliveries assigned to you right now.</p>}

        <div className="space-y-2">
          {orderedStops.map((stop, i) => {
            const dist = currentLat != null && currentLng != null && stop.lat != null && stop.lng != null
              ? distanceKm(currentLat, currentLng, stop.lat, stop.lng)
              : null
            return (
              <Link key={stop.shipmentId + stop.kind} to={`/staff/scan/${stop.trackingNumber}`} className="block bg-white rounded-lg shadow-sm p-4">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-orange text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <p className={`text-xs font-semibold uppercase ${stop.kind === 'pickup' ? 'text-navy' : 'text-orange'}`}>
                      {stop.kind === 'pickup' ? 'Pickup' : 'Delivery'}
                    </p>
                    <p className="text-sm font-medium text-navy">{stop.label}</p>
                    {stop.address && <p className="text-xs text-slate mt-0.5">{stop.address}</p>}
                    <p className="font-mono text-xs text-slate mt-1">{stop.trackingNumber}</p>
                    {dist != null && <p className="text-xs text-orange mt-1">{dist.toFixed(1)} km away</p>}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
