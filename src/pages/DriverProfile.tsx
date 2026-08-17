import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import DriverNav from '../components/DriverNav'

export default function DriverProfile() {
  const [vehicleId, setVehicleId] = useState<string | null>(null)
  const [vehicleLabel, setVehicleLabel] = useState('')
  const [driverName, setDriverName] = useState('')
  const [driverPhone, setDriverPhone] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savedMessage, setSavedMessage] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) { setLoading(false); return }
      setEmail(userData.user.email ?? '')

      const { data: vehicle } = await supabase.from('vehicles').select('*').eq('driver_user_id', userData.user.id).maybeSingle()
      if (vehicle) {
        setVehicleId(vehicle.id)
        setVehicleLabel(vehicle.label)
        setDriverName(vehicle.driver_name ?? '')
        setDriverPhone(vehicle.driver_phone ?? '')
      }
      setLoading(false)
    }
    load()
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!vehicleId) return
    setSaving(true)
    await supabase.from('vehicles').update({ driver_name: driverName, driver_phone: driverPhone }).eq('id', vehicleId)
    setSaving(false)
    setSavedMessage('Profile updated')
    setTimeout(() => setSavedMessage(null), 3000)
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center text-slate">Loading…</div>

  return (
    <div className="min-h-screen bg-gray-50">
      <DriverNav />
      <div className="max-w-md mx-auto px-6">
        <h1 className="text-xl font-semibold text-navy mb-4">My profile</h1>

        {!vehicleId ? (
          <p className="text-sm text-slate">No vehicle linked to this account yet.</p>
        ) : (
          <form onSubmit={handleSave} className="bg-white rounded-lg shadow-sm p-5 space-y-3">
            <div>
              <label className="block text-xs text-slate mb-1">Login email</label>
              <p className="text-sm text-navy">{email}</p>
            </div>
            <div>
              <label className="block text-xs text-slate mb-1">Vehicle</label>
              <p className="text-sm text-navy">{vehicleLabel}</p>
            </div>
            <div>
              <label className="block text-xs text-slate mb-1">Your name</label>
              <input value={driverName} onChange={(e) => setDriverName(e.target.value)} className="w-full border rounded-md px-3 py-2" />
            </div>
            <div>
              <label className="block text-xs text-slate mb-1">Your phone</label>
              <input value={driverPhone} onChange={(e) => setDriverPhone(e.target.value)} className="w-full border rounded-md px-3 py-2" />
            </div>
            <button type="submit" disabled={saving} className="w-full bg-orange text-white font-medium py-3 rounded-md disabled:opacity-50">
              {saving ? 'Saving…' : 'Save changes'}
            </button>
            {savedMessage && <p className="text-sm text-green-600 text-center">✓ {savedMessage}</p>}
          </form>
        )}
      </div>
    </div>
  )
}
