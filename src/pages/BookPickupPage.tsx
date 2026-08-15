import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import LocationSearch from '../components/LocationSearch'
import PublicNav from '../components/PublicNav'

export default function BookPickupPage() {
  const navigate = useNavigate()
  const [senderName, setSenderName] = useState('')
  const [senderPhone, setSenderPhone] = useState('')
  const [senderEmail, setSenderEmail] = useState('')
  const [recipientName, setRecipientName] = useState('')
  const [recipientPhone, setRecipientPhone] = useState('')
  const [recipientEmail, setRecipientEmail] = useState('')

  const [pickupAddress, setPickupAddress] = useState('')
  const [pickupLat, setPickupLat] = useState<number | null>(null)
  const [pickupLng, setPickupLng] = useState<number | null>(null)
  const [locatingDevice, setLocatingDevice] = useState(false)

  const [destinationAddress, setDestinationAddress] = useState('')
  const [destinationGps, setDestinationGps] = useState('')
  const [lengthCm, setLengthCm] = useState('')
  const [widthCm, setWidthCm] = useState('')
  const [heightCm, setHeightCm] = useState('')
  const [weightKg, setWeightKg] = useState('')
  const [packageDescription, setPackageDescription] = useState('')

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleUseCurrentLocation() {
    if (!('geolocation' in navigator)) {
      setError('Your device does not support location sharing.')
      return
    }
    setLocatingDevice(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPickupLat(pos.coords.latitude)
        setPickupLng(pos.coords.longitude)
        setPickupAddress(`Current location (${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)})`)
        setLocatingDevice(false)
      },
      () => {
        setError('Could not get your current location. Try searching for a landmark instead.')
        setLocatingDevice(false)
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
          destinationAddress, destinationGps,
          lengthCm, widthCm, heightCm, weightKg,
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
        <p className="text-slate mb-6">No account needed. Our team will confirm your pickup shortly after you submit.</p>

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
            <input placeholder="Recipient email (optional)" value={recipientEmail} onChange={e => setRecipientEmail(e.target.value)} className="w-full border rounded-md px-3 py-2 mb-2" />
            <input placeholder="Delivery address" value={destinationAddress} onChange={e => setDestinationAddress(e.target.value)} className="w-full border rounded-md px-3 py-2 mb-2" />
            <input placeholder="GhanaPostGPS (optional)" value={destinationGps} onChange={e => setDestinationGps(e.target.value)} className="w-full border rounded-md px-3 py-2" />
          </section>

          <section className="bg-white rounded-lg p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-slate uppercase mb-3">Where should we pick up?</h2>
            <button
              type="button"
              onClick={handleUseCurrentLocation}
              disabled={locatingDevice}
              className="w-full bg-navy text-white font-medium py-2.5 rounded-md mb-3 disabled:opacity-50"
            >
              {locatingDevice ? 'Getting your location…' : 'Use my current location'}
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
            <h2 className="text-sm font-semibold text-slate uppercase mb-3">Package details</h2>
            <div className="grid grid-cols-3 gap-2 mb-2">
              <input placeholder="Length (cm)" value={lengthCm} onChange={e => setLengthCm(e.target.value)} className="border rounded-md px-3 py-2" />
              <input placeholder="Width (cm)" value={widthCm} onChange={e => setWidthCm(e.target.value)} className="border rounded-md px-3 py-2" />
              <input placeholder="Height (cm)" value={heightCm} onChange={e => setHeightCm(e.target.value)} className="border rounded-md px-3 py-2" />
            </div>
            <input placeholder="Weight (kg)" value={weightKg} onChange={e => setWeightKg(e.target.value)} className="w-full border rounded-md px-3 py-2 mb-2" />
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
