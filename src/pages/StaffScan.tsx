import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Html5Qrcode } from 'html5-qrcode'
import { supabase } from '../lib/supabase'
import { STATUS_OPTIONS, STATUS_LABELS } from '../lib/statusLabels'

type Shipment = {
  id: string
  tracking_number: string
  sender_name: string
  sender_phone: string | null
  sender_email: string | null
  recipient_name: string
  recipient_phone: string | null
  recipient_email: string | null
  destination_address: string | null
  destination_gps: string | null
  weight_kg: number | null
  cbm: number | null
  status: string
}

type DeliveryProof = { id: number; photo_path: string; delivery_type: string; recipient_note: string | null; created_at: string }

function playScanFeedback() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'square'
    osc.frequency.value = 2700
    gain.gain.setValueAtTime(0.12, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + 0.08)
  } catch {
    // audio not supported, ignore
  }
  if ('vibrate' in navigator) {
    navigator.vibrate(80) // no effect on iOS Safari, which doesn't support this API
  }
}

export default function StaffScan() {
  const { trackingNumber } = useParams()
  const navigate = useNavigate()
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const [shipment, setShipment] = useState<Shipment | null>(null)
  const [loading, setLoading] = useState(false)
  const [notFound, setNotFound] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null)
  const [updating, setUpdating] = useState(false)
  const [savedMessage, setSavedMessage] = useState<string | null>(null)
  const [scanError, setScanError] = useState<string | null>(null)
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null)
  const [manualEntry, setManualEntry] = useState('')

  const [deliveryType, setDeliveryType] = useState<'handed_to_person' | 'left_at_location'>('handed_to_person')
  const [proofPhoto, setProofPhoto] = useState<File | null>(null)
  const [proofNote, setProofNote] = useState('')
  const [existingProof, setExistingProof] = useState<DeliveryProof | null>(null)
  const [existingProofUrl, setExistingProofUrl] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setCurrentUserEmail(data.user?.email ?? null))
  }, [])

  useEffect(() => {
    if (!trackingNumber) return
    setLoading(true)
    setNotFound(false)
    setSavedMessage(null)
    setExistingProof(null)
    setExistingProofUrl(null)
    supabase.from('shipments').select('*').eq('tracking_number', trackingNumber).maybeSingle()
      .then(async ({ data }) => {
        if (data) {
          const s = data as Shipment
          setShipment(s)
          setSelectedStatus(s.status)
          const { data: proof } = await supabase.from('delivery_proofs').select('*').eq('shipment_id', s.id)
            .order('created_at', { ascending: false }).limit(1).maybeSingle()
          if (proof) {
            setExistingProof(proof as DeliveryProof)
            const { data: signed } = await supabase.storage.from('delivery-proofs').createSignedUrl((proof as DeliveryProof).photo_path, 3600)
            if (signed) setExistingProofUrl(signed.signedUrl)
          }
        } else {
          setNotFound(true)
        }
        setLoading(false)
      })
  }, [trackingNumber])

  useEffect(() => {
    if (trackingNumber) return
    const elementId = 'staff-qr-reader'
    const scanner = new Html5Qrcode(elementId)
    scannerRef.current = scanner
    let handled = false

    scanner.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: { width: 250, height: 250 } },
      async (decodedText) => {
        if (handled) return
        handled = true
        playScanFeedback()
        let extracted = decodedText
        try {
          const url = new URL(decodedText)
          const parts = url.pathname.split('/')
          extracted = parts[parts.length - 1]
        } catch {
          // not a URL, use raw text
        }
        try { await scanner.stop(); await scanner.clear() } catch {}
        // Full page navigation here (not client-side) — the camera video
        // element doesn't hand off cleanly to the next page otherwise
        window.location.href = `/staff/scan/${extracted}`
      },
      () => {},
    ).catch((err) => setScanError(String(err)))

    return () => { scanner.stop().catch(() => {}) }
  }, [trackingNumber])

  function handleManualLookup(e: React.FormEvent) {
    e.preventDefault()
    if (manualEntry.trim()) navigate(`/staff/scan/${manualEntry.trim()}`)
  }

  async function confirmStatusUpdate() {
    if (!shipment || !selectedStatus) return

    if (selectedStatus === 'delivered' && !proofPhoto) {
      alert('A photo is required to mark this as delivered.')
      return
    }

    setUpdating(true)
    setSavedMessage(null)

    if (selectedStatus === 'delivered' && proofPhoto) {
      const path = `${shipment.id}/${Date.now()}.jpg`
      const { error: uploadError } = await supabase.storage.from('delivery-proofs').upload(path, proofPhoto)
      if (uploadError) {
        setUpdating(false)
        alert(`Photo upload failed: ${uploadError.message}`)
        return
      }
      await supabase.from('delivery_proofs').insert({
        shipment_id: shipment.id, photo_path: path, delivery_type: deliveryType,
        recipient_note: proofNote || null, taken_by_email: currentUserEmail,
      })
    }

    await supabase.from('shipments').update({ status: selectedStatus }).eq('id', shipment.id)
    await supabase.from('status_events').insert({ shipment_id: shipment.id, status: selectedStatus, updated_by_email: currentUserEmail })
    setShipment({ ...shipment, status: selectedStatus })
    setUpdating(false)
    setSavedMessage(`Status updated to "${STATUS_LABELS[selectedStatus]}"`)
    setProofPhoto(null)
    setTimeout(() => setSavedMessage(null), 4000)
  }

  if (trackingNumber) {
    if (loading) return <div className="min-h-screen flex items-center justify-center text-slate">Loading…</div>
    if (notFound) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6 text-center">
          <p className="text-navy font-medium">No shipment found for that code.</p>
          <Link to="/staff/scan" className="text-orange underline">Scan again</Link>
        </div>
      )
    }
    if (!shipment) return null

    const hasChange = selectedStatus !== shipment.status
    const needsPhoto = selectedStatus === 'delivered' && hasChange

    return (
      <div className="min-h-screen bg-gray-50 px-6 py-8">
        <div className="max-w-md mx-auto">
          <Link to="/staff/scan" className="text-orange underline text-sm">← Scan another</Link>
          <div className="bg-white rounded-lg shadow-sm p-5 mt-4">
            <p className="font-mono font-bold text-lg text-navy mb-1">{shipment.tracking_number}</p>
            {currentUserEmail && <p className="text-xs text-slate mb-3">Logged in as {currentUserEmail}</p>}

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-xs font-semibold text-slate uppercase mb-1">Sender</p>
                <p className="text-sm">{shipment.sender_name}</p>
                {shipment.sender_phone && <p className="text-sm">{shipment.sender_phone}</p>}
                {shipment.sender_email && <p className="text-sm">{shipment.sender_email}</p>}
              </div>
              <div>
                <p className="text-xs font-semibold text-slate uppercase mb-1">Recipient</p>
                <p className="text-sm">{shipment.recipient_name}</p>
                {shipment.recipient_phone && <p className="text-sm">{shipment.recipient_phone}</p>}
                {shipment.recipient_email && <p className="text-sm">{shipment.recipient_email}</p>}
              </div>
            </div>

            {shipment.destination_address && <p className="text-sm text-slate mb-1">Address: {shipment.destination_address}</p>}
            {shipment.destination_gps && <p className="text-sm text-slate mb-3">GPS: {shipment.destination_gps}</p>}

            <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
              <p>Weight: <span className="font-semibold">{shipment.weight_kg ?? '—'} kg</span></p>
              <p>CBM: <span className="font-semibold">{shipment.cbm?.toFixed(3) ?? '—'} m³</span></p>
            </div>

            {existingProof && existingProofUrl && (
              <div className="border-t pt-3 mb-3">
                <p className="text-xs font-semibold text-slate uppercase mb-2">Delivery proof on file</p>
                <img src={existingProofUrl} alt="Delivery proof" className="w-full rounded-md border" />
                <p className="text-xs text-slate mt-1">
                  {existingProof.delivery_type === 'handed_to_person' ? 'Handed to person' : 'Left at location'}
                  {existingProof.recipient_note && ` — ${existingProof.recipient_note}`}
                </p>
              </div>
            )}

            <div className="border-t pt-4">
              <p className="text-xs font-semibold text-slate uppercase mb-2">
                Current status: <span className="text-navy">{STATUS_LABELS[shipment.status]}</span>
              </p>
              <p className="text-xs text-slate mb-2">Select a new status, then confirm below</p>
              <div className="grid grid-cols-2 gap-2 mb-4">
                {STATUS_OPTIONS.map((s) => (
                  <button key={s} onClick={() => setSelectedStatus(s)} className={`text-sm py-2 px-2 rounded-md border text-center leading-tight ${selectedStatus === s ? 'bg-orange text-white border-orange' : 'border-gray-300 text-navy'}`}>
                    {STATUS_LABELS[s]}
                  </button>
                ))}
              </div>

              {needsPhoto && (
                <div className="bg-gray-50 rounded-md p-3 mb-4 space-y-2">
                  <p className="text-xs font-semibold text-slate uppercase">Delivery proof (required)</p>
                  <select value={deliveryType} onChange={(e) => setDeliveryType(e.target.value as any)} className="w-full border rounded-md px-3 py-2 text-sm">
                    <option value="handed_to_person">Handed to person</option>
                    <option value="left_at_location">Left at location</option>
                  </select>
                  <input type="file" accept="image/*" capture="environment" onChange={(e) => setProofPhoto(e.target.files?.[0] ?? null)} className="w-full text-sm" />
                  <input placeholder="Note (optional)" value={proofNote} onChange={(e) => setProofNote(e.target.value)} className="w-full border rounded-md px-3 py-2 text-sm" />
                </div>
              )}

              <button onClick={confirmStatusUpdate} disabled={!hasChange || updating} className="w-full bg-navy text-white font-medium py-3 rounded-md disabled:opacity-40">
                {updating ? 'Saving…' : hasChange ? `Confirm: ${STATUS_LABELS[selectedStatus!]}` : 'No change selected'}
              </button>

              {savedMessage && <p className="text-sm text-green-600 text-center mt-3 font-medium">✓ {savedMessage}</p>}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-navy px-6 py-8">
      <p className="text-white text-center mb-4">Point the camera at a shipment label's QR code</p>
      <div id="staff-qr-reader" className="max-w-sm mx-auto rounded-lg overflow-hidden" />
      {scanError && <p className="text-red-300 text-sm text-center mt-4">{scanError}</p>}

      <div className="max-w-sm mx-auto mt-6 border-t border-white/20 pt-6">
        <p className="text-white/70 text-sm mb-2">Or type the tracking number</p>
        <form onSubmit={handleManualLookup} className="flex gap-2">
          <input placeholder="OMC4827193650182" value={manualEntry} onChange={(e) => setManualEntry(e.target.value)} className="flex-1 rounded-md px-3 py-2 text-navy" />
          <button type="submit" className="bg-orange text-white px-4 py-2 rounded-md text-sm">Look up</button>
        </form>
      </div>
    </div>
  )
}
