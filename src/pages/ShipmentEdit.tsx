import { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { calculateCharge } from '../lib/pricing'
import { resolveCbm } from '../lib/cbmEntry'
import StaffNav from '../components/StaffNav'
import { getPublicPricing, PricingSettings } from '../lib/publicPricing'

type Shipment = {
  id: string
  tracking_number: string
  status: string
  sender_name: string
  sender_phone: string | null
  sender_email: string | null
  recipient_name: string
  recipient_phone: string | null
  recipient_email: string | null
  destination_address: string | null
  destination_gps: string | null
  package_description: string | null
  length_cm: number | null
  width_cm: number | null
  height_cm: number | null
  weight_kg: number | null
  cbm: number | null
  cbm_entry_mode: string | null
  box_count: number | null
}

export default function ShipmentEdit() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [savedMessage, setSavedMessage] = useState<string | null>(null)
  const [isDelivered, setIsDelivered] = useState(false)
  const [pricing, setPricing] = useState<PricingSettings | null>(null)

  const [senderName, setSenderName] = useState('')
  const [senderPhone, setSenderPhone] = useState('')
  const [senderEmail, setSenderEmail] = useState('')
  const [recipientName, setRecipientName] = useState('')
  const [recipientPhone, setRecipientPhone] = useState('')
  const [recipientEmail, setRecipientEmail] = useState('')
  const [destinationAddress, setDestinationAddress] = useState('')
  const [destinationGps, setDestinationGps] = useState('')
  const [packageDescription, setPackageDescription] = useState('')

  const [cbmMode, setCbmMode] = useState<'dimensions' | 'direct'>('dimensions')
  const [directCbm, setDirectCbm] = useState('')
  const [lengthCm, setLengthCm] = useState('')
  const [widthCm, setWidthCm] = useState('')
  const [heightCm, setHeightCm] = useState('')
  const [weightKg, setWeightKg] = useState('')
  const [boxCount, setBoxCount] = useState('1')

  useEffect(() => {
    if (!id) return
    getPublicPricing().then(setPricing)
    supabase.from('shipments').select('*').eq('id', id).maybeSingle().then(({ data }) => {
      const s = data as Shipment
      if (s) {
        setIsDelivered(s.status === 'delivered')
        setSenderName(s.sender_name); setSenderPhone(s.sender_phone ?? ''); setSenderEmail(s.sender_email ?? '')
        setRecipientName(s.recipient_name); setRecipientPhone(s.recipient_phone ?? ''); setRecipientEmail(s.recipient_email ?? '')
        setDestinationAddress(s.destination_address ?? ''); setDestinationGps(s.destination_gps ?? '')
        setPackageDescription(s.package_description ?? '')
        setCbmMode(s.cbm_entry_mode === 'direct' ? 'direct' : 'dimensions')
        setDirectCbm(s.cbm != null && s.cbm_entry_mode === 'direct' ? String(s.cbm) : '')
        setLengthCm(s.length_cm != null ? String(s.length_cm) : '')
        setWidthCm(s.width_cm != null ? String(s.width_cm) : '')
        setHeightCm(s.height_cm != null ? String(s.height_cm) : '')
        setWeightKg(s.weight_kg != null ? String(s.weight_kg) : '')
        setBoxCount(String(s.box_count ?? 1))
      }
      setLoading(false)
    })
  }, [id])

  const cbm = useMemo(
    () => resolveCbm(cbmMode, directCbm, lengthCm, widthCm, heightCm),
    [cbmMode, directCbm, lengthCm, widthCm, heightCm],
  )

  const pricingResult = useMemo(() => {
    if (!pricing) return null
    return calculateCharge(cbm, parseFloat(weightKg) || 0, pricing.price_per_cbm, pricing.included_kg_per_cbm, pricing.extra_kg_rate)
  }, [cbm, weightKg, pricing])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!id || !pricing) return
    setSaving(true)
    setError(null)

    const { error } = await supabase.from('shipments').update({
      sender_name: senderName, sender_phone: senderPhone || null, sender_email: senderEmail || null,
      recipient_name: recipientName, recipient_phone: recipientPhone || null, recipient_email: recipientEmail || null,
      destination_address: destinationAddress || null, destination_gps: destinationGps || null,
      package_description: packageDescription || null,
      length_cm: parseFloat(lengthCm) || null, width_cm: parseFloat(widthCm) || null, height_cm: parseFloat(heightCm) || null,
      weight_kg: parseFloat(weightKg) || null, cbm: cbm || null, cbm_entry_mode: cbmMode,
      box_count: parseInt(boxCount) || 1,
      total_charge: pricingResult?.total || null,
    }).eq('id', id)

    setSaving(false)
    if (error) {
      setError(error.message)
    } else {
      setSavedMessage('Shipment updated')
      setTimeout(() => setSavedMessage(null), 3000)
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center text-slate">Loading…</div>

  return (
    <div className="min-h-screen bg-gray-50 pb-24 md:pb-8">
      <StaffNav />
      <div className="max-w-2xl mx-auto px-6">
        <Link to="/staff/shipments" className="text-orange underline text-sm">← All shipments</Link>
        <h1 className="text-xl font-semibold text-navy mt-4 mb-2">Edit shipment</h1>

        {isDelivered && (
          <p className="text-sm text-orange bg-orange/10 rounded-md p-3 mb-4">
            This shipment is already delivered. You can still correct its details here, but its status itself is locked and can't be changed from this page.
          </p>
        )}

        <form onSubmit={handleSave} className="space-y-6">
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
            <input placeholder="GhanaPostGPS" value={destinationGps} onChange={e => setDestinationGps(e.target.value)} className="w-full border rounded-md px-3 py-2 mb-2" />
            <input placeholder="Package description" value={packageDescription} onChange={e => setPackageDescription(e.target.value)} className="w-full border rounded-md px-3 py-2" />
          </section>

          <section className="bg-white rounded-lg p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-slate uppercase mb-3">Dimensions & CBM</h2>
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
            <p className="text-sm text-slate mb-3">CBM: <span className="font-semibold text-navy">{cbm.toFixed(4)} m³</span></p>
            <input placeholder="Weight (kg)" value={weightKg} onChange={e => setWeightKg(e.target.value)} className="w-full border rounded-md px-3 py-2" />
          </section>

          <section className="bg-white rounded-lg p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-slate uppercase mb-3">Number of boxes</h2>
            <input type="number" min="1" value={boxCount} onChange={e => setBoxCount(e.target.value)} className="w-full border rounded-md px-3 py-2" />
            <p className="text-xs text-slate mt-1">
              Changing this updates how many numbered labels print next time you view this shipment's label.
            </p>
          </section>

          {pricingResult && (
            <section className="bg-white rounded-lg p-5 shadow-sm">
              <h2 className="text-sm font-semibold text-slate uppercase mb-3">Recalculated price (current management rates)</h2>
              <p className="text-2xl font-bold text-navy">GHS {pricingResult.total.toFixed(2)}</p>
              <p className="text-xs text-slate mt-1">This will overwrite the shipment's saved charge when you save.</p>
            </section>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" disabled={saving} className="w-full bg-orange text-white font-medium py-3 rounded-md disabled:opacity-50">
            {saving ? 'Saving…' : 'Save changes'}
          </button>
          {savedMessage && <p className="text-sm text-green-600 text-center">✓ {savedMessage}</p>}
        </form>

        <div className="flex gap-4 mt-4">
          <button onClick={() => navigate(`/staff/shipments/${id}/label`)} className="text-orange underline text-sm">View label</button>
          <button onClick={() => navigate(`/staff/shipments/${id}/invoice`)} className="text-orange underline text-sm">View invoice</button>
        </div>
      </div>
    </div>
  )
}
