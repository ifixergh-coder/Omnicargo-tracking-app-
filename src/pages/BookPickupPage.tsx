import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import LocationSearch from '../components/LocationSearch'
import PublicNav from '../components/PublicNav'
import { reverseGeocode } from '../lib/reverseGeocode'

export default function BookPickupPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [senderName, setSenderName] = useState('')
  const [senderPhone, setSenderPhone] = useState('')
  const [senderEmail, setSenderEmail] = useState('')
  const [recipientName, setRecipientName] = useState('')
  const [recipientPhone, setRecipientPhone] = useState('')
  const [recipientEmail, setRecipientEmail] = useState('')

  const [pickupAddress, setPickupAddress] = useState('')
  const [pickupLat, setPickupLat] = useState<number | null>(null)
  const [pickupLng, setPickupLng] = useState<number | null>(null)
  const [locatingPickup, setLocatingPickup] = useState(false)

  const [destinationAddress, setDestinationAddress] = useState('')
  const [destinationLat, setDestinationLat] = useState<number | null>(null)
  const [destinationLng, setDestinationLng] = useState<number | null>(null)
  const [locatingDestination, setLocatingDestination] = useState(false)
  const [destinationGps, setDestinationGps] = useState('')

  const [cbmMode, setCbmMode] = useState<'dimensions' | 'direct'>('dimensions')
  const [directCbm, setDirectCbm] = useState('')
  const [lengthCm, setLengthCm] = useState('')
  const [widthCm, setWidthCm] = useState('')
  const [heightCm, setHeightCm] = useState('')
  const [weightKg, setWeightKg] = useState('')
  const [boxCount, setBoxCount] = useState('1')
  const [packageDescription, setPackageDescription] = useState('')
  const [prefilledFromCalculator, setPrefilledFromCalculator] = useState(false)

  useEffect(() => {
    if (searchParams.has('cbmMode')) {
      setCbmMode(searchParams.get('cbmMode') === 'direct' ? 'direct' : 'dimensions')
      setDirectCbm(searchParams.get('cbm') ?? '')
      setLengthCm(searchParams.get('lengthCm') ?? '')
      setWidthCm(searchParams.get('widthCm') ?? '')
      setHeightCm(searchParams.get('heightCm') ?? '')
      setWeightKg(searchParams.get('weightKg') ?? '')
      setBoxCount(searchParams.get('boxCount') ?? '1')
      setPrefilledFromCalculator(true)
    }
  }, [searchParams])

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function useCurrentLocation(target: 'pickup' | 'destination') {
    if (!('geolocation' in navigator)) {
      setError('Your device does not support location sharing.')
      return
    }
    const setLocating = target === 'pickup' ? setLocatingPickup : setLocatingDestination
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords
        const address = await reverseGeocode(latitude, longitude)
        if (target === 'pickup') {
          setPickupLat(latitude)
          setPickupLng(longitude)
          setPickupAddress(address)
        } else {
          setDestinationLat(latitude)
          setDestinationLng(longitude)
          setDestinationAddress(address)
        }
        setLocating(false)
      },
      () => {
        setError(
          'Could not get your location. On iPhone/iPad: check Settings → Privacy & Security → Location Services is on, and Settings → Safari → Location is not set to "Never". Or search for a landmark instead.',
        )
        setLocating(false)
      },
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)

    try {
      const res = await fetch('/api/book-pickup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderName, senderPhone, senderEmail,
          recipientName, recipientPhone, recipientEmail,
          pickupAddress, pickupLat, pickupLng,
          destinationAddress, destinationLat, destinationLng, destinationGps,
          cbmMode, directCbm, lengthCm, widthCm, heightCm, weightKg, boxCount,
          packageDescription,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Something went wrong. Please try again.')
      } else {
        navigate(`/book-pickup/confirmed?tracking=${data.trackingNumber}`)
      }
    } catch {
      setError('Could not reach the server. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PublicNav />
      <div className="max-w-lg mx-auto px-6 py-12">
        <h1 className="text-2xl font-bold text-navy mb-2">Book a pickup</h1>
        <p className="text-slate mb-2">No account needed. Our team will confirm your pickup shortly after you submit.</p>
        {prefilledFromCalculator && (
          <p className="text-sm text-orange bg-orange/10 rounded-md p-2 mb-4">
            Package details carried over from your cost estimate — no need to re-enter them below.
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <section className="bg-white rounded-lg p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-slate uppercase mb-3">Your details (sender)</h2>
            <input placeholder="Your name" value={senderName} onChange={e => setSenderName(e.target.value)} required className="w-full border rounded-md px-3 py-2 mb-2" />
            <input placeholder="Your phone number" value={senderPhone} onChange={e => setSenderPhone(e.target.value)} required className="w-full border rounded-md px-3 py-2 mb-2" />
            <input placeholder="Your email (optional)" value={senderEmail} onChange={e => setSenderEmail(e.target.value)} className="w-full border rounded-md px-3 py-2" />
          </section>

          <section className="bg-white rounded-lg p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-slate uppercase mb-3">Recipient details</h2>
            <input placeholder="Recipient name" value={recipientName} onChange={e => setRecipientName(e.target.value)} required className="w-full border rounded-md px-3 py-2 mb-2" />
            <input placeholder="Recipient phone" value={recipientPhone} onChange={e => setRecipientPhone(e.target.value)} className="w-full border rounded-md px-3 py-2 mb-2" />
            <input placeholder="Recipient email (optional)" value={recipientEmail} onChange={e => setRecipientEmail(e.target.value)} className="w-full border rounded-md px-3 py-2" />
          </section>

          <section className="bg-white rounded-lg p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-slate uppercase mb-3">Where should we pick up?</h2>
            <button
              type="button"
              onClick={() => useCurrentLocation('pickup')}
              disabled={locatingPickup}
              className="w-full bg-navy text-white font-medium py-2.5 rounded-md mb-3 disabled:opacity-50"
            >
              {locatingPickup ? 'Getting your location…' : 'Use my current location'}
            </button>
            <p className="text-xs text-slate mb-2 text-center">— or —</p>
            <LocationSearch
              placeholder="Search for a landmark or address"
              onSelect={({ address, lat, lng }) => {
                setPickupAddress(address)
                setPickupLat(lat)
                setPickupLng(lng)
              }}
            />
            {pickupAddress && (
              <p className="text-sm text-slate mt-2">Pickup location: <span className="font-medium text-navy">{pickupAddress}</span></p>
            )}
          </section>

          <section className="bg-white rounded-lg p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-slate uppercase mb-3">Where should we deliver to?</h2>
            <p className="text-xs text-slate mb-3">If you're booking on the recipient's behalf, you can use their current location too.</p>
            <button
              type="button"
              onClick={() => useCurrentLocation('destination')}
              disabled={locatingDestination}
              className="w-full bg-navy text-white font-medium py-2.5 rounded-md mb-3 disabled:opacity-50"
            >
              {locatingDestination ? 'Getting location…' : 'Use current location'}
            </button>
            <p className="text-xs text-slate mb-2 text-center">— or —</p>
            <LocationSearch
              placeholder="Search for a landmark or address"
              onSelect={({ address, lat, lng }) => {
                setDestinationAddress(address)
                setDestinationLat(lat)
                setDestinationLng(lng)
              }}
            />
            {destinationAddress && (
              <p className="text-sm text-slate mt-2 mb-3">Delivery location: <span className="font-medium text-navy">{destinationAddress}</span></p>
            )}
            <input
              placeholder="GhanaPostGPS (optional)"
              value={destinationGps}
              onChange={e => setDestinationGps(e.target.value)}
              className="w-full border rounded-md px-3 py-2"
            />
          </section>

          <section className="bg-white rounded-lg p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-slate uppercase mb-3">Package details</h2>
            <div className="flex gap-2 mb-3">
              <button type="button" onClick={() => setCbmMode('dimensions')} className={`flex-1 py-2 rounded-md text-sm font-medium ${cbmMode === 'dimensions' ? 'bg-navy text-white' : 'bg-gray-100 text-slate'}`}>
                Enter dimensions
              </button>
              <button type="button" onClick={() => setCbmMode('direct')} className={`flex-1 py-2 rounded-md text-sm font-medium ${cbmMode === 'direct' ? 'bg-navy text-white' : 'bg-gray-100 text-slate'}`}>
                I know my CBM
              </button>
            </div>
            {cbmMode === 'dimensions' ? (
              <div className="grid grid-cols-3 gap-2 mb-2">
                <input placeholder="Length (cm)" value={lengthCm} onChange={e => setLengthCm(e.target.value)} className="border rounded-md px-3 py-2" />
                <input placeholder="Width (cm)" value={widthCm} onChange={e => setWidthCm(e.target.value)} className="border rounded-md px-3 py-2" />
                <input placeholder="Height (cm)" value={heightCm} onChange={e => setHeightCm(e.target.value)} className="border rounded-md px-3 py-2" />
              </div>
            ) : (
              <input placeholder="CBM (m³)" value={directCbm} onChange={e => setDirectCbm(e.target.value)} className="w-full border rounded-md px-3 py-2 mb-2" />
            )}
            <input placeholder="Weight (kg)" value={weightKg} onChange={e => setWeightKg(e.target.value)} className="w-full border rounded-md px-3 py-2 mb-2" />
            <label className="block text-sm font-medium text-slate mb-1">Number of boxes / items</label>
            <input type="number" min="1" value={boxCount} onChange={e => setBoxCount(e.target.value)} className="w-full border rounded-md px-3 py-2 mb-2" />
            <input placeholder="Package description" value={packageDescription} onChange={e => setPackageDescription(e.target.value)} className="w-full border rounded-md px-3 py-2" />
          </section>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button type="submit" disabled={saving || !pickupAddress} className="w-full bg-orange text-white font-medium py-3 rounded-md disabled:opacity-50">
            {saving ? 'Submitting…' : 'Request pickup'}
          </button>
        </form>
      </div>
    </div>
  )
}
