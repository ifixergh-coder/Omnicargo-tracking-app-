import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import DriverNav from '../components/DriverNav'

type Vehicle = { id: string; label: string; plate_number: string | null; vehicle_type: string | null }

const LOCATIONS = ['Accra', 'Tema', 'Kumasi', 'Takoradi', 'Cape Coast', 'Tamale', 'Ho', 'Koforidua', 'Sunyani', 'Techiman', 'Wa', 'Bolgatanga']

export default function DriverPage() {
  const [ownVehicle, setOwnVehicle] = useState<Vehicle | null>(null)
  const [pendingApproval, setPendingApproval] = useState(false)
  const [noRequestFound, setNoRequestFound] = useState(false)
  const [origin, setOrigin] = useState('')
  const [destination, setDestination] = useState('')
  const [customDestination, setCustomDestination] = useState('')
  const [sharing, setSharing] = useState(false)
  const [tripId, setTripId] = useState<number | null>(null)
  const [lastSent, setLastSent] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const [showPinPrompt, setShowPinPrompt] = useState(false)
  const [pinInput, setPinInput] = useState('')
  const [pinError, setPinError] = useState<string | null>(null)
  const [verifyingPin, setVerifyingPin] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { setLoading(false); return }

      const { data: myVehicle } = await supabase
        .from('vehicles').select('id, label, plate_number, vehicle_type')
        .eq('driver_user_id', data.user.id).maybeSingle()
      if (myVehicle) {
        setOwnVehicle(myVehicle as Vehicle)
        setLoading(false)
        return
      }

      const { data: pendingRequest } = await supabase
        .from('driver_signup_requests').select('id').eq('user_id', data.user.id).eq('status', 'pending').maybeSingle()
      if (pendingRequest) {
        setPendingApproval(true)
      } else {
        setNoRequestFound(true)
      }
      setLoading(false)
    })
  }, [])

  async function startSharing() {
    if (!ownVehicle) return
    const finalDestination = destination === 'Other' ? customDestination : destination
    const { data, error: tripError } = await supabase
      .from('trips')
      .insert({ vehicle_id: ownVehicle.id, origin: origin || null, destination: finalDestination || null })
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
    if (!sharing || !ownVehicle) return
    if (!('geolocation' in navigator)) {
      setError('This device does not support location sharing.')
      setSharing(false)
      return
    }
    const watchId = navigator.geolocation.watchPosition(
      async (pos) => {
        const { latitude, longitude, heading, speed } = pos.coords
        const { error: insertError } = await supabase.from('location_updates').insert({
          vehicle_id: ownVehicle.id, source: 'phone', lat: latitude, lng: longitude,
          heading: heading ?? null, speed: speed ?? null, trip_id: tripId,
        })
        if (insertError) setError(insertError.message)
        else { setError(null); setLastSent(new Date().toLocaleTimeString()) }
      },
      (err) => setError(err.message),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 },
    )
    return () => navigator.geolocation.clearWatch(watchId)
  }, [sharing, ownVehicle, tripId])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <DriverNav />
        <p className="text-center text-slate mt-12">Loading…</p>
      </div>
    )
  }

  if (pendingApproval) {
    return (
      <div className="min-h-screen bg-gray-50">
        <DriverNav />
        <div className="max-w-sm mx-auto px-6 py-12 text-center">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <p className="text-navy font-semibold mb-2">Your account is pending approval</p>
            <p className="text-sm text-slate">
              A manager needs to assign you a vehicle before you can start sharing location or scanning packages. Check back soon.
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (noRequestFound) {
    return (
      <div className="min-h-screen bg-gray-50">
        <DriverNav />
        <div className="max-w-sm mx-auto px-6 py-12 text-center">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <p className="text-navy font-semibold mb-2">No vehicle assigned</p>
            <p className="text-sm text-slate">
              We couldn't find a sign-up request or vehicle for your account. Ask a manager to check, or sign up again at /driver/signup with a fresh code.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DriverNav />
      <div className="max-w-sm mx-auto px-6 py-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <span className={`w-2.5 h-2.5 rounded-full ${sharing ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} />
            <span className="font-semibold text-navy">
              {sharing ? 'Location sharing active' : 'Location sharing off'}
            </span>
          </div>

          {ownVehicle && (
            <div className="bg-gray-50 rounded-md p-3 mb-4 text-sm">
              <p className="text-navy font-medium">{ownVehicle.label} {ownVehicle.vehicle_type && `(${ownVehicle.vehicle_type})`}</p>
              <p className="text-slate text-xs mt-0.5">Plate: {ownVehicle.plate_number ?? 'Not set'}</p>
            </div>
          )}

          {!sharing ? (
            <>
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

              <button onClick={startSharing} className="w-full bg-orange text-white font-medium py-3 rounded-md mt-2">
                Start sharing location
              </button>
            </>
          ) : (
            <>
              <p className="text-sm text-slate mb-4">
                Route: {origin || '—'} → {destination === 'Other' ? customDestination : destination || '—'}
              </p>
              <button onClick={requestStop} className="w-full bg-navy text-white font-medium py-3 rounded-md">
                Stop sharing
              </button>
              <p className="text-xs text-green-600 mt-3">
                Last update sent: {lastSent ?? 'sending…'}. Keep this page open while on delivery.
              </p>
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
    </div>
  )
}
