import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import DriverNav from '../components/DriverNav'
import { STATUS_LABELS } from '../lib/statusLabels'

type Shipment = {
  id: string
  tracking_number: string
  sender_name: string
  recipient_name: string
  status: string
  pickup_location: string | null
  destination_address: string | null
  created_at: string
}

export default function DriverDashboard() {
  const [upcoming, setUpcoming] = useState<Shipment[]>([])
  const [completed, setCompleted] = useState<Shipment[]>([])
  const [loading, setLoading] = useState(true)
  const [noVehicle, setNoVehicle] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) { setLoading(false); return }

      const { data: vehicle } = await supabase.from('vehicles').select('id').eq('driver_user_id', userData.user.id).maybeSingle()
      if (!vehicle) { setNoVehicle(true); setLoading(false); return }

      const { data: upcomingData } = await supabase
        .from('shipments')
        .select('id, tracking_number, sender_name, recipient_name, status, pickup_location, destination_address, created_at')
        .eq('assigned_vehicle_id', vehicle.id)
        .not('status', 'in', '("delivered","cancelled","failed")')
        .order('created_at', { ascending: false })

      const { data: completedData } = await supabase
        .from('shipments')
        .select('id, tracking_number, sender_name, recipient_name, status, pickup_location, destination_address, created_at')
        .eq('assigned_vehicle_id', vehicle.id)
        .eq('status', 'delivered')
        .order('created_at', { ascending: false })
        .limit(50)

      setUpcoming((upcomingData as Shipment[]) ?? [])
      setCompleted((completedData as Shipment[]) ?? [])
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <div className="min-h-screen flex items-center justify-center text-slate">Loading…</div>

  if (noVehicle) {
    return (
      <div className="min-h-screen bg-gray-50">
        <DriverNav />
        <div className="flex flex-col items-center justify-center gap-3 px-6 text-center mt-12">
          <p className="text-navy font-medium">No vehicle linked to this account.</p>
          <p className="text-sm text-slate">Ask a manager to link a driver login to a vehicle.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      <DriverNav />
      <div className="max-w-md mx-auto px-6">
        <h1 className="text-xl font-semibold text-navy mb-4">My deliveries</h1>

        <h2 className="text-sm font-semibold text-slate uppercase mb-2">Upcoming ({upcoming.length})</h2>
        <div className="space-y-2 mb-6">
          {upcoming.map((s) => (
            <a key={s.id} href={`/staff/scan/${s.tracking_number}`} className="block bg-white rounded-lg shadow-sm p-4">
              <p className="font-mono text-navy font-medium">{s.tracking_number}</p>
              <p className="text-sm text-slate">{s.sender_name} → {s.recipient_name}</p>
              <p className="text-xs text-slate mt-1">{STATUS_LABELS[s.status] ?? s.status}</p>
              {s.pickup_location && <p className="text-xs text-slate">Pickup: {s.pickup_location}</p>}
              {s.destination_address && <p className="text-xs text-slate">Deliver: {s.destination_address}</p>}
            </a>
          ))}
          {upcoming.length === 0 && <p className="text-sm text-slate">Nothing pending right now.</p>}
        </div>

        <h2 className="text-sm font-semibold text-slate uppercase mb-2">Completed ({completed.length})</h2>
        <div className="space-y-2">
          {completed.map((s) => (
            <div key={s.id} className="bg-white rounded-lg shadow-sm p-4">
              <p className="font-mono text-navy font-medium">{s.tracking_number}</p>
              <p className="text-sm text-slate">{s.sender_name} → {s.recipient_name}</p>
              <p className="text-xs text-slate mt-1">{new Date(s.created_at).toLocaleDateString()}</p>
            </div>
          ))}
          {completed.length === 0 && <p className="text-sm text-slate">No completed deliveries yet.</p>}
        </div>
      </div>
    </div>
  )
}
