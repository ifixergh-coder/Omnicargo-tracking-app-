import { useState, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { generateTrackingNumber } from '../lib/trackingNumber'
import { calculateCbm, calculateCharge } from '../lib/pricing'

export default function NewShipment() {
  const [senderName, setSenderName] = useState('')
  const [senderPhone, setSenderPhone] = useState('')
  const [senderEmail, setSenderEmail] = useState('')
  const [recipientName, setRecipientName] = useState('')
  const [recipientPhone, setRecipientPhone] = useState('')
  const [recipientEmail, setRecipientEmail] = useState('')
  const [destinationAddress, setDestinationAddress] = useState('')
  const [destinationGps, setDestinationGps] = useState('')
  const [lengthCm, setLengthCm] = useState('')
  const [widthCm, setWidthCm] = useState('')
  const [heightCm, setHeightCm] = useState('')
  const [weightKg, setWeightKg] = useState('')
  const [pricePerCbm, setPricePerCbm] = useState('')
  const [includedKgPerCbm, setIncludedKgPerCbm] = useState('100')
  const [extraKgRate, setExtraKgRate] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [created, setCreated] = useState<string | null>(null)

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

    const { error } = await supabase.from('shipments').insert({
      tracking_number: trackingNumber,
      sender_name: senderName, sender_phone: senderPhone || null, sender_email: senderEmail || null,
      recipient_name: recipientName, recipient_phone: recipientPhone || null, recipient_email: recipientEmail || null,
      destination_address: destinationAddress || null, destination_gps: destinationGps || null,
      weight_kg: parseFloat(weightKg) || null, length_cm: parseFloat(lengthCm) || null,
      width_cm: parseFloat(widthCm) || null, height_cm: parseFloat(heightCm) || null,
      cbm: cbm || null, price_per_cbm: parseFloat(pricePerCbm) || null,
      included_kg_per_cbm: parseFloat(includedKgPerCbm) || null, extra_kg_rate: parseFloat(extraKgRate) || null,
      total_charge: pricing.total || null, status: 'pending',
    })

    if (error) { setError(error.message); setSaving(false) }
    else setCreated(trackingNumber)
  }

  if (created) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center gap-3">
        <p className="text-navy font-semibold">Shipment created</p>
        <p className="font-mono text-lg">{created}</p>
        <p className="text-sm text-slate">Invoice and label printing come next — for now this shipment is live and trackable.</p>
        <button onClick={() => window.location.reload()} className="text-orange underline mt-2">Create another</button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-xl font-semibold text-navy mb-6">New shipment</h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          <section className="bg-white rounded-lg p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-slate uppercase mb-3">Sender</h2>
            <input placeholder="Sender name" value={senderName} onChange={e => setSenderName(e.target.value)} required className="w-full border rounded-md px-3 py-2 mb-2" />
            <input placeholder="Sender phone" value={senderPhone} onChange={e => setSenderPhone(e.target.value)} className="w-full border rounded-md px-3 py-2 mb-2" />
            <input placeholder="Sender email" value={senderEmail} onChange={e => setSenderEmail(e.target.value)} className="w-full border rounded-md px-3 py-2" />
          </section>

          <section className="bg-white rounded-lg p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-slate uppercase mb-3">Recipient</h2>
            <input placeholder="Recipient name" value={recipientName} onChange={e => setRecipientName(e.target.value)} required className="w-full border rounded-md px-3 py-2 mb-2" />
            <input placeholder="Recipient phone" value={recipientPhone} onChange={e => setRecipientPhone(e.target.value)} className="w-full border rounded-md px-3 py-2 mb-2" />
            <input placeholder="Recipient email" value={recipientEmail} onChange={e => setRecipientEmail(e.target.value)} className="w-full border rounded-md px-3 py-2 mb-2" />
            <input placeholder="Delivery address" value={destinationAddress} onChange={e => setDestinationAddress(e.target.value)} className="w-full border rounded-md px-3 py-2 mb-2" />
            <input placeholder="GhanaPostGPS (optional)" value={destinationGps} onChange={e => setDestinationGps(e.target.value)} className="w-full border rounded-md px-3 py-2" />
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

          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" disabled={saving} className="w-full bg-orange text-white font-medium py-3 rounded-md disabled:opacity-50">
            {saving ? 'Creating…' : 'Create shipment'}
          </button>
        </form>
      </div>
    </div>
  )
}
