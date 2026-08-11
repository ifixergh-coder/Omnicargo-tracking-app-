import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

type Vehicle = {
  id: string
  label: string
  tracking_source: string
}

export default function DriverPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [selectedVehicle, setSelectedVehicle] = useState('')
  const [sharing, setSharing] = useState(false)
  const [lastSent, setLastSent] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    supabase
      .from('vehicles')
      .select('id, label, tracking_source')
      .eq('active', true)
      .eq('tracking_source', 'phone') // hardware-tracked vehicles don't need this page
      .then(({ data }) => setVehicles((data as Vehicle[]) ?? []))
  }, [])

  useEffect(() => {
    if (!sharing || !selectedVehicle) return

    if (!('geolocation' in navigator)) {
      setError('This device does not support location sharing.')
      setSharing(false)
      return
    }

    const watchId = navigator.geolocation.watchPosition(
      async (pos) => {
        const { latitude, longitude, heading, speed } = pos.coords
        const { error: insertError } = await supabase.from('location_updates').insert({
          vehicle_id: selectedVehicle,
          source: 'phone',
          lat: latitude,
          lng: longitude,
          heading: heading ?? null,
          speed: speed ?? null,
        })
        if (insertError) {
          setError(insertError.message)
        } else {
          setError(null)
          setLastSent(new Date().toLocaleTimeString())
        }
      },
      (err) => setError(err.message),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 },
    )

    return () => navigator.geolocation.clearWatch(watchId)
  }, [sharing, selectedVehicle])

  return (
    <div className="min-h-screen bg-navy flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center gap-2 mb-6">
          <span className="w-2.5 h-2.5 rounded-full bg-orange" />
          <span className="font-semibold text-navy">Driver location sharing</span>
        </div>

        <label className="block text-sm font-medium text-slate mb-2">Which vehicle are you driving?</label>
        <select
          value={selectedVehicle}
          onChange={(e) => setSelectedVehicle(e.target.value)}
          disabled={sharing}
          className="w-full border border-gray-300 rounded-md px-4 py-3 mb-4 text-navy"
        >
          <option value="">Select vehicle…</option>
          {vehicles.map((v) => (
            <option key={v.id} value={v.id}>
              {v.label}
            </option>
          ))}
        </select>

        {!sharing ? (
          <button
            onClick={() => setSharing(true)}
            disabled={!selectedVehicle}
            className="w-full bg-orange text-white font-medium py-3 rounded-md disabled:opacity-40"
          >
            Start sharing location
          </button>
        ) : (
          <button
            onClick={() => setSharing(false)}
            className="w-full bg-navy text-white font-medium py-3 rounded-md"
          >
            Stop sharing
          </button>
        )}

        {sharing && (
          <p className="text-xs text-green-600 mt-3">
            Sharing live — last update {lastSent ?? 'sending…'}. Keep this page open while on delivery.
          </p>
        )}
        {error && <p className="text-xs text-red-600 mt-3">{error}</p>}
      </div>
    </div>
  )
}
