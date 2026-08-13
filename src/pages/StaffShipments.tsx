import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import StaffNav from '../components/StaffNav'
import { STATUS_LABELS } from '../lib/statusLabels'

type Shipment = {
  id: string
  tracking_number: string
  sender_name: string
  recipient_name: string
  status: string
  total_charge: number | null
  assigned_vehicle_id: string | null
  created_at: string
}

type Vehicle = { id: string; label: string }

export default function StaffShipments() {
  const [shipments, setShipments] = useState<Shipment[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [showAll, setShowAll] = useState(false)

  useEffect(() => {
    supabase.from('vehicles').select('id, label').eq('active', true).order('label')
      .then(({ data }) => setVehicles((data as Vehicle[]) ?? []))
  }, [])

  useEffect(() => {
    setLoading(true)
    let query = supabase
      .from('shipments')
      .select('id, tracking_number, sender_name, recipient_name, status, total_charge, assigned_vehicle_id, created_at')
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

  async function assignVehicle(shipmentId: string, vehicleId: string) {
    await supabase.from('shipments').update({ assigned_vehicle_id: vehicleId || null }).eq('id', shipmentId)
    setShipments((prev) => prev.map((s) => (s.id === shipmentId ? { ...s, assigned_vehicle_id: vehicleId || null } : s)))
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24 md:pb-8">
      <StaffNav />
      <div className="max-w-3xl mx-auto px-6">
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
        {!loading && shipments.length === 0 && <p className="text-slate text-sm">No shipments {showAll ? '' : 'created today'}.</p>}

        <div className="space-y-3">
          {shipments.map(s => (
            <div key={s.id} className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <p className="font-mono font-medium text-navy">{s.tracking_number}</p>
                  <p className="text-sm text-slate">{s.sender_name} → {s.recipient_name}</p>
                  <p className="text-xs text-slate mt-1">{STATUS_LABELS[s.status] ?? s.status} · {new Date(s.created_at).toLocaleString()}</p>
                </div>
                <div className="flex flex-col items-end gap-1 text-sm shrink-0">
                  {s.total_charge != null && <p className="font-semibold text-navy">GHS {s.total_charge.toFixed(2)}</p>}
                  <div className="flex gap-3">
                    <Link to={`/staff/shipments/${s.id}/label`} className="text-orange underline">Label</Link>
                    <Link to={`/staff/shipments/${s.id}/invoice`} className="text-orange underline">Invoice</Link>
                  </div>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-2">
                <label className="text-xs text-slate">Vehicle:</label>
                <select value={s.assigned_vehicle_id ?? ''} onChange={(e) => assignVehicle(s.id, e.target.value)} className="text-sm border rounded-md px-2 py-1">
                  <option value="">Unassigned</option>
                  {vehicles.map((v) => <option key={v.id} value={v.id}>{v.label}</option>)}
                </select>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
