import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import JsBarcode from 'jsbarcode'
import { QRCodeSVG } from 'qrcode.react'
import QRCode from 'qrcode'
import jsPDF from 'jspdf'
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

const NAVY: [number, number, number] = [15, 42, 74]
const ORANGE: [number, number, number] = [245, 130, 31]
const SLATE: [number, number, number] = [61, 74, 92]
const GRAY: [number, number, number] = [200, 200, 200]

type LoadedImage = { dataUrl: string; width: number; height: number }

function loadImage(url: string): Promise<LoadedImage> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')
      if (!ctx) return reject('no canvas context')
      ctx.drawImage(img, 0, 0)
      resolve({ dataUrl: canvas.toDataURL('image/png'), width: img.width, height: img.height })
    }
    img.onerror = reject
    img.src = url
  })
}

function fitWithinBox(imgWidth: number, imgHeight: number, maxWidth: number, maxHeight: number) {
  const ratio = Math.min(maxWidth / imgWidth, maxHeight / imgHeight)
  return { width: imgWidth * ratio, height: imgHeight * ratio }
}

function generateBarcodeDataUrl(value: string): string {
  const canvas = document.createElement('canvas')
  JsBarcode(canvas, value, { format: 'CODE128', displayValue: false, margin: 0, height: 60 })
  return canvas.toDataURL('image/png')
}

function drawLabelPage(
  doc: jsPDF,
  shipment: Shipment,
  boxNumber: number,
  boxCount: number,
  printedAt: string,
  logo: LoadedImage,
  qrDataUrl: string,
) {
  doc.setDrawColor(...NAVY)
  doc.setLineWidth(0.5)
  doc.rect(2, 2, 96, 146)

  const logoBox = fitWithinBox(logo.width, logo.height, 24, 10)
  doc.addImage(logo.dataUrl, 'PNG', 5, 5, logoBox.width, logoBox.height)

  doc.setFontSize(7)
  doc.setTextColor(...NAVY)
  doc.text('STANDARD DELIVERY', 95, 9, { align: 'right' })
  doc.setLineWidth(0.3)
  doc.line(2, 15, 98, 15)

  const barcodeDataUrl = generateBarcodeDataUrl(shipment.tracking_number)
  doc.addImage(barcodeDataUrl, 'PNG', 10, 18, 80, 15)
  doc.setFontSize(11)
  doc.setFont('courier', 'bold')
  doc.text(shipment.tracking_number, 50, 37, { align: 'center' })
  if (boxCount > 1) {
    doc.setFontSize(8)
    doc.setTextColor(...ORANGE)
    doc.text(`Box ${boxNumber} of ${boxCount}`, 50, 41, { align: 'center' })
  }
  doc.setTextColor(...NAVY)
  doc.setDrawColor(...NAVY)
  doc.line(2, 44, 98, 44)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7)
  doc.setTextColor(...SLATE)
  doc.text('SENDER', 5, 49)
  doc.text('RECIPIENT', 52, 49)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(0, 0, 0)
  doc.text(maskName(shipment.sender_name), 5, 54)
  doc.text(maskPhone(shipment.sender_phone), 5, 58)
  doc.text(maskName(shipment.recipient_name), 52, 54)
  doc.text(maskPhone(shipment.recipient_phone), 52, 58)

  let y = 62
  if (shipment.destination_address) {
    const lines = doc.splitTextToSize(shipment.destination_address, 44)
    doc.text(lines, 52, y)
    y += lines.length * 4
  }
  if (shipment.destination_gps) {
    doc.setFontSize(6.5)
    doc.setTextColor(...SLATE)
    doc.text(`GPS: ${shipment.destination_gps}`, 52, y)
  }

  doc.setDrawColor(...GRAY)
  doc.line(49, 46, 49, 78)
  doc.setDrawColor(...NAVY)
  doc.line(2, 80, 98, 80)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7)
  doc.setTextColor(...SLATE)
  doc.text('WEIGHT', 25, 85, { align: 'center' })
  doc.text('CBM', 75, 85, { align: 'center' })
  doc.setFontSize(9)
  doc.setTextColor(0, 0, 0)
  doc.text(`${shipment.weight_kg ?? '—'} kg`, 25, 90, { align: 'center' })
  doc.text(`${shipment.cbm?.toFixed(3) ?? '—'} m³`, 75, 90, { align: 'center' })

  doc.setDrawColor(...GRAY)
  doc.line(49, 82, 49, 92)
  doc.setDrawColor(...NAVY)
  doc.line(2, 94, 98, 94)

  doc.addImage(qrDataUrl, 'PNG', 35, 100, 30, 30)
  doc.setFontSize(6)
  doc.setTextColor(...SLATE)
  doc.text('Scan for full details', 50, 133, { align: 'center' })

  doc.setFontSize(6)
  doc.text(`Printed ${printedAt}`, 50, 145, { align: 'center' })
}

async function buildLabelPdf(shipment: Shipment, printedAt: string): Promise<jsPDF> {
  const logo = await loadImage('/omnicargo-logo.png')
  const qrValue = `${window.location.origin}/staff/scan/${shipment.tracking_number}`
  const qrDataUrl = await QRCode.toDataURL(qrValue, { width: 300, margin: 1 })

  const boxCount = shipment.box_count ?? 1
  const doc = new jsPDF({ unit: 'mm', format: [100, 150] })

  for (let i = 1; i <= boxCount; i++) {
    if (i > 1) doc.addPage([100, 150], 'portrait')
    drawLabelPage(doc, shipment, i, boxCount, printedAt, logo, qrDataUrl)
  }
  return doc
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
        <img src="/omnicargo-logo.png" alt="OmniCargo" className="h-6 w-auto object-contain" />
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
  const [generatingPdf, setGeneratingPdf] = useState(false)

  useEffect(() => {
    if (!id) return
    supabase.from('shipments').select('*').eq('id', id).maybeSingle()
      .then(({ data }) => setShipment(data as Shipment))
  }, [id])

  if (!shipment) return <div className="p-8 text-center text-slate">Loading…</div>

  const boxCount = shipment.box_count ?? 1
  const boxes = Array.from({ length: boxCount }, (_, i) => i + 1)

  async function handleDownloadPdf() {
    setGeneratingPdf(true)
    try {
      const doc = await buildLabelPdf(shipment!, printedAt)
      doc.save(`${shipment!.tracking_number}-label.pdf`)
    } finally {
      setGeneratingPdf(false)
    }
  }

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

      <div className="max-w-md mx-auto mb-4 print:hidden flex flex-wrap gap-3">
        <a href="/staff/shipments" className="text-orange underline text-sm self-center">← Back to shipments</a>
        <div className="ml-auto flex gap-2">
          <button onClick={handleDownloadPdf} disabled={generatingPdf} className="bg-navy text-white font-medium py-3 px-5 rounded-md disabled:opacity-50">
            {generatingPdf ? 'Generating…' : 'Download PDF'}
          </button>
          <button onClick={() => window.print()} className="bg-orange text-white font-medium py-3 px-6 rounded-md">
            Print {boxCount > 1 ? `all ${boxCount} labels` : 'label'}
          </button>
        </div>
      </div>

      <div className="print:hidden text-center text-xs text-slate mb-4">
        "Print" opens your printer dialog directly — set paper size to 100×150mm (4×6in) there if not auto-selected.
        "Download PDF" saves a file already sized correctly, for printers that need an exact-size file instead.
      </div>

      {boxes.map((n) => (
        <LabelCard key={n} shipment={shipment} boxNumber={n} printedAt={printedAt} />
      ))}
    </div>
  )
}
