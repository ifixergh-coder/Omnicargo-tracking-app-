import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

type Vehicle = { id: string; label: string; tracking_source: string }

const LOCATIONS = ['Accra', 'Tema', 'Kumasi', 'Takoradi', 'Cape Coast', 'Tamale', 'Ho', 'Koforidua', 'Sunyani', 'Techiman', 'Wa', 'Bolgatanga']

export default function DriverPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [ownVehicle, setOwnVehicle] = useState<Vehicle | null>(null)
  const [selectedVehicle, setSelectedVehicle] = useState('')
  const [origin, setOrigin] = useState('')
  const [destination, setDestination] = useState('')
  const [customDestination, setCustomDestination] = useState('')
  const [sharing, setSharing] = useState(false)
  const [tripId, setTripId] = useState<number | null>(null)
  const [lastSent, setLastSent] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [showPinPrompt, setShowPinPrompt] = useState(false)
  const [pinInput, setPinInput] = useState('')
  const [pinError, setPinError] = useState<string | null>(null)
  const [verifyingPin, setVerifyingPin] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (data.user) {
        const { data: myVehicle } = await supabase
          .from('vehicles').select('id, label, tracking_source')
          .eq('driver_user_id', data.user.id).maybeSingle()
        if (myVehicle) {
          setOwnVehicle(myVehicle as Vehicle)
          setSelectedVehicle((myVehicle as Vehicle).id)
          return
        }
      }
      supabase.from('vehicles').select('id, label, tracking_source').eq('active', true).eq('tracking_source', 'phone')
        .then(({ data }) => setVehicles((data as Vehicle[]) ?? []))
    })
  }, [])

  async function startSharing() {
    const finalDestination = destination === 'Other' ? customDestination : destination
    const { data, error: tripError } = await supabase
      .from('trips')
      .insert({ vehicle_id: selectedVehicle, origin: origin || null, destination: finalDestination || null })
      .select()
    if (tripError) { setError(tripError.message); return }
    setTripId((data as any)?.[0]?.id ?? null)
    setSharing(true)
  }

  function requestStop() {
    setShowPinPrompt(true)
    setPinInput('')
    setPinError(null)
  }

  async function confirmStop() {
    setVerifyingPin(true)
    setPinError(null)
    const { data, error: rpcError } = await supabase.rpc('verify_manager_pin', { input_pin: pinInput })
    setVerifyingPin(false)
    if (rpcError || data !== true) {
      setPinError('Incorrect PIN. Ask a manager for the code to stop sharing.')
      return
    }
    if (tripId) await supabase.from('trips').update({ ended_at: new Date().toISOString() }).eq('id', tripId)
    setSharing(false)
    setShowPinPrompt(false)
    setTripId(null)
  }

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
          vehicle_id: selectedVehicle, source: 'phone', lat: latitude, lng: longitude,
          heading: heading ?? null, speed: speed ?? null, trip_id: tripId,
        })
        if (insertError) setError(insertError.message)
        else { setError(null); setLastSent(new Date().toLocaleTimeString()) }
      },
      (err) => setError(err.message),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 },
    )
    return () => navigator.geolocation.clearWatch(watchId)
  }, [sharing, selectedVehicle, tripId])

  return (
    <div className="min-h-screen bg-navy flex flex-col items-center justify-center px-6 py-8">
      <div className="w-full max-w-sm bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-orange" />
            <span className="font-semibold text-navy">Driver location sharing</span>
          </div>
          <a href="/staff/scan" className="text-xs text-orange underline">Scan a package</a>
        </div>

        {!sharing ? (
          <>
            {ownVehicle ? (
              <p className="text-sm text-slate mb-4">Vehicle: <span className="font-medium text-navy">{ownVehicle.label}</span></p>
            ) : (
              <>
                <label className="block text-sm font-medium text-slate mb-2">Which vehicle are you driving?</label>
                <select value={selectedVehicle} onChange={(e) => setSelectedVehicle(e.target.value)} className="w-full border border-gray-300 rounded-md px-4 py-3 mb-4 text-navy">
                  <option value="">Select vehicle…</option>
                  {vehicles.map((v) => <option key={v.id} value={v.id}>{v.label}</option>)}
                </select>
              </>
            )}

            <label className="block text-sm font-medium text-slate mb-2">From</label>
            <select value={origin} onChange={(e) => setOrigin(e.target.value)} className="w-full border border-gray-300 rounded-md px-4 py-3 mb-4 text-navy">
              <option value="">Select origin…</option>
              {LOCATIONS.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>

            <label className="block text-sm font-medium text-slate mb-2">To</label>
            <select value={destination} onChange={(e) => setDestination(e.target.value)} className="w-full border border-gray-300 rounded-md px-4 py-3 mb-2 text-navy">
              <option value="">Select destination…</option>
              {LOCATIONS.map((l) => <option key={l} value={l}>{l}</option>)}
              <option value="Other">Other (specific location)</option>
            </select>
            {destination === 'Other' && (
              <input placeholder="Enter specific destination" value={customDestination} onChange={(e) => setCustomDestination(e.target.value)} className="w-full border border-gray-300 rounded-md px-4 py-3 mb-4 text-navy" />
            )}

            <button onClick={startSharing} disabled={!selectedVehicle} className="w-full bg-orange text-white font-medium py-3 rounded-md disabled:opacity-40 mt-2">
              Start sharing location
            </button>
          </>
        ) : (
          <>
            <p className="text-sm text-slate mb-4">{origin || '—'} → {destination === 'Other' ? customDestination : destination || '—'}</p>
            <button onClick={requestStop} className="w-full bg-navy text-white font-medium py-3 rounded-md">Stop sharing</button>
            <p className="text-xs text-green-600 mt-3">Sharing live — last update {lastSent ?? 'sending…'}. Keep this page open while on delivery.</p>
          </>
        )}

        {error && <p className="text-xs text-red-600 mt-3">{error}</p>}

        {showPinPrompt && (
          <div className="mt-4 border-t pt-4">
            <p className="text-sm font-medium text-navy mb-2">Manager PIN required to stop sharing</p>
            <input type="password" inputMode="numeric" placeholder="Enter PIN" value={pinInput} onChange={(e) => setPinInput(e.target.value)} className="w-full border border-gray-300 rounded-md px-4 py-3 mb-2 text-navy" />
            {pinError && <p className="text-xs text-red-600 mb-2">{pinError}</p>}
            <div className="flex gap-2">
              <button onClick={() => setShowPinPrompt(false)} className="flex-1 border border-gray-300 text-slate py-2 rounded-md text-sm">Cancel</button>
              <button onClick={confirmStop} disabled={verifyingPin} className="flex-1 bg-orange text-white py-2 rounded-md text-sm disabled:opacity-50">
                {verifyingPin ? 'Checking…' : 'Confirm'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
