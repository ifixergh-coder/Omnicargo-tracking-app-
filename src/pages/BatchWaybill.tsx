import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'

type Batch = {
  id: string
  batch_number: string
  origin: string | null
  destination: string | null
  created_at: string
  assigned_vehicle_id: string | null
}
type Vehicle = { driver_name: string | null; plate_number: string | null }
type Shipment = {
  tracking_number: string
  sender_name: string
  recipient_name: string
  recipient_phone: string | null
  destination_address: string | null
  weight_kg: number | null
  cbm: number | null
  box_count: number | null
}

export default function BatchWaybill() {
  const { id } = useParams()
  const [batch, setBatch] = useState<Batch | null>(null)
  const [vehicle, setVehicle] = useState<Vehicle | null>(null)
  const [items, setItems] = useState<Shipment[]>([])

  useEffect(() => {
    if (!id) return
    supabase.from('batches').select('*').eq('id', id).maybeSingle().then(async ({ data }) => {
      const b = data as Batch
      setBatch(b)
      if (b?.assigned_vehicle_id) {
        const { data: vData } = await supabase.from('vehicles').select('driver_name, plate_number').eq('id', b.assigned_vehicle_id).maybeSingle()
        setVehicle(vData as Vehicle)
      }
    })
    supabase.from('shipments')
      .select('tracking_number, sender_name, recipient_name, recipient_phone, destination_address, weight_kg, cbm, box_count')
      .eq('batch_id', id)
      .then(({ data }) => setItems((data as Shipment[]) ?? []))
  }, [id])

  if (!batch) return <div className="p-8 text-center text-slate">Loading…</div>

  const totalWeight = items.reduce((sum, i) => sum + (i.weight_kg ?? 0), 0)
  const totalCbm = items.reduce((sum, i) => sum + (i.cbm ?? 0), 0)
  const totalBoxes = items.reduce((sum, i) => sum + (i.box_count ?? 1), 0)

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4 print:bg-white print:p-0">
      <div className="max-w-4xl mx-auto mb-4 print:hidden">
        <button onClick={() => window.print()} className="bg-orange text-white font-medium py-3 px-6 rounded-md">
          Print waybill
        </button>
      </div>

      <div className="max-w-4xl mx-auto bg-white p-8 print:p-4">
        <div className="flex items-center justify-between border-b-2 border-navy pb-4 mb-4">
          <img src="/omnicargo-logo.png" alt="OmniCargo" className="h-10" />
          <div className="text-right text-sm text-slate">
            <p className="font-semibold text-navy">OMNICARGO SOLUTIONS LTD</p>
            <p>Tel: +233535198367</p>
            <p className="text-xs">PCSRC License No: CLN127461221 · TIN: C0063468905</p>
          </div>
        </div>

        <h1 className="text-lg font-semibold text-navy mb-2">Waybill — {batch.batch_number}</h1>
        <p className="text-sm text-slate mb-1">Route: {batch.origin ?? '—'} → {batch.destination ?? '—'}</p>
        <p className="text-sm text-slate mb-1">Date: {new Date(batch.created_at).toLocaleDateString()}</p>
        <p className="text-sm text-slate mb-4">
          Driver: {vehicle?.driver_name ?? '—'} · Vehicle plate: {vehicle?.plate_number ?? '—'}
        </p>

        <table className="w-full text-sm border-t border-gray-300 table-fixed">
          <colgroup>
            <col className="w-[15%]" />
            <col className="w-[16%]" />
            <col className="w-[18%]" />
            <col className="w-[21%]" />
            <col className="w-[9%]" />
            <col className="w-[11%]" />
            <col className="w-[10%]" />
          </colgroup>
          <thead>
            <tr className="border-b border-gray-300 text-left align-bottom">
              <th className="py-2 pr-2">Tracking #</th>
              <th className="py-2 pr-2">Sender</th>
              <th className="py-2 pr-2">Recipient</th>
              <th className="py-2 pr-2">Address</th>
              <th className="py-2 pr-2 text-right">Items</th>
              <th className="py-2 pr-2 text-right">Weight</th>
              <th className="py-2 text-right">CBM</th>
            </tr>
          </thead>
          <tbody>
            {items.map((i) => (
              <tr key={i.tracking_number} className="border-b border-gray-100 align-top">
                <td className="py-2 pr-2 font-mono break-all">{i.tracking_number}</td>
                <td className="py-2 pr-2 break-words">{i.sender_name}</td>
                <td className="py-2 pr-2 break-words">
                  {i.recipient_name}
                  {i.recipient_phone && <span className="block text-xs text-slate">{i.recipient_phone}</span>}
                </td>
                <td className="py-2 pr-2 break-words">{i.destination_address ?? '—'}</td>
                <td className="py-2 pr-2 text-right">{i.box_count ?? 1}</td>
                <td className="py-2 pr-2 text-right">{i.weight_kg ?? '—'} kg</td>
                <td className="py-2 text-right">{i.cbm?.toFixed(3) ?? '—'} m³</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="font-semibold">
              <td className="py-2 pr-2" colSpan={4}>Total: {items.length} shipment(s)</td>
              <td className="py-2 pr-2 text-right">{totalBoxes}</td>
              <td className="py-2 pr-2 text-right">{totalWeight.toFixed(2)} kg</td>
              <td className="py-2 text-right">{totalCbm.toFixed(3)} m³</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}
