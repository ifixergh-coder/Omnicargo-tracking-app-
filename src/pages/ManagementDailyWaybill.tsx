import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import ManagementNav from '../components/ManagementNav'

type Shipment = {
  tracking_number: string
  sender_name: string
  sender_phone: string | null
  recipient_name: string
  recipient_phone: string | null
  destination_address: string | null
  weight_kg: number | null
  cbm: number | null
  total_charge: number | null
  payment_status: string
}

export default function ManagementDailyWaybill() {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [items, setItems] = useState<Shipment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    const start = new Date(date); start.setHours(0, 0, 0, 0)
    const end = new Date(date); end.setHours(23, 59, 59, 999)

    supabase.from('shipments')
      .select('tracking_number, sender_name, sender_phone, recipient_name, recipient_phone, destination_address, weight_kg, cbm, total_charge, payment_status')
      .gte('created_at', start.toISOString())
      .lte('created_at', end.toISOString())
      .then(({ data }) => {
        setItems((data as Shipment[]) ?? [])
        setLoading(false)
      })
  }, [date])

  const totalWeight = items.reduce((sum, i) => sum + (i.weight_kg ?? 0), 0)
  const totalCbm = items.reduce((sum, i) => sum + (i.cbm ?? 0), 0)
  const totalRevenue = items.reduce((sum, i) => sum + (i.total_charge ?? 0), 0)
  const paidRevenue = items.filter((i) => i.payment_status === 'paid').reduce((sum, i) => sum + (i.total_charge ?? 0), 0)

  return (
    <div className="min-h-screen bg-gray-100 pb-8">
      <div className="print:hidden">
        <ManagementNav />
      </div>

      <div className="max-w-3xl mx-auto px-4">
        <div className="print:hidden flex flex-wrap items-center gap-3 mb-4">
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="border rounded-md px-3 py-2" />
          <button onClick={() => window.print()} className="bg-orange text-white font-medium py-2 px-6 rounded-md">
            Print
          </button>
        </div>

        <div className="bg-white p-8 print:p-4">
          <div className="flex items-center justify-between border-b-2 border-navy pb-4 mb-4">
            <img src="/omnicargo-logo.png" alt="OmniCargo" className="h-10" />
            <div className="text-right text-sm text-slate">
              <p className="font-semibold text-navy">OMNICARGO SOLUTIONS LTD — Management Copy</p>
              <p>Tel: +233535198367</p>
              <p className="text-xs">PCSRC License No: CLN127461221 · TIN: C0063468905</p>
            </div>
          </div>

          <h1 className="text-lg font-semibold text-navy mb-2">Daily Packing List / Waybill</h1>
          <p className="text-sm text-slate mb-4">Date: {new Date(date).toLocaleDateString()}</p>

          {loading && <p className="text-sm text-slate">Loading…</p>}

          <table className="w-full text-sm border-t border-gray-300">
            <thead>
              <tr className="border-b border-gray-300 text-left">
                <th className="py-2">Tracking #</th>
                <th className="py-2">Sender</th>
                <th className="py-2">Recipient</th>
                <th className="py-2">Address</th>
                <th className="py-2 text-right">Weight</th>
                <th className="py-2 text-right">CBM</th>
                <th className="py-2 text-right">Charge</th>
                <th className="py-2 text-right">Paid?</th>
              </tr>
            </thead>
            <tbody>
              {items.map((i) => (
                <tr key={i.tracking_number} className="border-b border-gray-100">
                  <td className="py-2 font-mono">{i.tracking_number}</td>
                  <td className="py-2">{i.sender_name}</td>
                  <td className="py-2">{i.recipient_name}{i.recipient_phone && ` · ${i.recipient_phone}`}</td>
                  <td className="py-2">{i.destination_address ?? '—'}</td>
                  <td className="py-2 text-right">{i.weight_kg ?? '—'} kg</td>
                  <td className="py-2 text-right">{i.cbm?.toFixed(3) ?? '—'} m³</td>
                  <td className="py-2 text-right">GHS {i.total_charge?.toFixed(2) ?? '—'}</td>
                  <td className="py-2 text-right">{i.payment_status === 'paid' ? '✓' : '—'}</td>
                </tr>
              ))}
              {!loading && items.length === 0 && (
                <tr><td colSpan={8} className="py-4 text-center text-slate">No shipments on this date.</td></tr>
              )}
            </tbody>
            <tfoot>
              <tr className="font-semibold">
                <td className="py-2" colSpan={4}>Total: {items.length} item(s)</td>
                <td className="py-2 text-right">{totalWeight.toFixed(2)} kg</td>
                <td className="py-2 text-right">{totalCbm.toFixed(3)} m³</td>
                <td className="py-2 text-right">GHS {totalRevenue.toFixed(2)}</td>
                <td></td>
              </tr>
              <tr>
                <td className="pt-1 text-sm text-slate" colSpan={8}>
                  Of which GHS {paidRevenue.toFixed(2)} confirmed paid, GHS {(totalRevenue - paidRevenue).toFixed(2)} still unpaid.
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  )
}
