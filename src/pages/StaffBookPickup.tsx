import { useState, useMemo, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { generateTrackingNumber } from '../lib/trackingNumber'
import { calculateCharge } from '../lib/pricing'
import { resolveCbm } from '../lib/cbmEntry'
import { findOrCreateCustomer } from '../lib/customers'
import { reverseGeocode } from '../lib/reverseGeocode'
import CustomerSearch from '../components/CustomerSearch'
import LocationSearch from '../components/LocationSearch'
import StaffNav from '../components/StaffNav'
import { getPublicPricing, PricingSettings } from '../lib/publicPricing'

type Vehicle = { id: string; label: string }
type Customer = { id: string; name: string; phone: string | null; email: string | null }

export default function StaffBookPickup() {
  const [senderName, setSenderName] = useState('')
  const [senderPhone, setSenderPhone] = useState('')
  const [senderEmail, setSenderEmail] = useState('')
  const [selectedSender, setSelectedSender] = useState<Customer | null>(null)

  const [recipientName, setRecipientName] = useState('')
  const [recipientPhone, setRecipientPhone] = useState('')
  const [recipientEmail, setRecipientEmail] = useState('')
  const [selectedRecipient, setSelectedRecipient] = useState<Customer | null>(null)

  const [pickupLocation, setPickupLocation] = useState('')
  const [pickupLat, setPickupLat] = useState<number | null>(null)
  const [pickupLng, setPickupLng] = useState<number | null>(null)
  const [locatingPickup, setLocatingPickup] = useState(false)

  const [destinationAddress, setDestinationAddress] = useState('')
  const [destinationLat, setDestinationLat] = useState<number | null>(null)
  const [destinationLng, setDestinationLng] = useState<number | null>(null)
  const [locatingDestination, setLocatingDestination] = useState(false)
  const [destinationGps, setDestinationGps] = useState('')
  const [packageDescription, setPackageDescription] = useState('')

  const [cbmMode, setCbmMode] = useState<'dimensions' | 'direct'>('dimensions')
  const [directCbm, setDirectCbm] = useState('')
  const [lengthCm, setLengthCm] = useState('')
  const [widthCm, setWidthCm] = useState('')
  const [heightCm, setHeightCm] = useState('')
  const [weightKg, setWeightKg] = useState('')
  const [boxCount, setBoxCount] = useState('1')
  const [assignedVehicleId, setAssignedVehicleId] = useState('')
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [pricing, setPricing] = useState<PricingSettings | null>(null)

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [created, setCreated] = useState<string | null>(null)
  const [createdId, setCreatedId] = useState<string | null>(null)

  useEffect(() => {
    supabase.from('vehicles').select('id, label').eq('active', true).order('label')
      .then(({ data }) => setVehicles((data as Vehicle[]) ?? []))
    getPublicPricing().then(setPricing)
  }, [])

  const cbm = useMemo(
    () => resolveCbm(cbmMode, directCbm, lengthCm, widthCm, heightCm),
    [cbmMode, directCbm, lengthCm, widthCm, heightCm],
  )

  const result = useMemo(() => {
    if (!pricing) return null
    return calculateCharge(cbm, parseFloat(weightKg) || 0, pricing.price_per_cbm, pricing.included_kg_per_cbm, pricing.extra_kg_rate)
  }, [cbm, weightKg, pricing])

  async function useCurrentLocation(target: 'pickup' | 'destination') {
    if (!('geolocation' in navigator)) {
      setError('This device does not support location sharing.')
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
          setPickupLocation(address)
        } else {
          setDestinationLat(latitude)
          setDestinationLng(longitude)
          setDestinationAddress(address)
        }
        setLocating(false)
      },
      () => {
        setError('Could not get the current location. Try searching instead.')
        setLocating(false)
      },
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!pricing) return
    setSaving(true)
    setError(null)
    const trackingNumber = generateTrackingNumber()

    const [senderCustomerId, recipientCustomerId] = await Promise.all([
      selectedSender ? Promise.resolve(selectedSender.id) : findOrCreateCustomer(senderName, senderPhone, senderEmail),
      selectedRecipient ? Promise.resolve(selectedRecipient.id) : findOrCreateCustomer(recipientName, recipientPhone, recipientEmail),
    ])

    const { data: inserted, error } = await supabase.from('shipments').insert({
      tracking_number: trackingNumber,
      sender_name: senderName, sender_phone: senderPhone || null, sender_email: senderEmail || null,
      recipient_name: recipientName, recipient_phone: recipientPhone || null, recipient_email: recipientEmail || null,
      pickup_location: pickupLocation || null,
      pickup_lat: pickupLat, pickup_lng: pickupLng,
      destination_address: destinationAddress || null, destination_gps: destinationGps || null,
      destination_lat: destinationLat, destination_lng: destinationLng,
      package_description: packageDescription || null,
      length_cm: parseFloat(lengthCm) || null, width_cm: parseFloat(widthCm) || null, height_cm: parseFloat(heightCm) || null,
      weight_kg: parseFloat(weightKg) || null, cbm: cbm || null, cbm_entry_mode: cbmMode,
      box_count: parseInt(boxCount) || 1,
      price_per_cbm: pricing.price_per_cbm, included_kg_per_cbm: pricing.included_kg_per_cbm, extra_kg_rate: pricing.extra_kg_rate,
      total_charge: result?.total || null, status: 'pending', source: 'staff',
      assigned_vehicle_id: assignedVehicleId || null,
      sender_customer_id: senderCustomerId, recipient_customer_id: recipientCustomerId,
    }).select()

    if (error) { setError(error.message); setSaving(false) }
    else { setCreated(trackingNumber); setCreatedId((inserted as any)?.[0]?.id ?? null) }
  }

  if (created) {
    return (
      <div className="min-h-screen bg-gray-50 pb-24 md:pb-8">
        <StaffNav />
        <div className="flex flex-col items-center justify-center px-6 text-center gap-3 mt-12">
          <p className="text-navy font-semibold">Pickup booked</p>
          <p className="font-mono text-lg">{created}</p>
          {createdId && (
            <div className="flex gap-3">
              <a href={`/staff/shipments/${createdId}/label`} className="text-orange underline">View label</a>
              <a href={`/staff/shipments/${createdId}/invoice`} className="text-orange underline">View invoice</a>
            </div>
          )}
          <button onClick={() => window.location.reload()} className="text-orange underline mt-2">Book another</button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24 md:pb-8">
      <StaffNav />
      <div className="max-w-2xl mx-auto px-6">
        <h1 className="text-xl font-semibold text-navy mb-2">Book pickup for a customer</h1>
        <p className="text-sm text-slate mb-6">For customers calling or texting in — same pricing as the public calculator, applied automatically.</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <section className="bg-white rounded-lg p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-slate uppercase mb-3">Sender</h2>
            <CustomerSearch
              label="Sender"
              name={senderName} phone={senderPhone} email={senderEmail}
              onChangeName={setSenderName} onChangePhone={setSenderPhone} onChangeEmail={setSenderEmail}
              selectedCustomer={selectedSender} onSelectCustomer={setSelectedSender}
            />
          </section>

          <section className="bg-white rounded-lg p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-slate uppercase mb-3">Recipient</h2>
            <CustomerSearch
              label="Recipient"
              name={recipientName} phone={recipientPhone} email={recipientEmail}
              onChangeName={setRecipientName} onChangePhone={setRecipientPhone} onChangeEmail={setRecipientEmail}
              selectedCustomer={selectedRecipient} onSelectCustomer={setSelectedRecipient}
            />
          </section>

          <section className="bg-white rounded-lg p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-slate uppercase mb-3">Where should we pick up?</h2>
            <button
              type="button"
              onClick={() => useCurrentLocation('pickup')}
              disabled={locatingPickup}
              className="w-full bg-navy text-white font-medium py-2.5 rounded-md mb-3 disabled:opacity-50"
            >
              {locatingPickup ? 'Getting location…' : 'Use current location'}
            </button>
            <p className="text-xs text-slate mb-2 text-center">— or —</p>
            <LocationSearch
              placeholder="Search for a landmark or address"
              onSelect={({ address, lat, lng }) => {
                setPickupLocation(address)
                setPickupLat(lat)
                setPickupLng(lng)
              }}
            />
            {pickupLocation && (
              <p className="text-sm text-slate mt-2">Pickup: <span className="font-medium text-navy">{pickupLocation}</span></p>
            )}
          </section>

          <section className="bg-white rounded-lg p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-slate uppercase mb-3">Where should we deliver to?</h2>
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
              <p className="text-sm text-slate mt-2 mb-3">Delivery: <span className="font-medium text-navy">{destinationAddress}</span></p>
            )}
            <input placeholder="GhanaPostGPS (optional)" value={destinationGps} onChange={e => setDestinationGps(e.target.value)} className="w-full border rounded-md px-3 py-2" />
          </section>

          <section className="bg-white rounded-lg p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-slate uppercase mb-3">Package</h2>
            <div className="flex gap-2 mb-3">
              <button type="button" onClick={() => setCbmMode('dimensions')} className={`flex-1 py-2 rounded-md text-sm font-medium ${cbmMode === 'dimensions' ? 'bg-navy text-white' : 'bg-gray-100 text-slate'}`}>
                Enter dimensions
              </button>
              <button type="button" onClick={() => setCbmMode('direct')} className={`flex-1 py-2 rounded-md text-sm font-medium ${cbmMode === 'direct' ? 'bg-navy text-white' : 'bg-gray-100 text-slate'}`}>
                I know the CBM
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
            <p className="text-sm text-slate mb-2">CBM: <span className="font-semibold text-navy">{cbm.toFixed(4)} m³</span></p>
            <input placeholder="Weight (kg)" value={weightKg} onChange={e => setWeightKg(e.target.value)} className="w-full border rounded-md px-3 py-2 mb-2" />
            <label className="block text-sm font-medium text-slate mb-1">Number of boxes / items</label>
            <input type="number" min="1" value={boxCount} onChange={e => setBoxCount(e.target.value)} className="w-full border rounded-md px-3 py-2 mb-2" />
            <input placeholder="Package description" value={packageDescription} onChange={e => setPackageDescription(e.target.value)} className="w-full border rounded-md px-3 py-2" />
          </section>

          {result && (
            <div className="bg-white rounded-lg p-5 shadow-sm">
              <p className="text-xs text-slate uppercase mb-1">Estimated cost (using current management rates)</p>
              <p className="text-2xl font-bold text-navy">GHS {result.total.toFixed(2)}</p>
            </div>
          )}

          <section className="bg-white rounded-lg p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-slate uppercase mb-3">Vehicle (optional)</h2>
            <select value={assignedVehicleId} onChange={e => setAssignedVehicleId(e.target.value)} className="w-full border rounded-md px-3 py-2">
              <option value="">Assign later</option>
              {vehicles.map((v) => <option key={v.id} value={v.id}>{v.label}</option>)}
            </select>
          </section>

          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" disabled={saving} className="w-full bg-orange text-white font-medium py-3 rounded-md disabled:opacity-50">
            {saving ? 'Booking…' : 'Book pickup'}
          </button>
        </form>
      </div>
    </div>
  )
}
