import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

type Shipment = {
  id: string
  tracking_number: string
  sender_name: string
  recipient_name: string
  status: string
  total_charge: number | null
  created_at: string
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending pickup',
  picked_up: 'Picked up',
  in_transit: 'In transit',
  out_for_delivery: 'Out for delivery',
  delivered: 'Delivered',
  failed: 'Delivery failed',
  cancelled: 'Cancelled',
}

export default function StaffShipments() {
  const [shipments, setShipments] = useState<Shipment[]>([])
  const [loading, setLoading] = useState(true)
  const [showAll, setShowAll] = useState(false)

  useEffect(() => {
    setLoading(true)
    let query = supabase
      .from('shipments')
      .select('id, tracking_number, sender_name, recipient_name, status, total_charge, created_at')
      .order('created_at', { ascending: false })

    if (!showAll) {
      const startOfDay = new Date()
      startOfDay.setHours(0, 0, 0, 0)
      query = query.gte('created_at', startOfDay.toISOString())
    }

    query.then(({ data }) => {
      setShipments((data as Shipment[]) ?? [])
      setLoading(false)
    })
  }, [showAll])

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-semibold text-navy">Shipments</h1>
          <Link to="/staff/shipments/new" className="bg-orange text-white font-medium px-4 py-2 rounded-md text-sm">
            + New shipment
          </Link>
        </div>

        <button onClick={() => setShowAll(s => !s)} className="text-sm text-orange underline mb-4">
          {showAll ? 'Show today only' : 'Show all shipments'}
        </button>

        {loading && <p className="text-slate text-sm">Loading…</p>}
        {!loading && shipments.length === 0 && (
          <p className="text-slate text-sm">No shipments {showAll ? '' : 'created today'}.</p>
        )}

        <div className="space-y-3">
          {shipments.map(s => (
            <div key={s.id} className="bg-white rounded-lg shadow-sm p-4 flex items-center justify-between gap-4">
              <div>
                <p className="font-mono font-medium text-navy">{s.tracking_number}</p>
                <p className="text-sm text-slate">{s.sender_name} → {s.recipient_name}</p>
                <p className="text-xs text-slate mt-1">
                  {STATUS_LABELS[s.status] ?? s.status} · {new Date(s.created_at).toLocaleString()}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1 text-sm shrink-0">
                {s.total_charge != null && <p className="font-semibold text-navy">GHS {s.total_charge.toFixed(2)}</p>}
                <div className="flex gap-3">
                  <Link to={`/staff/shipments/${s.id}/label`} className="text-orange underline">Label</Link>
                  <Link to={`/staff/shipments/${s.id}/invoice`} className="text-orange underline">Invoice</Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
