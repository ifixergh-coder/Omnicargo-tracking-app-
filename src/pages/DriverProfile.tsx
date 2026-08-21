import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import DriverNav from '../components/DriverNav'

type Vehicle = { id: string; label: string; plate_number: string | null; vehicle_type: string | null }

export default function DriverProfile() {
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [photoPath, setPhotoPath] = useState<string | null>(null)
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [vehicle, setVehicle] = useState<Vehicle | null>(null)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [savedMessage, setSavedMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function loadPhotoUrl(path: string) {
    const { data } = await supabase.storage.from('driver-photos').createSignedUrl(path, 3600)
    if (data) setPhotoUrl(data.signedUrl)
  }

  useEffect(() => {
    async function load() {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) { setLoading(false); return }
      setEmail(userData.user.email ?? '')

      const { data: profile } = await supabase.from('driver_profiles').select('*').eq('user_id', userData.user.id).maybeSingle()
      if (profile) {
        setFullName(profile.full_name ?? '')
        setPhone(profile.phone ?? '')
        if (profile.photo_path) {
          setPhotoPath(profile.photo_path)
          loadPhotoUrl(profile.photo_path)
        }
      }

      const { data: v } = await supabase.from('vehicles').select('id, label, plate_number, vehicle_type').eq('driver_user_id', userData.user.id).maybeSingle()
      if (v) setVehicle(v as Vehicle)

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

    const { error } = await supabase.from('driver_profiles').upsert({
      user_id: userData.user.id, full_name: fullName, phone, photo_path: photoPath,
    }, { onConflict: 'user_id' })

    // Keep the vehicle's driver_name/phone in sync too, so waybills stay accurate
    if (vehicle) {
      await supabase.from('vehicles').update({ driver_name: fullName, driver_phone: phone }).eq('id', vehicle.id)
    }

    setSaving(false)
    if (error) {
      setError(error.message)
    } else {
      setSavedMessage('Profile updated')
      setTimeout(() => setSavedMessage(null), 3000)
    }
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setError(null)
    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) { setUploading(false); return }

    const path = `${userData.user.id}/photo.jpg`
    const { error: uploadError } = await supabase.storage.from('driver-photos').upload(path, file, { upsert: true })
    if (uploadError) {
      setError(uploadError.message)
      setUploading(false)
      return
    }

    await supabase.from('driver_profiles').upsert({ user_id: userData.user.id, full_name: fullName, phone, photo_path: path }, { onConflict: 'user_id' })
    setPhotoPath(path)
    await loadPhotoUrl(path)
    setUploading(false)
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center text-slate">Loading…</div>

  return (
    <div className="min-h-screen bg-gray-50">
      <DriverNav />
      <div className="max-w-md mx-auto px-6 pb-8">
        <h1 className="text-xl font-semibold text-navy mb-4">My profile</h1>

        <div className="bg-white rounded-lg shadow-sm p-5 mb-4 flex flex-col items-center">
          <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100 border-2 border-orange mb-3 flex items-center justify-center">
            {photoUrl ? (
              <img src={photoUrl} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <span className="text-slate text-xs text-center px-2">No photo yet</span>
            )}
          </div>
          <label className="text-sm text-orange underline cursor-pointer">
            {uploading ? 'Uploading…' : photoPath ? 'Change photo' : 'Upload photo'}
            <input type="file" accept="image/*" capture="user" onChange={handlePhotoUpload} disabled={uploading} className="hidden" />
          </label>
        </div>

        <form onSubmit={handleSave} className="bg-white rounded-lg shadow-sm p-5 space-y-3">
          <div>
            <label className="block text-xs text-slate mb-1">Login email</label>
            <p className="text-sm text-navy">{email}</p>
          </div>
          <div>
            <label className="block text-xs text-slate mb-1">Your name</label>
            <input value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full border rounded-md px-3 py-2" />
          </div>
          <div>
            <label className="block text-xs text-slate mb-1">Your phone</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full border rounded-md px-3 py-2" />
          </div>

          <div className="border-t pt-3">
            <label className="block text-xs text-slate mb-1">Assigned vehicle</label>
            {vehicle ? (
              <p className="text-sm text-navy">{vehicle.label} {vehicle.vehicle_type && `(${vehicle.vehicle_type})`} — {vehicle.plate_number ?? 'No plate set'}</p>
            ) : (
              <p className="text-sm text-orange">No vehicle assigned yet — a manager will assign one soon.</p>
            )}
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
