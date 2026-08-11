// Generates tracking numbers like OMC-2026-4F82K1
// Format: prefix - year - 6 random base36 chars (uppercase)
export function generateTrackingNumber(prefix = 'OMC'): string {
  const year = new Date().getFullYear()
  const random = Array.from({ length: 6 }, () =>
    '0123456789ABCDEFGHJKLMNPQRSTUVWXYZ'.charAt(Math.floor(Math.random() * 34)),
  ).join('')
  return `${prefix}-${year}-${random}`
}
