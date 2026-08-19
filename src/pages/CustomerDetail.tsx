import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import StaffNav from '../components/StaffNav'
import { STATUS_LABELS } from '../lib/statusLabels'

type Customer = { id: string; name: string; phone: string | null; email: string | null }
type Shipment = { id: string; tracking_number: string; status: string; created_at: string; sender_name: string; recipient_name: string }

export default function CustomerDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [sent, setSent] = useState<Shipment[]>([])
  const [received, setReceived] = useState<Shipment[]>([])
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [saving, setSaving] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  function loadData() {
    if (!id) return
    supabase.from('customers').select('*').eq('id', id).maybeSingle().then(({ data }) => {
      const c = data as Customer
      setCustomer(c)
      if (c) { setName(c.name); setPhone(c.phone ?? ''); setEmail(c.email ?? '') }
    })
    supabase.from('shipments').select('id, tracking_number, status, created_at, sender_name, recipient_name')
      .eq('sender_customer_id', id).order('created_at', { ascending: false })
      .then(({ data }) => setSent((data as Shipment[]) ?? []))
    supabase.from('shipments').select('id, tracking_number, status, created_at, sender_name, recipient_name')
      .eq('recipient_customer_id', id).order('created_at', { ascending: false })
      .then(({ data }) => setReceived((data as Shipment[]) ?? []))
  }

  useEffect(() => { loadData() }, [id])

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault()
    if (!id) return
    setSaving(true)
    await supabase.from('customers').update({ name, phone: phone || null, email: email || null }).eq('id', id)
    setSaving(false)
    setEditing(false)
    loadData()
  }

  async function handleDelete() {
    if (!id) return
    setDeleting(true)
    setDeleteError(null)
    const { error } = await supabase.from('customers').delete().eq('id', id)
    setDeleting(false)
    if (error) {
      setDeleteError(error.message)
      return
    }
    navigate('/staff/customers')
  }

  if (!customer) return <div className="min-h-screen flex items-center justify-center text-slate">Loading…</div>

  const allOrders = [...sent, ...received]
  const delivered = allOrders.filter((o) => o.status === 'delivered')
  const notPickedUp = allOrders.filter((o) => o.status === 'pending')
  const inProgress = allOrders.filter((o) => !['delivered', 'pending', 'cancelled', 'failed'].includes(o.status))

  return (
    <div className="min-h-screen bg-gray-50 pb-24 md:pb-8">
      <StaffNav />
      <div className="max-w-2xl mx-auto px-6">
        <Link to="/staff/customers" className="text-orange underline text-sm">← All customers</Link>

        <div className="bg-white rounded-lg shadow-sm p-5 mt-4 mb-6">
          {!editing ? (
            <>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-lg font-semibold text-navy">{customer.name}</p>
                  <p className="text-sm text-slate">{customer.phone} {customer.email && `· ${customer.email}`}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => setEditing(true)} className="text-xs text-orange underline">Edit</button>
                  <button onClick={() => setConfirmingDelete(true)} className="text-xs text-red-600 underline">Delete</button>
                </div>
              </div>

              {confirmingDelete && (
                <div className="mt-3 bg-red-50 border border-red-200 rounded-md p-3">
                  <p className="text-sm text-red-800 mb-2">
                    Delete this customer record? This does not delete their past shipments — those stay in the system, just no longer linked to a saved contact card.
                  </p>
                  {deleteError && <p className="text-xs text-red-700 mb-2">Error: {deleteError}</p>}
                  <div className="flex gap-2">
                    <button onClick={() => { setConfirmingDelete(false); setDeleteError(null) }} className="flex-1 border border-gray-300 text-slate text-xs py-2 rounded-md">Cancel</button>
                    <button onClick={handleDelete} disabled={deleting} className="flex-1 bg-red-600 text-white text-xs py-2 rounded-md disabled:opacity-50">
                      {deleting ? 'Deleting…' : 'Confirm delete'}
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <form onSubmit={handleSaveEdit} className="space-y-2">
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" required className="w-full border rounded-md px-3 py-2 text-sm" />
              <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone" className="w-full border rounded-md px-3 py-2 text-sm" />
              <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="w-full border rounded-md px-3 py-2 text-sm" />
              <div className="flex gap-2">
                <button type="button" onClick={() => setEditing(false)} className="flex-1 border border-gray-300 text-slate text-sm py-2 rounded-md">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 bg-orange text-white text-sm py-2 rounded-md disabled:opacity-50">
                  {saving ? 'Saving…' : 'Save'}
                </button>
              </div>
            </form>
          )}
        </div>

        <div className="grid grid-cols-3 gap-2 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-3 text-center">
            <p className="text-xl font-bold text-navy">{delivered.length}</p>
            <p className="text-xs text-slate">Delivered</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-3 text-center">
            <p className="text-xl font-bold text-navy">{inProgress.length}</p>
            <p className="text-xs text-slate">In progress</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-3 text-center">
            <p className="text-xl font-bold text-navy">{notPickedUp.length}</p>
            <p className="text-xs text-slate">Not picked up</p>
          </div>
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
