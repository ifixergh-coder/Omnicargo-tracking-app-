import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import PublicNav from '../components/PublicNav'

export default function CustomerSignup() {
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [accountType, setAccountType] = useState<'individual' | 'merchant'>('individual')
  const [businessName, setBusinessName] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
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

    await supabase.from('customer_profiles').insert({
      user_id: data.user.id,
      full_name: fullName,
      phone,
      account_type: accountType,
      business_name: accountType === 'merchant' ? businessName : null,
    })

    if (data.session) navigate('/account')
    else navigate('/account/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PublicNav />
      <div className="max-w-sm mx-auto px-6 py-12">
        <h1 className="text-xl font-semibold text-navy mb-6">Create an account</h1>
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm p-6 space-y-3">
          <div className="flex gap-2 mb-2">
            <button type="button" onClick={() => setAccountType('individual')} className={`flex-1 py-2 rounded-md text-sm font-medium ${accountType === 'individual' ? 'bg-navy text-white' : 'bg-gray-100 text-slate'}`}>
              Individual
            </button>
            <button type="button" onClick={() => setAccountType('merchant')} className={`flex-1 py-2 rounded-md text-sm font-medium ${accountType === 'merchant' ? 'bg-navy text-white' : 'bg-gray-100 text-slate'}`}>
              Business / Merchant
            </button>
          </div>
          <input placeholder="Full name" value={fullName} onChange={e => setFullName(e.target.value)} required className="w-full border rounded-md px-3 py-2" />
          {accountType === 'merchant' && (
            <input placeholder="Business name" value={businessName} onChange={e => setBusinessName(e.target.value)} required className="w-full border rounded-md px-3 py-2" />
          )}
          <input placeholder="Phone" value={phone} onChange={e => setPhone(e.target.value)} required className="w-full border rounded-md px-3 py-2" />
          <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full border rounded-md px-3 py-2" />
          <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required className="w-full border rounded-md px-3 py-2" />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" disabled={saving} className="w-full bg-orange text-white font-medium py-3 rounded-md disabled:opacity-50">
            {saving ? 'Creating…' : 'Create account'}
          </button>
          <a href="/account/login" className="block text-center text-sm text-orange underline">Already have an account? Log in</a>
        </form>
      </div>
    </div>
  )
}
