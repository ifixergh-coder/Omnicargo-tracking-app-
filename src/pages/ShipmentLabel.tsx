import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import JsBarcode from 'jsbarcode'
import { QRCodeSVG } from 'qrcode.react'
import { supabase } from '../lib/supabase'
import { maskName, maskPhone } from '../lib/mask'

type Shipment = {
  id: string
  tracking_number: string
  sender_name: string
  sender_phone: string | null
  recipient_name: string
  recipient_phone: string | null
  destination_address: string | null
  destination_gps: string | null
  weight_kg: number | null
  cbm: number | null
  status: string
}

export default function ShipmentLabel() {
  const { id } = useParams()
  const [shipment, setShipment] = useState<Shipment | null>(null)
  const barcodeRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (!id) return
    supabase.from('shipments').select('*').eq('id', id).maybeSingle()
      .then(({ data }) => setShipment(data as Shipment))
  }, [id])

  useEffect(() => {
    if (shipment && barcodeRef.current) {
      JsBarcode(barcodeRef.current, shipment.tracking_number, {
        format: 'CODE128', width: 2, height: 50, displayValue: false, margin: 0,
      })
    }
  }, [shipment])

  if (!shipment) return <div className="p-8 text-center text-slate">Loading…</div>

  const qrValue = `${window.location.origin}/staff/scan/${shipment.tracking_number}`

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4 print:bg-white print:p-0">
      <div className="max-w-md mx-auto mb-4 print:hidden flex gap-3">
        <a href={`/staff/shipments`} className="text-orange underline text-sm self-center">← Back to shipments</a>
        <button onClick={() => window.print()} className="ml-auto bg-orange text-white font-medium py-3 px-6 rounded-md">
          Print label
        </button>
      </div>

      <div className="max-w-md mx-auto bg-white border-2 border-navy rounded-lg overflow-hidden print:border print:rounded-none">
        <div className="bg-navy text-white px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-orange" />
            <span className="font-bold">OmniCargo</span>
          </div>
          <span className="text-xs">STANDARD DELIVERY</span>
        </div>

        <div className="px-4 py-3 border-b border-gray-300">
          <svg ref={barcodeRef} className="w-full" />
          <p className="text-center font-mono font-bold text-lg mt-1">{shipment.tracking_number}</p>
        </div>

        <div className="grid grid-cols-2 divide-x divide-gray-300 border-b border-gray-300">
          <div className="px-4 py-3">
            <p className="text-xs font-semibold text-slate uppercase mb-1">Sender</p>
            <p className="text-sm font-medium">{maskName(shipment.sender_name)}</p>
            <p className="text-sm">{maskPhone(shipment.sender_phone)}</p>
          </div>
          <div className="px-4 py-3">
            <p className="text-xs font-semibold text-slate uppercase mb-1">Recipient</p>
            <p className="text-sm font-medium">{maskName(shipment.recipient_name)}</p>
            <p className="text-sm">{maskPhone(shipment.recipient_phone)}</p>
            {shipment.destination_address && <p className="text-sm mt-1">{shipment.destination_address}</p>}
            {shipment.destination_gps && <p className="text-xs text-slate mt-1">GPS: {shipment.destination_gps}</p>}
          </div>
        </div>

        <div className="grid grid-cols-2 divide-x divide-gray-300 border-b border-gray-300 text-center">
          <div className="px-2 py-3">
            <p className="text-xs text-slate">Weight</p>
            <p className="font-semibold">{shipment.weight_kg ?? '—'} kg</p>
          </div>
          <div className="px-2 py-3">
            <p className="text-xs text-slate">CBM</p>
            <p className="font-semibold">{shipment.cbm?.toFixed(3) ?? '—'} m³</p>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center py-4 gap-1">
          <QRCodeSVG value={qrValue} size={120} />
          <p className="text-[10px] text-slate">Scan for full details</p>
        </div>
      </div>
    </div>
  )
}
