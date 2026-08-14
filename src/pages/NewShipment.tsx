import { useState, useMemo, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { generateTrackingNumber } from '../lib/trackingNumber'
import { calculateCbm, calculateCharge } from '../lib/pricing'
import { findOrCreateCustomer } from '../lib/customers'
import CustomerSearch from '../components/CustomerSearch'
import StaffNav from '../components/StaffNav'

type Vehicle = { id: string; label: string }
type Customer = { id: string; name: string; phone: string | null; email: string | null }

export default function NewShipment() {
  const [senderName, setSenderName] = useState('')
  const [senderPhone, setSenderPhone] = useState('')
  const [senderEmail, setSenderEmail] = useState('')
  const [selectedSender, setSelectedSender] = useState<Customer | null>(null)

  const [recipientName, setRecipientName] = useState('')
  const [recipientPhone, setRecipientPhone] = useState('')
  const [recipientEmail, setRecipientEmail] = useState('')
  const [selectedRecipient, setSelectedRecipient] = useState<Customer | null>(null)

  const [pickupLocation, setPickupLocation] = useState('')
  const [destinationAddress, setDestinationAddress] = useState('')
  const [destinationGps, setDestinationGps] = useState('')
  const [packageDescription, setPackageDescription] = useState('')

  const [lengthCm, setLengthCm] = useState('')
  const [widthCm, setWidthCm] = useState('')
  const [heightCm, setHeightCm] = useState('')
  const [weightKg, setWeightKg] = useState('')
  const [boxCount, setBoxCount] = useState('1')
  const [pricePerCbm, setPricePerCbm] = useState('')
  const [includedKgPerCbm, setIncludedKgPerCbm] = useState('100')
  const [extraKgRate, setExtraKgRate] = useState('')
  const [assignedVehicleId, setAssignedVehicleId] = useState('')
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [created, setCreated] = useState<string | null>(null)
  const [createdId, setCreatedId] = useState<string | null>(null)

  useEffect(() => {
    supabase.from('vehicles').select('id, label').eq('active', true).order('label')
      .then(({ data }) => setVehicles((data as Vehicle[]) ?? []))
  }, [])

  const cbm = useMemo(() => {
    const l = parseFloat(lengthCm), w = parseFloat(widthCm), h = parseFloat(heightCm)
    return (!l || !w || !h) ? 0 : calculateCbm(l, w, h)
  }, [lengthCm, widthCm, heightCm])

  const pricing = useMemo(() => calculateCharge(
    cbm, parseFloat(weightKg) || 0, parseFloat(pricePerCbm) || 0,
    parseFloat(includedKgPerCbm) || 0, parseFloat(extraKgRate) || 0,
  ), [cbm, weightKg, pricePerCbm, includedKgPerCbm, extraKgRate])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
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
      destination_address: destinationAddress || null, destination_gps: destinationGps || null,
      package_description: packageDescription || null,
      weight_kg: parseFloat(weightKg) || null, length_cm: parseFloat(lengthCm) || null,
      width_cm: parseFloat(widthCm) || null, height_cm: parseFloat(heightCm) || null,
      box_count: parseInt(boxCount) || 1,
      cbm: cbm || null, price_per_cbm: parseFloat(pricePerCbm) || null,
      included_kg_per_cbm: parseFloat(includedKgPerCbm) || null, extra_kg_rate: parseFloat(extraKgRate) || null,
      total_charge: pricing.total || null, status: 'pending',
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
          <p className="text-navy font-semibold">Shipment created</p>
          <p className="font-mono text-lg">{created}</p>
          {createdId && (
            <div className="flex gap-3">
              <a href={`/staff/shipments/${createdId}/label`} className="text-orange underline">View label</a>
              <a href={`/staff/shipments/${createdId}/invoice`} className="text-orange underline">View invoice</a>
            </div>
          )}
          <button onClick={() => window.location.reload()} className="text-orange underline mt-2">Create another</button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24 md:pb-8">
      <StaffNav />
      <div className="max-w-2xl mx-auto px-6">
        <h1 className="text-xl font-semibold text-navy mb-6">New shipment</h1>
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
            <h2 className="text-sm font-semibold text-slate uppercase mb-3">Route & package</h2>
            <input placeholder="Pickup location" value={pickupLocation} onChange={e => setPickupLocation(e.target.value)} className="w-full border rounded-md px-3 py-2 mb-2" />
            <input placeholder="Delivery address" value={destinationAddress} onChange={e => setDestinationAddress(e.target.value)} className="w-full border rounded-md px-3 py-2 mb-2" />
            <input placeholder="GhanaPostGPS (optional)" value={destinationGps} onChange={e => setDestinationGps(e.target.value)} className="w-full border rounded-md px-3 py-2 mb-2" />
            <input placeholder="Package description (e.g. Documents, Electronics)" value={packageDescription} onChange={e => setPackageDescription(e.target.value)} className="w-full border rounded-md px-3 py-2" />
          </section>

          <section className="bg-white rounded-lg p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-slate uppercase mb-3">Dimensions & CBM calculator</h2>
            <div className="grid grid-cols-3 gap-2 mb-2">
              <input placeholder="Length (cm)" value={lengthCm} onChange={e => setLengthCm(e.target.value)} className="border rounded-md px-3 py-2" />
              <input placeholder="Width (cm)" value={widthCm} onChange={e => setWidthCm(e.target.value)} className="border rounded-md px-3 py-2" />
              <input placeholder="Height (cm)" value={heightCm} onChange={e => setHeightCm(e.target.value)} className="border rounded-md px-3 py-2" />
            </div>
            <p className="text-sm text-slate mb-3">CBM: <span className="font-semibold text-navy">{cbm.toFixed(4)} m³</span></p>
            <input placeholder="Weight (kg)" value={weightKg} onChange={e => setWeightKg(e.target.value)} className="w-full border rounded-md px-3 py-2" />
          </section>

          <section className="bg-white rounded-lg p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-slate uppercase mb-3">Number of boxes</h2>
            <input type="number" min="1" placeholder="1" value={boxCount} onChange={e => setBoxCount(e.target.value)} className="w-full border rounded-md px-3 py-2" />
            <p className="text-xs text-slate mt-1">
              Multiple boxes for this shipment print as separate numbered labels (e.g. 1/{boxCount || 1}, 2/{boxCount || 1}).
            </p>
          </section>

          <section className="bg-white rounded-lg p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-slate uppercase mb-3">Pricing</h2>
            <input placeholder="Price per CBM (GHS)" value={pricePerCbm} onChange={e => setPricePerCbm(e.target.value)} className="w-full border rounded-md px-3 py-2 mb-2" />
            <input placeholder="Included kg per CBM" value={includedKgPerCbm} onChange={e => setIncludedKgPerCbm(e.target.value)} className="w-full border rounded-md px-3 py-2 mb-2" />
            <input placeholder="Extra rate per kg over allowance (GHS)" value={extraKgRate} onChange={e => setExtraKgRate(e.target.value)} className="w-full border rounded-md px-3 py-2 mb-3" />
            <div className="bg-gray-50 rounded-md p-3 text-sm space-y-1">
              <p>Base charge (CBM × rate): GHS {pricing.baseCharge.toFixed(2)}</p>
              <p>Excess weight: {pricing.excessWeightKg.toFixed(2)} kg</p>
              <p>Excess charge: GHS {pricing.excessCharge.toFixed(2)}</p>
              <p className="font-semibold text-navy">Total: GHS {pricing.total.toFixed(2)}</p>
            </div>
          </section>

          <section className="bg-white rounded-lg p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-slate uppercase mb-3">Vehicle (optional)</h2>
            <select value={assignedVehicleId} onChange={e => setAssignedVehicleId(e.target.value)} className="w-full border rounded-md px-3 py-2">
              <option value="">Assign later</option>
              {vehicles.map((v) => <option key={v.id} value={v.id}>{v.label}</option>)}
            </select>
          </section>

          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" disabled={saving} className="w-full bg-orange text-white font-medium py-3 rounded-md disabled:opacity-50">
            {saving ? 'Creating…' : 'Create shipment'}
          </button>
        </form>
      </div>
    </div>
  )
}
