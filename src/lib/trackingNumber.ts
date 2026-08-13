// Generates tracking numbers like OMC4827193650182
export function generateTrackingNumber(): string {
  let digits = ''
  for (let i = 0; i < 13; i++) {
    digits += Math.floor(Math.random() * 10).toString()
  }
  return `OMC${digits}`
}
