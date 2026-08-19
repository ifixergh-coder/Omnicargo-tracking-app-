import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import CustomerNav from '../components/CustomerNav'
import { STATUS_LABELS } from '../lib/statusLabels'

type Shipment = {
  id: string
  tracking_number: string
  recipient_name: string
  status: string
  total_charge: number | null
  created_at: string
}

export default function CustomerDashboard() {
  const [orders, setOrders] = useState<Shipment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) { setLoading(false); return }
      const { data } = await supabase
        .from('shipments')
        .select('id, tracking_number, recipient_name, status, total_charge, created_at')
        .eq('booked_by_user_id', userData.user.id)
        .order('created_at', { ascending: false })
      setOrders((data as Shipment[]) ?? [])
      setLoading(false)
    }
    load()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      <CustomerNav />
      <div className="max-w-2xl mx-auto px-6">
        <h1 className="text-xl font-semibold text-navy mb-4">My shipments</h1>
        <p className="text-xs text-slate mb-4">Your shipment history stays available in your account.</p>

        {loading && <p className="text-sm text-slate">Loading…</p>}
        {!loading && orders.length === 0 && <p className="text-sm text-slate">No shipments placed while logged in yet.</p>}

        <div className="space-y-2">
          {orders.map((o) => (
            <div key={o.id} className="bg-white rounded-lg shadow-sm p-4">
              <p className="font-mono text-navy font-medium">{o.tracking_number}</p>
              <p className="text-sm text-slate">To: {o.recipient_name}</p>
              <div className="flex justify-between items-center mt-1">
                <p className="text-xs text-slate">{STATUS_LABELS[o.status] ?? o.status} · {new Date(o.created_at).toLocaleDateString()}</p>
                {o.total_charge != null && <p className="text-sm font-semibold text-navy">GHS {o.total_charge.toFixed(2)}</p>}
              </div>
              <Link to={`/account/shipments/${o.id}`} className="text-sm text-orange underline mt-2 inline-block">Manage this shipment</Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
