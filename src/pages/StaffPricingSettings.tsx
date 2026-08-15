import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import ManagementNav from '../components/ManagementNav'

export default function StaffPricingSettings() {
  const [pricePerCbm, setPricePerCbm] = useState('')
  const [includedKgPerCbm, setIncludedKgPerCbm] = useState('')
  const [extraKgRate, setExtraKgRate] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [savedMessage, setSavedMessage] = useState<string | null>(null)

  useEffect(() => {
    supabase.from('pricing_settings').select('*').eq('id', 1).maybeSingle().then(({ data }) => {
      if (data) {
        setPricePerCbm(String(data.price_per_cbm))
        setIncludedKgPerCbm(String(data.included_kg_per_cbm))
        setExtraKgRate(String(data.extra_kg_rate))
      }
      setLoading(false)
    })
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSavedMessage(null)

    const { error } = await supabase.from('pricing_settings').update({
      price_per_cbm: parseFloat(pricePerCbm) || 0,
      included_kg_per_cbm: parseFloat(includedKgPerCbm) || 0,
      extra_kg_rate: parseFloat(extraKgRate) || 0,
    }).eq('id', 1)

    if (error) {
      setError(error.message)
    } else {
      setSavedMessage('Public pricing updated — the calculator on the website now uses these rates.')
      setTimeout(() => setSavedMessage(null), 5000)
    }
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <ManagementNav />
        <p className="text-center text-slate mt-12">Loading…</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ManagementNav />
      <div className="max-w-lg mx-auto px-6">
        <h1 className="text-xl font-semibold text-navy mb-2">Public pricing settings</h1>
        <p className="text-sm text-slate mb-6">
          These rates power the free cost calculator and pickup booking on the public website.
          They don't affect prices already set on individual shipments created by staff.
        </p>

        <form onSubmit={handleSave} className="bg-white rounded-lg shadow-sm p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate mb-1">Price per CBM (GHS)</label>
            <input value={pricePerCbm} onChange={(e) => setPricePerCbm(e.target.value)} required className="w-full border rounded-md px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate mb-1">Included kg per CBM</label>
            <input value={includedKgPerCbm} onChange={(e) => setIncludedKgPerCbm(e.target.value)} required className="w-full border rounded-md px-3 py-2" />
            <p className="text-xs text-slate mt-1">e.g. 100 means each CBM includes up to 100kg before extra charges apply.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate mb-1">Extra rate per kg over allowance (GHS)</label>
            <input value={extraKgRate} onChange={(e) => setExtraKgRate(e.target.value)} required className="w-full border rounded-md px-3 py-2" />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
          {savedMessage && <p className="text-sm text-green-600 font-medium">✓ {savedMessage}</p>}

          <button type="submit" disabled={saving} className="w-full bg-orange text-white font-medium py-3 rounded-md disabled:opacity-50">
            {saving ? 'Saving…' : 'Save pricing'}
          </button>
        </form>
      </div>
    </div>
  )
}
