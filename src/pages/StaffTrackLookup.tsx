import { useState } from 'react'
import { supabase } from '../lib/supabase'
import StaffNav from '../components/StaffNav'
import { STATUS_LABELS } from '../lib/statusLabels'

type Result = {
  tracking_number: string
  status: string
  sender_name: string
  recipient_name: string
  destination_address: string | null
  driver_name: string | null
  driver_phone: string | null
  plate_number: string | null
}

export default function StaffTrackLookup() {
  const [query, setQuery] = useState('')
  const [result, setResult] = useState<Result | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!query.trim()) return
    setLoading(true)
    setNotFound(false)
    setResult(null)

    const { data: shipment } = await supabase
      .from('shipments')
      .select('tracking_number, status, sender_name, recipient_name, destination_address, assigned_vehicle_id')
      .eq('tracking_number', query.trim())
      .maybeSingle()

    if (!shipment) {
      setNotFound(true)
      setLoading(false)
      return
    }

    let vehicleInfo = { driver_name: null, driver_phone: null, plate_number: null }
    if (shipment.assigned_vehicle_id) {
      const { data: v } = await supabase.from('vehicles').select('driver_name, driver_phone, plate_number')
        .eq('id', shipment.assigned_vehicle_id).maybeSingle()
      if (v) vehicleInfo = v as any
    }

    setResult({ ...shipment, ...vehicleInfo } as Result)
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24 md:pb-8">
      <StaffNav />
      <div className="max-w-md mx-auto px-6">
        <h1 className="text-xl font-semibold text-navy mb-2">Track a shipment</h1>
        <p className="text-sm text-slate mb-4">Look up status, driver, and delivery info — no scanning or updating here.</p>

        <form onSubmit={handleSearch} className="flex gap-2 mb-6">
          <input placeholder="OMC4827193650182" value={query} onChange={(e) => setQuery(e.target.value)} className="flex-1 border rounded-md px-3 py-2" />
          <button type="submit" className="bg-orange text-white px-4 py-2 rounded-md text-sm">Search</button>
        </form>

        {loading && <p className="text-sm text-slate">Searching…</p>}
        {notFound && <p className="text-sm text-red-600">No shipment found for that tracking number.</p>}

        {result && (
          <div className="bg-white rounded-lg shadow-sm p-5">
            <p className="font-mono font-bold text-lg text-navy mb-2">{result.tracking_number}</p>
            <p className="text-sm mb-3"><span className="font-semibold text-navy">{STATUS_LABELS[result.status] ?? result.status}</span></p>

            <div className="text-sm space-y-1 mb-4">
              <p>{result.sender_name} → {result.recipient_name}</p>
              {result.destination_address && <p className="text-slate">{result.destination_address}</p>}
            </div>

            <div className="border-t pt-3">
              <p className="text-xs font-semibold text-slate uppercase mb-1">Driver / Vehicle</p>
              {result.driver_name ? (
                <p className="text-sm">{result.driver_name} {result.driver_phone && `· ${result.driver_phone}`} {result.plate_number && `· ${result.plate_number}`}</p>
              ) : (
                <p className="text-sm text-slate">Not yet assigned to a driver.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
