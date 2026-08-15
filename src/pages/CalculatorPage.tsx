import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { calculateCharge } from '../lib/pricing'
import { resolveCbm } from '../lib/cbmEntry'
import { getPublicPricing, PricingSettings } from '../lib/publicPricing'
import PublicNav from '../components/PublicNav'

export default function CalculatorPage() {
  const navigate = useNavigate()
  const [mode, setMode] = useState<'dimensions' | 'direct'>('dimensions')
  const [directCbm, setDirectCbm] = useState('')
  const [lengthCm, setLengthCm] = useState('')
  const [widthCm, setWidthCm] = useState('')
  const [heightCm, setHeightCm] = useState('')
  const [weightKg, setWeightKg] = useState('')
  const [boxCount, setBoxCount] = useState('1')
  const [pricing, setPricing] = useState<PricingSettings | null>(null)

  useEffect(() => {
    getPublicPricing().then(setPricing)
  }, [])

  const cbm = useMemo(
    () => resolveCbm(mode, directCbm, lengthCm, widthCm, heightCm),
    [mode, directCbm, lengthCm, widthCm, heightCm],
  )

  const result = useMemo(() => {
    if (!pricing) return null
    return calculateCharge(cbm, parseFloat(weightKg) || 0, pricing.price_per_cbm, pricing.included_kg_per_cbm, pricing.extra_kg_rate)
  }, [cbm, weightKg, pricing])

  function handleBookPickup() {
    const params = new URLSearchParams({
      cbmMode: mode,
      cbm: String(cbm),
      lengthCm, widthCm, heightCm,
      weightKg, boxCount,
    })
    navigate(`/book-pickup?${params.toString()}`)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PublicNav />
      <div className="max-w-lg mx-auto px-6 py-12">
        <h1 className="text-2xl font-bold text-navy mb-2">Calculate your delivery cost</h1>
        <p className="text-slate mb-6">Enter your package details for an estimate — free, no account needed.</p>

        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <p className="text-sm font-semibold text-slate uppercase mb-3">Not sure how to measure CBM?</p>
          <div className="bg-gray-100 rounded-md aspect-video flex items-center justify-center text-slate text-sm">
            Video coming soon
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex gap-2 mb-4">
            <button
              type="button"
              onClick={() => setMode('dimensions')}
              className={`flex-1 py-2 rounded-md text-sm font-medium ${mode === 'dimensions' ? 'bg-navy text-white' : 'bg-gray-100 text-slate'}`}
            >
              I'll enter dimensions
            </button>
            <button
              type="button"
              onClick={() => setMode('direct')}
              className={`flex-1 py-2 rounded-md text-sm font-medium ${mode === 'direct' ? 'bg-navy text-white' : 'bg-gray-100 text-slate'}`}
            >
              I know my CBM
            </button>
          </div>

          {mode === 'dimensions' ? (
            <>
              <div className="grid grid-cols-3 gap-2 mb-3">
                <input placeholder="Length (cm)" value={lengthCm} onChange={e => setLengthCm(e.target.value)} className="border rounded-md px-3 py-2" />
                <input placeholder="Width (cm)" value={widthCm} onChange={e => setWidthCm(e.target.value)} className="border rounded-md px-3 py-2" />
                <input placeholder="Height (cm)" value={heightCm} onChange={e => setHeightCm(e.target.value)} className="border rounded-md px-3 py-2" />
              </div>
              <p className="text-sm text-slate mb-3">CBM: <span className="font-semibold text-navy">{cbm.toFixed(4)} m³</span></p>
            </>
          ) : (
            <input
              placeholder="CBM (m³)"
              value={directCbm}
              onChange={e => setDirectCbm(e.target.value)}
              className="w-full border rounded-md px-3 py-2 mb-3"
            />
          )}

          <input placeholder="Weight (kg)" value={weightKg} onChange={e => setWeightKg(e.target.value)} className="w-full border rounded-md px-3 py-2 mb-3" />

          <label className="block text-sm font-medium text-slate mb-1">Number of boxes / items</label>
          <input type="number" min="1" value={boxCount} onChange={e => setBoxCount(e.target.value)} className="w-full border rounded-md px-3 py-2 mb-4" />

          {result && (
            <div className="bg-gray-50 rounded-md p-4 text-center mb-4">
              <p className="text-xs text-slate uppercase">Estimated cost</p>
              <p className="text-2xl font-bold text-navy">GHS {result.total.toFixed(2)}</p>
              <p className="text-xs text-slate mt-1">Final cost confirmed at pickup</p>
            </div>
          )}

          <button
            onClick={handleBookPickup}
            className="block w-full text-center bg-orange text-white font-medium py-3 rounded-md"
          >
            Book a pickup
          </button>
        </div>
      </div>
    </div>
  )
}
