import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { calculateCbm, calculateCharge } from '../lib/pricing'
import { getPublicPricing, PricingSettings } from '../lib/publicPricing'
import PublicNav from '../components/PublicNav'

export default function CalculatorPage() {
  const [lengthCm, setLengthCm] = useState('')
  const [widthCm, setWidthCm] = useState('')
  const [heightCm, setHeightCm] = useState('')
  const [weightKg, setWeightKg] = useState('')
  const [pricing, setPricing] = useState<PricingSettings | null>(null)

  useEffect(() => {
    getPublicPricing().then(setPricing)
  }, [])

  const cbm = useMemo(() => {
    const l = parseFloat(lengthCm), w = parseFloat(widthCm), h = parseFloat(heightCm)
    return (!l || !w || !h) ? 0 : calculateCbm(l, w, h)
  }, [lengthCm, widthCm, heightCm])

  const result = useMemo(() => {
    if (!pricing) return null
    return calculateCharge(cbm, parseFloat(weightKg) || 0, pricing.price_per_cbm, pricing.included_kg_per_cbm, pricing.extra_kg_rate)
  }, [cbm, weightKg, pricing])

  return (
    <div className="min-h-screen bg-gray-50">
      <PublicNav />
      <div className="max-w-lg mx-auto px-6 py-12">
        <h1 className="text-2xl font-bold text-navy mb-2">Calculate your delivery cost</h1>
        <p className="text-slate mb-6">Enter your package dimensions and weight for an estimate — free, no account needed.</p>

        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <p className="text-sm font-semibold text-slate uppercase mb-3">Not sure how to measure CBM?</p>
          <div className="bg-gray-100 rounded-md aspect-video flex items-center justify-center text-slate text-sm">
            Video coming soon
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="grid grid-cols-3 gap-2 mb-3">
            <input placeholder="Length (cm)" value={lengthCm} onChange={e => setLengthCm(e.target.value)} className="border rounded-md px-3 py-2" />
            <input placeholder="Width (cm)" value={widthCm} onChange={e => setWidthCm(e.target.value)} className="border rounded-md px-3 py-2" />
            <input placeholder="Height (cm)" value={heightCm} onChange={e => setHeightCm(e.target.value)} className="border rounded-md px-3 py-2" />
          </div>
          <p className="text-sm text-slate mb-3">CBM: <span className="font-semibold text-navy">{cbm.toFixed(4)} m³</span></p>
          <input placeholder="Weight (kg)" value={weightKg} onChange={e => setWeightKg(e.target.value)} className="w-full border rounded-md px-3 py-2 mb-4" />

          {result && (
            <div className="bg-gray-50 rounded-md p-4 text-center mb-4">
              <p className="text-xs text-slate uppercase">Estimated cost</p>
              <p className="text-2xl font-bold text-navy">GHS {result.total.toFixed(2)}</p>
              <p className="text-xs text-slate mt-1">Final cost confirmed at pickup</p>
            </div>
          )}

          <Link
            to="/book-pickup"
            className="block text-center bg-orange text-white font-medium py-3 rounded-md"
          >
            Book a pickup
          </Link>
        </div>
      </div>
    </div>
  )
}
