import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'

type Shipment = {
  tracking_number: string
  sender_name: string
  sender_phone: string | null
  sender_email: string | null
  weight_kg: number | null
  cbm: number | null
  total_charge: number | null
  created_at: string
}

export default function ShipmentInvoice() {
  const { id } = useParams()
  const [shipment, setShipment] = useState<Shipment | null>(null)

  useEffect(() => {
    if (!id) return
    supabase.from('shipments').select('*').eq('id', id).maybeSingle()
      .then(({ data }) => setShipment(data as Shipment))
  }, [id])

  if (!shipment) return <div className="p-8 text-center text-slate">Loading…</div>

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4 print:bg-white print:p-0">
      <div className="max-w-lg mx-auto mb-4 print:hidden">
        <button onClick={() => window.print()} className="w-full bg-orange text-white font-medium py-3 rounded-md">
          Print invoice
        </button>
      </div>

      <div className="max-w-lg mx-auto bg-white p-8 print:p-4">
        <div className="text-center mb-6 border-b-2 border-navy pb-4">
          <h1 className="text-2xl font-bold text-navy">OMNICARGO SOLUTIONS LTD</h1>
          <p className="text-sm text-slate mt-1">Tema / Accra, Ghana</p>
          <p className="text-sm text-slate">Tel: +233535198367</p>
          <p className="text-xs text-slate mt-1">PCSRC License No: CLN127461221 · TIN: C0063468905</p>
        </div>

        <h2 className="text-lg font-semibold text-navy mb-4">Shipping Invoice</h2>

        <div className="space-y-1 mb-6 text-sm">
          <p><span className="font-medium">Tracking number:</span> {shipment.tracking_number}</p>
          <p><span className="font-medium">Date:</span> {new Date(shipment.created_at).toLocaleDateString()}</p>
        </div>

        <div className="mb-6">
          <p className="text-xs font-semibold text-slate uppercase mb-1">Sender</p>
          <p className="text-sm">{shipment.sender_name}</p>
          {shipment.sender_phone && <p className="text-sm">{shipment.sender_phone}</p>}
          {shipment.sender_email && <p className="text-sm">{shipment.sender_email}</p>}
        </div>

        <table className="w-full text-sm border-t border-b border-gray-300 mb-4">
          <tbody>
            <tr className="border-b border-gray-200">
              <td className="py-2">Weight</td>
              <td className="py-2 text-right">{shipment.weight_kg ?? '—'} kg</td>
            </tr>
            <tr className="border-b border-gray-200">
              <td className="py-2">CBM</td>
              <td className="py-2 text-right">{shipment.cbm?.toFixed(3) ?? '—'} m³</td>
            </tr>
            <tr>
              <td className="py-2 font-semibold">Total charge</td>
              <td className="py-2 text-right font-semibold">GHS {shipment.total_charge?.toFixed(2) ?? '—'}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
