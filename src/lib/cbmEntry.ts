import { calculateCbm } from './pricing'

export function resolveCbm(mode: 'dimensions' | 'direct', directCbm: string, lengthCm: string, widthCm: string, heightCm: string): number {
  if (mode === 'direct') {
    return parseFloat(directCbm) || 0
  }
  const l = parseFloat(lengthCm), w = parseFloat(widthCm), h = parseFloat(heightCm)
  return (!l || !w || !h) ? 0 : calculateCbm(l, w, h)
}
