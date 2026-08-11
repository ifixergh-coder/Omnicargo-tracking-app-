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
