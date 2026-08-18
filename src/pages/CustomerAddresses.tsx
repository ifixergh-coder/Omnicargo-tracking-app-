import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import CustomerNav from '../components/CustomerNav'
import LocationSearch from '../components/LocationSearch'
import { reverseGeocode } from '../lib/reverseGeocode'

type Address = {
  id: string
  label: string
  address: string
  lat: number | null
  lng: number | null
  ghana_post_gps: string | null
  is_default: boolean
}

export default function CustomerAddresses() {
  const [addresses, setAddresses] = useState<Address[]>([])
  const [loading, setLoading] = useState(true)
  const [label, setLabel] = useState('')
  const [address, setAddress] = useState('')
  const [lat, setLat] = useState<number | null>(null)
  const [lng, setLng] = useState<number | null>(null)
  const [ghanaPostGps, setGhanaPostGps] = useState('')
  const [locating, setLocating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function loadAddresses() {
    setLoading(true)
    supabase.from('customer_addresses').select('*').order('created_at', { ascending: false }).then(({ data }) => {
      setAddresses((data as Address[]) ?? [])
      setLoading(false)
    })
  }

  useEffect(() => { loadAddresses() }, [])

  function useCurrentLocation() {
    if (!('geolocation' in navigator)) {
      setError('This device does not support location.')
      return
    }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords
        const resolved = await reverseGeocode(latitude, longitude)
        setAddress(resolved)
        setLat(latitude)
        setLng(longitude)
        setLocating(false)
      },
      () => { setError('Could not get your location.'); setLocating(false) },
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) { setSaving(false); return }
    await supabase.from('customer_addresses').insert({
      user_id: userData.user.id, label, address, lat, lng,
      ghana_post_gps: ghanaPostGps.trim() || null,
      is_default: addresses.length === 0,
    })
    setLabel(''); setAddress(''); setLat(null); setLng(null); setGhanaPostGps('')
    setSaving(false)
    loadAddresses()
  }

  async function setDefault(id: string) {
    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) return
    await supabase.from('customer_addresses').update({ is_default: false }).eq('user_id', userData.user.id)
    await supabase.from('customer_addresses').update({ is_default: true }).eq('id', id)
    loadAddresses()
  }

  async function removeAddress(id: string) {
    await supabase.from('customer_addresses').delete().eq('id', id)
    loadAddresses()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <CustomerNav />
      <div className="max-w-lg mx-auto px-6">
        <h1 className="text-xl font-semibold text-navy mb-4">Saved addresses</h1>

        <form onSubmit={handleAdd} className="bg-white rounded-lg shadow-sm p-5 mb-6">
          <h2 className="text-sm font-semibold text-slate uppercase mb-3">Add a new address</h2>
          <input placeholder="Label (e.g. Home, Shop, Office)" value={label} onChange={e => setLabel(e.target.value)} required className="w-full border rounded-md px-3 py-2 mb-2" />

          <button type="button" onClick={useCurrentLocation} disabled={locating} className="w-full bg-navy text-white font-medium py-2.5 rounded-md mb-2 disabled:opacity-50">
            {locating ? 'Getting your location…' : 'Use my current location'}
          </button>
          <p className="text-xs text-slate mb-2 text-center">— or —</p>
          <LocationSearch placeholder="Search for the address" onSelect={({ address: a, lat: la, lng: ln }) => { setAddress(a); setLat(la); setLng(ln) }} />
          {address && <p className="text-sm text-slate mt-2">{address}</p>}

          <div className="mt-3">
            <input
              placeholder="GhanaPostGPS code (optional)"
              value={ghanaPostGps}
              onChange={(e) => setGhanaPostGps(e.target.value)}
              className="w-full border rounded-md px-3 py-2"
            />
            <p className="text-xs text-slate mt-1">Optional — helps us locate you more precisely if you have it.</p>
          </div>

          {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
          <button type="submit" disabled={saving || !address} className="w-full bg-orange text-white font-medium py-2 rounded-md disabled:opacity-50 mt-3">
            {saving ? 'Saving…' : 'Save address'}
          </button>
        </form>

        {loading && <p className="text-sm text-slate">Loading…</p>}
        <div className="space-y-2">
          {addresses.map((a) => (
            <div key={a.id} className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium text-navy">{a.label} {a.is_default && <span className="text-xs text-orange">· Default</span>}</p>
                  <p className="text-sm text-slate">{a.address}</p>
                  {a.ghana_post_gps && <p className="text-xs text-slate">GhanaPostGPS: {a.ghana_post_gps}</p>}
                </div>
                <div className="flex gap-2 shrink-0">
                  {!a.is_default && <button onClick={() => setDefault(a.id)} className="text-xs text-orange underline">Set default</button>}
                  <button onClick={() => removeAddress(a.id)} className="text-xs text-red-600 underline">Remove</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
