export function generateBatchNumber(): string {
  const year = new Date().getFullYear()
  const random = Array.from({ length: 5 }, () =>
    '0123456789ABCDEFGHJKLMNPQRSTUVWXYZ'.charAt(Math.floor(Math.random() * 34)),
  ).join('')
  return `WB-${year}-${random}`
}
