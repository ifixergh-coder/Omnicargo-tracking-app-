import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { buildRegulatorCsv, downloadCsv } from '../lib/csvExport'
import StaffNav from '../components/StaffNav'

type Shipment = {
  tracking_number: string
  sender_name: string
  sender_phone: string | null
  recipient_name: string
  recipient_phone: string | null
  pickup_location: string | null
  destination_address: string | null
  package_description: string | null
  weight_kg: number | null
  cbm: number | null
}

export default function DailyWaybill() {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [items, setItems] = useState<Shipment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    const start = new Date(date); start.setHours(0, 0, 0, 0)
    const end = new Date(date); end.setHours(23, 59, 59, 999)

    supabase.from('shipments')
      .select('tracking_number, sender_name, sender_phone, recipient_name, recipient_phone, pickup_location, destination_address, package_description, weight_kg, cbm')
      .gte('created_at', start.toISOString())
      .lte('created_at', end.toISOString())
      .then(({ data }) => {
        setItems((data as Shipment[]) ?? [])
        setLoading(false)
      })
  }, [date])

  const totalWeight = items.reduce((sum, i) => sum + (i.weight_kg ?? 0), 0)
  const totalCbm = items.reduce((sum, i) => sum + (i.cbm ?? 0), 0)

  function handleRegulatorExport() {
    const csv = buildRegulatorCsv(
      items.map((i) => ({
        senderFullName: i.sender_name,
        senderPhone: i.sender_phone ?? '',
        recipientFullName: i.recipient_name,
        recipientPhone: i.recipient_phone ?? '',
        pickupLocation: i.pickup_location ?? '',
        deliveryLocation: i.destination_address ?? '',
        reference: i.tracking_number,
        packageDescription: i.package_description ?? '',
      }))
    )
    downloadCsv(`omnicargo-deliveries-${date}.csv`, csv)
  }

  return (
    <div className="min-h-screen bg-gray-100 pb-24 md:pb-8">
      <div className="print:hidden">
        <StaffNav />
      </div>

      <div className="max-w-3xl mx-auto px-4">
        <div className="print:hidden flex flex-wrap items-center gap-3 mb-4">
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="border rounded-md px-3 py-2" />
          <button onClick={() => window.print()} className="bg-orange text-white font-medium py-2 px-6 rounded-md">
            Print
          </button>
          <button onClick={handleRegulatorExport} disabled={items.length === 0} className="bg-navy text-white font-medium py-2 px-6 rounded-md disabled:opacity-50">
            Export CSV for regulator
          </button>
        </div>

        <div className="bg-white p-8 print:p-4">
          <div className="flex items-center justify-between border-b-2 border-navy pb-4 mb-4">
            <img src="/omnicargo-logo.png" alt="OmniCargo" className="h-10" />
            <div className="text-right text-sm text-slate">
              <p className="font-semibold text-navy">OMNICARGO SOLUTIONS LTD</p>
              <p>Tel: [phone] · Email: [email]</p>
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
                </tr>
              ))}
              {!loading && items.length === 0 && (
                <tr><td colSpan={6} className="py-4 text-center text-slate">No shipments on this date.</td></tr>
              )}
            </tbody>
            <tfoot>
              <tr className="font-semibold">
                <td className="py-2" colSpan={4}>Total: {items.length} item(s)</td>
                <td className="py-2 text-right">{totalWeight.toFixed(2)} kg</td>
                <td className="py-2 text-right">{totalCbm.toFixed(3)} m³</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  )
}
