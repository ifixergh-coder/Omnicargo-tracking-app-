export function calculateCbm(lengthCm: number, widthCm: number, heightCm: number): number {
  return (lengthCm * widthCm * heightCm) / 1_000_000
}

export function calculateCharge(
  cbm: number,
  weightKg: number,
  pricePerCbm: number,
  includedKgPerCbm: number,
  extraKgRate: number,
) {
  const baseCharge = cbm * pricePerCbm
  const allowance = cbm * includedKgPerCbm
  const excessWeightKg = Math.max(0, weightKg - allowance)
  const excessCharge = excessWeightKg * extraKgRate
  return { baseCharge, excessWeightKg, excessCharge, total: baseCharge + excessCharge }
}
// Your stated prices are VAT-inclusive — this splits a total back into
// its pre-VAT base and the 20% VAT component, for invoices and reporting
export function splitVat(totalInclusive: number, vatRate = 0.20) {
  const base = totalInclusive / (1 + vatRate)
  const vat = totalInclusive - base
  return { base, vat, total: totalInclusive }
}
