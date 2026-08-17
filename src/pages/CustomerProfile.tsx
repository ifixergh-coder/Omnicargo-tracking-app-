import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import CustomerNav from '../components/CustomerNav'
import LocationSearch from '../components/LocationSearch'

type Profile = {
  full_name: string
  phone: string | null
  account_type: string
  business_name: string | null
  default_pickup_address: string | null
  default_pickup_lat: number | null
  default_pickup_lng: number | null
}

export default function CustomerProfile() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [businessName, setBusinessName] = useState('')
  const [pickupAddress, setPickupAddress] = useState('')
  const [pickupLat, setPickupLat] = useState<number | null>(null)
  const [pickupLng, setPickupLng] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savedMessage, setSavedMessage] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) { setLoading(false); return }
      const { data } = await supabase.from('customer_profiles').select('*').eq('user_id', userData.user.id).maybeSingle()
      if (data) {
        const p = data as Profile
        setProfile(p)
        setFullName(p.full_name)
        setPhone(p.phone ?? '')
        setBusinessName(p.business_name ?? '')
        setPickupAddress(p.default_pickup_address ?? '')
        setPickupLat(p.default_pickup_lat)
        setPickupLng(p.default_pickup_lng)
      }
      setLoading(false)
    }
    load()
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) { setSaving(false); return }
    await supabase.from('customer_profiles').update({
      full_name: fullName, phone, business_name: businessName || null,
      default_pickup_address: pickupAddress || null, default_pickup_lat: pickupLat, default_pickup_lng: pickupLng,
    }).eq('user_id', userData.user.id)
    setSaving(false)
    setSavedMessage('Profile updated')
    setTimeout(() => setSavedMessage(null), 3000)
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center text-slate">Loading…</div>

  return (
    <div className="min-h-screen bg-gray-50">
      <CustomerNav />
      <div className="max-w-lg mx-auto px-6">
        <h1 className="text-xl font-semibold text-navy mb-4">My profile</h1>
        <form onSubmit={handleSave} className="bg-white rounded-lg shadow-sm p-5 space-y-3">
          <input placeholder="Full name" value={fullName} onChange={e => setFullName(e.target.value)} className="w-full border rounded-md px-3 py-2" />
          <input placeholder="Phone" value={phone} onChange={e => setPhone(e.target.value)} className="w-full border rounded-md px-3 py-2" />
          {profile?.account_type === 'merchant' && (
            <>
              <input placeholder="Business name" value={businessName} onChange={e => setBusinessName(e.target.value)} className="w-full border rounded-md px-3 py-2" />
              <div>
                <label className="block text-xs text-slate mb-1">Default pickup location</label>
                <LocationSearch placeholder="Search for your business address" onSelect={({ address, lat, lng }) => { setPickupAddress(address); setPickupLat(lat); setPickupLng(lng) }} />
                {pickupAddress && <p className="text-sm text-slate mt-2">{pickupAddress}</p>}
              </div>
            </>
          )}
          <button type="submit" disabled={saving} className="w-full bg-orange text-white font-medium py-3 rounded-md disabled:opacity-50">
            {saving ? 'Saving…' : 'Save changes'}
          </button>
          {savedMessage && <p className="text-sm text-green-600 text-center">✓ {savedMessage}</p>}
        </form>
      </div>
    </div>
  )
}
