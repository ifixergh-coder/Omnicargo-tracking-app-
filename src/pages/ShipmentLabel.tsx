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

// Fits an image inside a max box without distorting its proportions
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

  // Logo scaled to fit an 24×10mm box, keeping its real proportions
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

// On-screen preview only — the printable output comes from buildLabelPdf above
function LabelPreviewCard({ shipment, boxNumber, printedAt }: { shipment: Shipment; boxNumber: number; printedAt: string }) {
  const barcodeRef = useRef<SVGSVGElement>(null)
  useEffect(() => {
    if (barcodeRef.current) {
      JsBarcode(barcodeRef.current, shipment.tracking_number, { format: 'CODE128', width: 1.5, height: 40, displayValue: false, margin: 0 })
    }
  }, [shipment.tracking_number])

  const qrValue = `${window.location.origin}/staff/scan/${shipment.tracking_number}`

  return (
    <div className="w-[280px] mx-auto bg-white border-2 border-navy overflow-hidden flex flex-col mb-6" style={{ aspectRatio: '100 / 150' }}>
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
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    if (!id) return
    supabase.from('shipments').select('*').eq('id', id).maybeSingle()
      .then(({ data }) => setShipment(data as Shipment))
  }, [id])

  if (!shipment) return <div className="p-8 text-center text-slate">Loading…</div>

  const boxCount = shipment.box_count ?? 1
  const boxes = Array.from({ length: boxCount }, (_, i) => i + 1)

  async function handleDownload() {
    setGenerating(true)
    try {
      const doc = await buildLabelPdf(shipment!, printedAt)
      doc.save(`${shipment!.tracking_number}-label.pdf`)
    } finally {
      setGenerating(false)
    }
  }

  async function handleOpenToPrint() {
    setGenerating(true)
    try {
      const doc = await buildLabelPdf(shipment!, printedAt)
      const blobUrl = doc.output('bloburl')
      window.open(blobUrl as unknown as string, '_blank')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-md mx-auto mb-4 flex flex-wrap gap-3">
        <a href="/staff/shipments" className="text-orange underline text-sm self-center">← Back to shipments</a>
        <div className="ml-auto flex gap-2">
          <button onClick={handleDownload} disabled={generating} className="bg-navy text-white font-medium py-3 px-5 rounded-md disabled:opacity-50">
            {generating ? 'Generating…' : 'Download PDF'}
          </button>
          <button onClick={handleOpenToPrint} disabled={generating} className="bg-orange text-white font-medium py-3 px-5 rounded-md disabled:opacity-50">
            {generating ? 'Generating…' : 'Open to print'}
          </button>
        </div>
      </div>

      <div className="max-w-md mx-auto text-center text-xs text-slate mb-4">
        Preview below — the PDF exports at true 100×150mm (4×6in) regardless of what your browser's print dialog shows.
      </div>

      {boxes.map((n) => (
        <LabelPreviewCard key={n} shipment={shipment} boxNumber={n} printedAt={printedAt} />
      ))}
    </div>
  )
}
