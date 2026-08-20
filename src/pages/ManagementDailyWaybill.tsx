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
  box_count: number | null
  total_charge: number | null
  payment_status: string
  assigned_vehicle_id: string | null
}

type Vehicle = { id: string; driver_name: string | null; plate_number: string | null }

export default function ManagementDailyWaybill() {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [items, setItems] = useState<Shipment[]>([])
  const [vehicles, setVehicles] = useState<Record<string, Vehicle>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    const start = new Date(date); start.setHours(0, 0, 0, 0)
    const end = new Date(date); end.setHours(23, 59, 59, 999)

    supabase.from('shipments')
      .select('tracking_number, sender_name, sender_phone, recipient_name, recipient_phone, destination_address, weight_kg, cbm, box_count, total_charge, payment_status, assigned_vehicle_id')
      .gte('created_at', start.toISOString())
      .lte('created_at', end.toISOString())
      .then(async ({ data }) => {
        const list = (data as Shipment[]) ?? []
        setItems(list)

        const vehicleIds = [...new Set(list.map((i) => i.assigned_vehicle_id).filter(Boolean))] as string[]
        if (vehicleIds.length > 0) {
          const { data: vData } = await supabase.from('vehicles').select('id, driver_name, plate_number').in('id', vehicleIds)
          const map: Record<string, Vehicle> = {}
          for (const v of (vData as Vehicle[]) ?? []) map[v.id] = v
          setVehicles(map)
        } else {
          setVehicles({})
        }
        setLoading(false)
      })
  }, [date])

  const totalWeight = items.reduce((sum, i) => sum + (i.weight_kg ?? 0), 0)
  const totalCbm = items.reduce((sum, i) => sum + (i.cbm ?? 0), 0)
  const totalBoxes = items.reduce((sum, i) => sum + (i.box_count ?? 1), 0)
  const totalRevenue = items.reduce((sum, i) => sum + (i.total_charge ?? 0), 0)
  const paidRevenue = items.filter((i) => i.payment_status === 'paid').reduce((sum, i) => sum + (i.total_charge ?? 0), 0)

  return (
    <div className="min-h-screen bg-gray-100 pb-8">
      <div className="print:hidden">
        <ManagementNav />
      </div>

      <div className="max-w-6xl mx-auto px-4">
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

          <table className="w-full text-sm border-t border-gray-300 table-fixed">
            <colgroup>
              <col className="w-[12%]" />
              <col className="w-[11%]" />
              <col className="w-[14%]" />
              <col className="w-[14%]" />
              <col className="w-[15%]" />
              <col className="w-[6%]" />
              <col className="w-[8%]" />
              <col className="w-[7%]" />
              <col className="w-[9%]" />
              <col className="w-[6%]" />
            </colgroup>
            <thead>
              <tr className="border-b border-gray-300 text-left align-bottom">
                <th className="py-2 pr-2">Tracking #</th>
                <th className="py-2 pr-2">Sender</th>
                <th className="py-2 pr-2">Recipient</th>
                <th className="py-2 pr-2">Address</th>
                <th className="py-2 pr-2">Driver / Plate</th>
                <th className="py-2 pr-2 text-right">Items</th>
                <th className="py-2 pr-2 text-right">Weight</th>
                <th className="py-2 pr-2 text-right">CBM</th>
                <th className="py-2 pr-2 text-right">Charge</th>
                <th className="py-2 text-right">Paid?</th>
              </tr>
            </thead>
            <tbody>
              {items.map((i) => {
                const v = i.assigned_vehicle_id ? vehicles[i.assigned_vehicle_id] : null
                return (
                  <tr key={i.tracking_number} className="border-b border-gray-100 align-top">
                    <td className="py-2 pr-2 font-mono break-all">{i.tracking_number}</td>
                    <td className="py-2 pr-2 break-words">{i.sender_name}</td>
                    <td className="py-2 pr-2 break-words">
                      {i.recipient_name}
                      {i.recipient_phone && <span className="block text-xs text-slate">{i.recipient_phone}</span>}
                    </td>
                    <td className="py-2 pr-2 break-words">{i.destination_address ?? '—'}</td>
                    <td className="py-2 pr-2 break-words">
                      {v ? (
                        <>
                          {v.driver_name ?? '—'}
                          <span className="block text-xs text-slate">{v.plate_number ?? 'No plate'}</span>
                        </>
                      ) : '—'}
                    </td>
                    <td className="py-2 pr-2 text-right">{i.box_count ?? 1}</td>
                    <td className="py-2 pr-2 text-right">{i.weight_kg ?? '—'} kg</td>
                    <td className="py-2 pr-2 text-right">{i.cbm?.toFixed(3) ?? '—'} m³</td>
                    <td className="py-2 pr-2 text-right">GHS {i.total_charge?.toFixed(2) ?? '—'}</td>
                    <td className="py-2 text-right">{i.payment_status === 'paid' ? '✓' : '—'}</td>
                  </tr>
                )
              })}
              {!loading && items.length === 0 && (
                <tr><td colSpan={10} className="py-4 text-center text-slate">No shipments on this date.</td></tr>
              )}
            </tbody>
            <tfoot>
              <tr className="font-semibold">
                <td className="py-2 pr-2" colSpan={5}>Total: {items.length} shipment(s)</td>
                <td className="py-2 pr-2 text-right">{totalBoxes}</td>
                <td className="py-2 pr-2 text-right">{totalWeight.toFixed(2)} kg</td>
                <td className="py-2 pr-2 text-right">{totalCbm.toFixed(3)} m³</td>
                <td className="py-2 pr-2 text-right">GHS {totalRevenue.toFixed(2)}</td>
                <td></td>
              </tr>
              <tr>
                <td className="pt-1 text-sm text-slate" colSpan={10}>
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
