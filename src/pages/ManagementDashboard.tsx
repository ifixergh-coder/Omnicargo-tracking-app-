import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import ManagementNav from '../components/ManagementNav'

type Shipment = {
  id: string
  tracking_number: string
  sender_name: string
  recipient_name: string
  total_charge: number | null
  payment_status: string
  paid_at: string | null
  created_at: string
}

function startOfDay(d: Date) { const x = new Date(d); x.setHours(0, 0, 0, 0); return x }
function startOfWeek(d: Date) { const x = startOfDay(d); const day = x.getDay(); x.setDate(x.getDate() - day); return x }
function startOfMonth(d: Date) { return new Date(d.getFullYear(), d.getMonth(), 1) }
function startOfYear(d: Date) { return new Date(d.getFullYear(), 0, 1) }

export default function ManagementDashboard() {
  const [shipments, setShipments] = useState<Shipment[]>([])
  const [loading, setLoading] = useState(true)
  const [markingPaid, setMarkingPaid] = useState<string | null>(null)

  function loadData() {
    setLoading(true)
    supabase
      .from('shipments')
      .select('id, tracking_number, sender_name, recipient_name, total_charge, payment_status, paid_at, created_at')
      .then(({ data }) => {
        setShipments((data as Shipment[]) ?? [])
        setLoading(false)
      })
  }

  useEffect(() => { loadData() }, [])

  const now = new Date()
  const paid = shipments.filter((s) => s.payment_status === 'paid' && s.paid_at)

  function sumBetween(start: Date, end?: Date) {
    return paid
      .filter((s) => {
        const paidDate = new Date(s.paid_at as string)
        return paidDate >= start && (!end || paidDate < end)
      })
      .reduce((sum, s) => sum + (s.total_charge ?? 0), 0)
  }

  const today = startOfDay(now)
  const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1)

  const revenueToday = sumBetween(today)
  const revenueYesterday = sumBetween(yesterday, today)
  const revenueWeek = sumBetween(startOfWeek(now))
  const revenueMonth = sumBetween(startOfMonth(now))
  const revenueYear = sumBetween(startOfYear(now))

  const unpaid = shipments.filter((s) => s.payment_status === 'unpaid')
  const unpaidTotal = unpaid.reduce((sum, s) => sum + (s.total_charge ?? 0), 0)

  async function markPaid(id: string) {
    setMarkingPaid(id)
    const { error } = await supabase
      .from('shipments')
      .update({ payment_status: 'paid', paid_at: new Date().toISOString() })
      .eq('id', id)
    setMarkingPaid(null)
    if (error) {
      alert(error.message)
      return
    }
    loadData()
  }

  const cards = [
    { label: 'Today', value: revenueToday },
    { label: 'Yesterday', value: revenueYesterday },
    { label: 'This week', value: revenueWeek },
    { label: 'This month', value: revenueMonth },
    { label: 'This year', value: revenueYear },
  ]

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      <ManagementNav />
      <div className="max-w-4xl mx-auto px-6">
        <h1 className="text-xl font-semibold text-navy mb-6">Revenue overview</h1>

        {loading && <p className="text-sm text-slate">Loading…</p>}

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-8">
          {cards.map((c) => (
            <div key={c.label} className="bg-white rounded-lg shadow-sm p-4">
              <p className="text-xs text-slate uppercase mb-1">{c.label}</p>
              <p className="text-lg font-bold text-navy">GHS {c.value.toFixed(2)}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-lg shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate uppercase">Unpaid invoices ({unpaid.length})</h2>
            <p className="text-sm font-semibold text-navy">Total owed: GHS {unpaidTotal.toFixed(2)}</p>
          </div>

          {unpaid.length === 0 && <p className="text-sm text-slate">No unpaid invoices.</p>}

          <div className="space-y-2">
            {unpaid.map((s) => (
              <div key={s.id} className="flex items-center justify-between border-b border-gray-100 pb-2 text-sm">
                <div>
                  <Link to={`/staff/shipments/${s.id}/invoice`} className="font-mono text-navy underline">
                    {s.tracking_number}
                  </Link>
                  <p className="text-xs text-slate">{s.sender_name} → {s.recipient_name} · {new Date(s.created_at).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-3">
                  <p className="font-semibold text-navy">GHS {s.total_charge?.toFixed(2) ?? '—'}</p>
                  <button
                    onClick={() => markPaid(s.id)}
                    disabled={markingPaid === s.id}
                    className="text-xs bg-orange text-white px-3 py-1.5 rounded-md disabled:opacity-50"
                  >
                    {markingPaid === s.id ? 'Marking…' : 'Mark paid'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
