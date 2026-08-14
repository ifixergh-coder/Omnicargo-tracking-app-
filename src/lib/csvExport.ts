function escapeCsvField(value: string | null | undefined): string {
  const v = value ?? ''
  if (v.includes(',') || v.includes('"') || v.includes('\n')) {
    return `"${v.replace(/"/g, '""')}"`
  }
  return v
}

type RegulatorRow = {
  senderFullName: string
  senderPhone: string
  recipientFullName: string
  recipientPhone: string
  pickupLocation: string
  deliveryLocation: string
  reference: string
  packageDescription: string
}

export function buildRegulatorCsv(rows: RegulatorRow[]): string {
  const header = [
    'Sender Full Name', 'Sender Phone', 'Recipient Full Name', 'Recipient Phone',
    'Pickup Location', 'Delivery Location', 'Reference', 'Package Description',
  ].join(',')

  const lines = rows.map((r) => [
    escapeCsvField(r.senderFullName),
    escapeCsvField(r.senderPhone),
    escapeCsvField(r.recipientFullName),
    escapeCsvField(r.recipientPhone),
    escapeCsvField(r.pickupLocation),
    escapeCsvField(r.deliveryLocation),
    escapeCsvField(r.reference),
    escapeCsvField(r.packageDescription),
  ].join(','))

  return [header, ...lines].join('\n')
}

export function downloadCsv(filename: string, csvContent: string) {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
