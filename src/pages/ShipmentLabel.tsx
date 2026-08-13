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
  box_count: number
  status: string
}

function LabelCard({ shipment, boxNumber, printedAt, barcodeId }: { shipment: Shipment; boxNumber: number; printedAt: string; barcodeId: string }) {
  const barcodeRef = useRef<SVGSVGElement>(null)
  useEffect(() => {
    if (barcodeRef.current) {
      JsBarcode(barcodeRef.current, shipment.tracking_number, { format: 'CODE128', width: 2, height: 50, displayValue: false, margin: 0 })
    }
  }, [shipment.tracking_number])

  const qrValue = `${window.location.origin}/staff/scan/${shipment.tracking_number}`

  return (
    <div id={barcodeId} className="max-w-md mx-auto bg-white border-2 border-navy rounded-lg overflow-hidden print:border print:rounded-none print:break-after-page mb-6 print:mb-0">
      <div className="px-4 py-3 flex items-center justify-between border-b-2 border-navy">
        <img src="/omnicargo-logo.png" alt="OmniCargo" className="h-8" />
        <span className="text-xs font-semibold text-navy">STANDARD DELIVERY</span>
      </div>

      <div className="px-4 py-3 border-b border-gray-300">
        <svg ref={barcodeRef} className="w-full" />
        <p className="text-center font-mono font-bold text-lg mt-1">{shipment.tracking_number}</p>
        {shipment.box_count > 1 && (
          <p className="text-center text-sm font-semibold text-orange mt-1">Box {boxNumber} of {shipment.box_count}</p>
        )}
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

      <p className="text-[10px] text-slate text-center pb-2">Printed {printedAt}</p>
    </div>
  )
}

export default function ShipmentLabel() {
  const { id } = useParams()
  const [shipment, setShipment] = useState<Shipment | null>(null)
  const [printedAt] = useState(() => new Date().toLocaleString())

  useEffect(() => {
    if (!id) return
    supabase.from('shipments').select('*').eq('id', id).maybeSingle()
      .then(({ data }) => setShipment(data as Shipment))
  }, [id])

  if (!shipment) return <div className="p-8 text-center text-slate">Loading…</div>

  const boxCount = shipment.box_count ?? 1
  const boxes = Array.from({ length: boxCount }, (_, i) => i + 1)

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4 print:bg-white print:p-0">
      <div className="max-w-md mx-auto mb-4 print:hidden flex gap-3">
        <a href="/staff/shipments" className="text-orange underline text-sm self-center">← Back to shipments</a>
        <button onClick={() => window.print()} className="ml-auto bg-orange text-white font-medium py-3 px-6 rounded-md">
          Print {boxCount > 1 ? `all ${boxCount} labels` : 'label'}
        </button>
      </div>

      {boxes.map((n) => (
        <LabelCard key={n} shipment={shipment} boxNumber={n} printedAt={printedAt} barcodeId={`label-box-${n}`} />
      ))}
    </div>
  )
}
