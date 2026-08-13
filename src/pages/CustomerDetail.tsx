import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import StaffNav from '../components/StaffNav'
import { STATUS_LABELS } from '../lib/statusLabels'

type Customer = { id: string; name: string; phone: string | null; email: string | null }
type Shipment = { id: string; tracking_number: string; status: string; created_at: string; sender_name: string; recipient_name: string }

export default function CustomerDetail() {
  const { id } = useParams()
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [sent, setSent] = useState<Shipment[]>([])
  const [received, setReceived] = useState<Shipment[]>([])

  useEffect(() => {
    if (!id) return
    supabase.from('customers').select('*').eq('id', id).maybeSingle().then(({ data }) => setCustomer(data as Customer))
    supabase.from('shipments').select('id, tracking_number, status, created_at, sender_name, recipient_name')
      .eq('sender_customer_id', id).order('created_at', { ascending: false })
      .then(({ data }) => setSent((data as Shipment[]) ?? []))
    supabase.from('shipments').select('id, tracking_number, status, created_at, sender_name, recipient_name')
      .eq('recipient_customer_id', id).order('created_at', { ascending: false })
      .then(({ data }) => setReceived((data as Shipment[]) ?? []))
  }, [id])

  if (!customer) return <div className="min-h-screen flex items-center justify-center text-slate">Loading…</div>

  return (
    <div className="min-h-screen bg-gray-50 pb-24 md:pb-8">
      <StaffNav />
      <div className="max-w-2xl mx-auto px-6">
        <Link to="/staff/customers" className="text-orange underline text-sm">← All customers</Link>
        <div className="bg-white rounded-lg shadow-sm p-5 mt-4 mb-6">
          <p className="text-lg font-semibold text-navy">{customer.name}</p>
          <p className="text-sm text-slate">{customer.phone} {customer.email && `· ${customer.email}`}</p>
        </div>

        <h2 className="text-sm font-semibold text-slate uppercase mb-2">Sent ({sent.length})</h2>
        <div className="space-y-2 mb-6">
          {sent.map((s) => (
            <Link key={s.id} to={`/staff/shipments/${s.id}/label`} className="block bg-white rounded-lg shadow-sm p-3 text-sm">
              <p className="font-mono text-navy">{s.tracking_number}</p>
              <p className="text-xs text-slate">To {s.recipient_name} · {STATUS_LABELS[s.status] ?? s.status} · {new Date(s.created_at).toLocaleDateString()}</p>
            </Link>
          ))}
          {sent.length === 0 && <p className="text-sm text-slate">No shipments sent.</p>}
        </div>

        <h2 className="text-sm font-semibold text-slate uppercase mb-2">Received ({received.length})</h2>
        <div className="space-y-2">
          {received.map((s) => (
            <Link key={s.id} to={`/staff/shipments/${s.id}/label`} className="block bg-white rounded-lg shadow-sm p-3 text-sm">
              <p className="font-mono text-navy">{s.tracking_number}</p>
              <p className="text-xs text-slate">From {s.sender_name} · {STATUS_LABELS[s.status] ?? s.status} · {new Date(s.created_at).toLocaleDateString()}</p>
            </Link>
          ))}
          {received.length === 0 && <p className="text-sm text-slate">No shipments received.</p>}
        </div>
      </div>
    </div>
  )
}
