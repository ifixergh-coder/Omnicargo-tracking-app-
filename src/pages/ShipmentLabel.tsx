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

function LabelCard({ shipment, boxNumber, printedAt }: { shipment: Shipment; boxNumber: number; printedAt: string }) {
  const barcodeRef = useRef<SVGSVGElement>(null)
  useEffect(() => {
    if (barcodeRef.current) {
      JsBarcode(barcodeRef.current, shipment.tracking_number, { format: 'CODE128', width: 1.5, height: 40, displayValue: false, margin: 0 })
    }
  }, [shipment.tracking_number])

  const qrValue = `${window.location.origin}/staff/scan/${shipment.tracking_number}`

  return (
    <div className="label-sheet bg-white border-2 border-navy overflow-hidden flex flex-col">
      <div className="px-3 py-2 flex items-center justify-between border-b-2 border-navy shrink-0">
        <img src="/omnicargo-logo.png" alt="OmniCargo" className="h-6" />
        <span className="text-[10px] font-semibold text-navy">STANDARD DELIVERY</span>
      </div>

      <div className="px-3 py-2 border-b border-gray-300 shrink-0">
        <svg ref={barcodeRef} className="w-full" />
        <p className="text-center font-mono font-bold text-base mt-0.5">{shipment.tracking_number}</p>
        {shipment.box_count > 1 && (
          <p className="text-center text-xs font-semibold text-orange mt-0.5">Box {boxNumber} of {shipment.box_count}</p>
        )}
      </div>

      <div className="grid grid-cols-2 divide-x divide-gray-300 border-b border-gray-300 shrink-0">
        <div className="px-3 py-2">
          <p className="text-[9px] font-semibold text-slate uppercase mb-0.5">Sender</p>
          <p className="text-xs font-medium">{maskName(shipment.sender_name)}</p>
          <p className="text-xs">{maskPhone(shipment.sender_phone)}</p>
        </div>
        <div className="px-3 py-2">
          <p className="text-[9px] font-semibold text-slate uppercase mb-0.5">Recipient</p>
          <p className="text-xs font-medium">{maskName(shipment.recipient_name)}</p>
          <p className="text-xs">{maskPhone(shipment.recipient_phone)}</p>
          {shipment.destination_address && <p className="text-xs mt-0.5 line-clamp-2">{shipment.destination_address}</p>}
          {shipment.destination_gps && <p className="text-[9px] text-slate mt-0.5">GPS: {shipment.destination_gps}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 divide-x divide-gray-300 border-b border-gray-300 text-center shrink-0">
        <div className="px-2 py-1.5">
          <p className="text-[9px] text-slate">Weight</p>
          <p className="font-semibold text-xs">{shipment.weight_kg ?? '—'} kg</p>
        </div>
        <div className="px-2 py-1.5">
          <p className="text-[9px] text-slate">CBM</p>
          <p className="font-semibold text-xs">{shipment.cbm?.toFixed(3) ?? '—'} m³</p>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2">
        <QRCodeSVG value={qrValue} size={72} />
        <p className="text-[8px] text-slate">Scan for full details</p>
      </div>

      <p className="text-[8px] text-slate text-center pb-1 shrink-0">Printed {printedAt}</p>
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
      <style>{`
        .label-sheet {
          width: 100mm;
          height: 150mm;
          margin: 0 auto 24px auto;
        }
        @media print {
          @page {
            size: 100mm 150mm;
            margin: 0;
          }
          .label-sheet {
            margin: 0;
            page-break-after: always;
            break-after: page;
          }
          .label-sheet:last-child {
            page-break-after: auto;
            break-after: auto;
          }
        }
      `}</style>

      <div className="max-w-md mx-auto mb-4 print:hidden flex gap-3">
        <a href="/staff/shipments" className="text-orange underline text-sm self-center">← Back to shipments</a>
        <button onClick={() => window.print()} className="ml-auto bg-orange text-white font-medium py-3 px-6 rounded-md">
          Print {boxCount > 1 ? `all ${boxCount} labels` : 'label'}
        </button>
      </div>

      <div className="print:hidden text-center text-xs text-slate mb-4">
        Preview shown at reduced size — prints at true 100×150mm (4×6in)
      </div>

      {boxes.map((n) => (
        <LabelCard key={n} shipment={shipment} boxNumber={n} printedAt={printedAt} />
      ))}
    </div>
  )
}
