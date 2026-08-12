import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Html5Qrcode } from 'html5-qrcode'
import { supabase } from '../lib/supabase'

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

const STATUS_OPTIONS = [
  'pending', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered', 'failed', 'cancelled',
]

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending pickup',
  picked_up: 'Picked up',
  in_transit: 'In transit',
  out_for_delivery: 'Out for delivery',
  delivered: 'Delivered',
  failed: 'Delivery failed',
  cancelled: 'Cancelled',
}

export default function StaffScan() {
  const { trackingNumber } = useParams()
  const navigate = useNavigate()
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const [shipment, setShipment] = useState<Shipment | null>(null)
  const [loading, setLoading] = useState(false)
  const [notFound, setNotFound] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [scanError, setScanError] = useState<string | null>(null)

  // Load shipment if a tracking number is already in the URL (came from a QR link)
  useEffect(() => {
    if (!trackingNumber) return
    setLoading(true)
    setNotFound(false)
    supabase.from('shipments').select('*').eq('tracking_number', trackingNumber).maybeSingle()
      .then(({ data }) => {
        if (data) setShipment(data as Shipment)
        else setNotFound(true)
        setLoading(false)
      })
  }, [trackingNumber])

  // Start camera scanner only if no tracking number is present yet
  useEffect(() => {
    if (trackingNumber) return
    const elementId = 'staff-qr-reader'
    const scanner = new Html5Qrcode(elementId)
    scannerRef.current = scanner

    scanner.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: { width: 250, height: 250 } },
      (decodedText) => {
        let extracted = decodedText
        try {
          const url = new URL(decodedText)
          const parts = url.pathname.split('/')
          extracted = parts[parts.length - 1]
        } catch {
          // not a URL, use raw text as-is
        }
        scanner.stop().catch(() => {})
        navigate(`/staff/scan/${extracted}`)
      },
      () => { /* ignore per-frame scan misses */ },
    ).catch((err) => setScanError(String(err)))

    return () => {
      scanner.stop().catch(() => {})
    }
  }, [trackingNumber, navigate])

  async function updateStatus(newStatus: string) {
    if (!shipment) return
    setUpdating(true)
    await supabase.from('shipments').update({ status: newStatus }).eq('id', shipment.id)
    await supabase.from('status_events').insert({ shipment_id: shipment.id, status: newStatus })
    setShipment({ ...shipment, status: newStatus })
    setUpdating(false)
  }

  if (trackingNumber) {
    if (loading) return <div className="min-h-screen flex items-center justify-center text-slate">Loading…</div>
    if (notFound) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6 text-center">
          <p className="text-navy font-medium">No shipment found for that code.</p>
          <a href="/staff/scan" className="text-orange underline">Scan again</a>
        </div>
      )
    }
    if (!shipment) return null

    return (
      <div className="min-h-screen bg-gray-50 px-6 py-8">
        <div className="max-w-md mx-auto">
          <a href="/staff/scan" className="text-orange underline text-sm">← Scan another</a>
          <div className="bg-white rounded-lg shadow-sm p-5 mt-4">
            <p className="font-mono font-bold text-lg text-navy mb-3">{shipment.tracking_number}</p>

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

            {shipment.destination_address && (
              <p className="text-sm text-slate mb-1">Address: {shipment.destination_address}</p>
            )}
            {shipment.destination_gps && (
              <p className="text-sm text-slate mb-3">GPS: {shipment.destination_gps}</p>
            )}

            <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
              <p>Weight: <span className="font-semibold">{shipment.weight_kg ?? '—'} kg</span></p>
              <p>CBM: <span className="font-semibold">{shipment.cbm?.toFixed(3) ?? '—'} m³</span></p>
            </div>

            <div className="border-t pt-4">
              <p className="text-xs font-semibold text-slate uppercase mb-2">Update status</p>
              <div className="grid grid-cols-2 gap-2">
                {STATUS_OPTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => updateStatus(s)}
                    disabled={updating}
                    className={`text-sm py-2 rounded-md border ${
                      shipment.status === s ? 'bg-orange text-white border-orange' : 'border-gray-300 text-navy'
                    }`}
                  >
                    {STATUS_LABELS[s]}
                  </button>
                ))}
              </div>
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
    </div>
  )
}
