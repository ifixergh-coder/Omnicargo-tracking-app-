import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function DriverSignup() {
  const [driverName, setDriverName] = useState('')
  const [driverPhone, setDriverPhone] = useState('')
  const [vehicleLabel, setVehicleLabel] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const navigate = useNavigate()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)

    const { data, error: signUpError } = await supabase.auth.signUp({ email, password })
    if (signUpError || !data.user) {
      setError(signUpError?.message ?? 'Could not create account')
      setSaving(false)
      return
    }

    const { error: vehicleError } = await supabase.from('vehicles').insert({
      label: vehicleLabel,
      driver_name: driverName,
      driver_phone: driverPhone || null,
      tracking_source: 'phone',
      active: true,
      driver_user_id: data.user.id,
    })

    if (vehicleError) {
      setError(vehicleError.message)
      setSaving(false)
      return
    }

    if (data.session) {
      navigate('/driver')
    } else {
      setDone(true)
    }
    setSaving(false)
  }

  if (done) {
    return (
      <div className="min-h-screen bg-navy flex flex-col items-center justify-center px-6 text-center gap-3">
        <p className="text-white font-medium">Account created</p>
        <p className="text-white/70 text-sm">Check your email to confirm, then log in.</p>
        <a href="/driver/login" className="text-orange underline">Go to login</a>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-navy flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center gap-2 mb-6">
          <span className="w-2.5 h-2.5 rounded-full bg-orange" />
          <span className="font-semibold text-navy">Rider sign up</span>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input placeholder="Your name" value={driverName} onChange={e => setDriverName(e.target.value)} required className="w-full border border-gray-300 rounded-md px-4 py-3 text-navy" />
          <input placeholder="Phone number" value={driverPhone} onChange={e => setDriverPhone(e.target.value)} className="w-full border border-gray-300 rounded-md px-4 py-3 text-navy" />
          <input placeholder="Vehicle name (e.g. Kojo's bike)" value={vehicleLabel} onChange={e => setVehicleLabel(e.target.value)} required className="w-full border border-gray-300 rounded-md px-4 py-3 text-navy" />
          <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full border border-gray-300 rounded-md px-4 py-3 text-navy" />
          <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required className="w-full border border-gray-300 rounded-md px-4 py-3 text-navy" />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" disabled={saving} className="w-full bg-orange text-white font-medium py-3 rounded-md disabled:opacity-50">
            {saving ? 'Creating account…' : 'Sign up'}
          </button>
          <a href="/driver/login" className="block text-center text-sm text-orange underline">Already have an account? Log in</a>
        </form>
      </div>
    </div>
  )
}
