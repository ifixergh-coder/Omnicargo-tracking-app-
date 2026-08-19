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
  emergency_contact_name: string | null
  emergency_contact_phone: string | null
  emergency_contact_address: string | null
  emergency_contact_message: string | null
}

export default function CustomerProfile() {
  const [accountType, setAccountType] = useState('individual')
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [businessName, setBusinessName] = useState('')
  const [pickupAddress, setPickupAddress] = useState('')
  const [pickupLat, setPickupLat] = useState<number | null>(null)
  const [pickupLng, setPickupLng] = useState<number | null>(null)

  const [emergencyName, setEmergencyName] = useState('')
  const [emergencyPhone, setEmergencyPhone] = useState('')
  const [emergencyAddress, setEmergencyAddress] = useState('')
  const [emergencyMessage, setEmergencyMessage] = useState('')

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savedMessage, setSavedMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) { setLoading(false); return }
      const { data } = await supabase.from('customer_profiles').select('*').eq('user_id', userData.user.id).maybeSingle()
      if (data) {
        const p = data as Profile
        setAccountType(p.account_type)
        setFullName(p.full_name ?? '')
        setPhone(p.phone ?? '')
        setBusinessName(p.business_name ?? '')
        setPickupAddress(p.default_pickup_address ?? '')
        setPickupLat(p.default_pickup_lat)
        setPickupLng(p.default_pickup_lng)
        setEmergencyName(p.emergency_contact_name ?? '')
        setEmergencyPhone(p.emergency_contact_phone ?? '')
        setEmergencyAddress(p.emergency_contact_address ?? '')
        setEmergencyMessage(p.emergency_contact_message ?? '')
      }
      setLoading(false)
    }
    load()
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) { setSaving(false); return }

    // Upsert guarantees this saves correctly whether or not a profile row
    // already existed for this account — a plain update() would silently
    // do nothing if the row was never created at signup.
    const { error } = await supabase.from('customer_profiles').upsert({
      user_id: userData.user.id,
      full_name: fullName,
      phone,
      account_type: accountType,
      business_name: businessName || null,
      default_pickup_address: pickupAddress || null,
      default_pickup_lat: pickupLat,
      default_pickup_lng: pickupLng,
      emergency_contact_name: emergencyName || null,
      emergency_contact_phone: emergencyPhone || null,
      emergency_contact_address: emergencyAddress || null,
      emergency_contact_message: emergencyMessage || null,
    }, { onConflict: 'user_id' })

    setSaving(false)
    if (error) {
      setError(error.message)
    } else {
      setSavedMessage('Profile updated')
      setTimeout(() => setSavedMessage(null), 3000)
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center text-slate">Loading…</div>

  return (
    <div className="min-h-screen bg-gray-50">
      <CustomerNav />
      <div className="max-w-lg mx-auto px-6 pb-8">
        <h1 className="text-xl font-semibold text-navy mb-4">My profile</h1>
        <form onSubmit={handleSave} className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm p-5 space-y-3">
            <h2 className="text-sm font-semibold text-slate uppercase">Your details</h2>
            <input placeholder="Full name" value={fullName} onChange={e => setFullName(e.target.value)} className="w-full border rounded-md px-3 py-2" />
            <input placeholder="Phone" value={phone} onChange={e => setPhone(e.target.value)} className="w-full border rounded-md px-3 py-2" />
            {accountType === 'merchant' && (
              <>
                <input placeholder="Business name" value={businessName} onChange={e => setBusinessName(e.target.value)} className="w-full border rounded-md px-3 py-2" />
                <div>
                  <label className="block text-xs text-slate mb-1">Default pickup location</label>
                  <LocationSearch placeholder="Search for your business address" onSelect={({ address, lat, lng }) => { setPickupAddress(address); setPickupLat(lat); setPickupLng(lng) }} />
                  {pickupAddress && <p className="text-sm text-slate mt-2">{pickupAddress}</p>}
                </div>
              </>
            )}
          </div>

          <div className="bg-white rounded-lg shadow-sm p-5 space-y-3">
            <h2 className="text-sm font-semibold text-slate uppercase">Emergency contact</h2>
            <p className="text-xs text-slate">Used only if we can't reach you about your shipment.</p>
            <input placeholder="Contact name" value={emergencyName} onChange={e => setEmergencyName(e.target.value)} className="w-full border rounded-md px-3 py-2" />
            <input placeholder="Contact phone" value={emergencyPhone} onChange={e => setEmergencyPhone(e.target.value)} className="w-full border rounded-md px-3 py-2" />
            <input placeholder="Contact address" value={emergencyAddress} onChange={e => setEmergencyAddress(e.target.value)} className="w-full border rounded-md px-3 py-2" />
            <textarea placeholder="Message for this contact (optional)" value={emergencyMessage} onChange={e => setEmergencyMessage(e.target.value)} className="w-full border rounded-md px-3 py-2" rows={2} />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" disabled={saving} className="w-full bg-orange text-white font-medium py-3 rounded-md disabled:opacity-50">
            {saving ? 'Saving…' : 'Save changes'}
          </button>
          {savedMessage && <p className="text-sm text-green-600 text-center">✓ {savedMessage}</p>}
        </form>
      </div>
    </div>
  )
}
