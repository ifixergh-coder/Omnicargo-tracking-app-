import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function DriverSignup() {
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [referenceCode, setReferenceCode] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)

    const { data: codeRow } = await supabase
      .from('driver_signup_codes')
      .select('code, used_by')
      .eq('code', referenceCode.trim())
      .maybeSingle()

    if (!codeRow) {
      setError('That reference code was not recognized. Ask a manager for a valid code.')
      setSaving(false)
      return
    }
    if (codeRow.used_by) {
      setError('That reference code has already been used.')
      setSaving(false)
      return
    }

    const { data, error: signUpError } = await supabase.auth.signUp({ email, password })
    if (signUpError || !data.user) {
      setError(signUpError?.message ?? 'Could not create account')
      setSaving(false)
      return
    }

    // signUp() alone doesn't guarantee an active session — without one, the
    // inserts below would silently fail their permission checks. Signing in
    // explicitly here (our database already auto-confirms new accounts)
    // guarantees we have a real session before saving anything.
    if (!data.session) {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
      if (signInError) {
        setError(`Account created, but couldn't log you in automatically: ${signInError.message}. Try logging in manually.`)
        setSaving(false)
        return
      }
    }

    const { error: requestError } = await supabase.from('driver_signup_requests').insert({
      user_id: data.user.id,
      full_name: fullName,
      phone,
      email,
      reference_code_used: referenceCode.trim(),
    })
    if (requestError) {
      setError(`Account created, but the request could not be saved: ${requestError.message}`)
      setSaving(false)
      return
    }

    await supabase.from('driver_profiles').upsert({ user_id: data.user.id, full_name: fullName, phone })

    await supabase.from('driver_signup_codes')
      .update({ used_by: data.user.id, used_at: new Date().toISOString() })
      .eq('code', referenceCode.trim())

    setDone(true)
    setSaving(false)
  }

  if (done) {
    return (
      <div className="min-h-screen bg-navy flex flex-col items-center justify-center px-6 text-center gap-3">
        <p className="text-white font-medium">Sign-up request submitted</p>
        <p className="text-white/70 text-sm max-w-sm">
          A manager will assign you a vehicle soon. You can log in now, but you won't be able to share location or scan packages until a vehicle is assigned to you.
        </p>
        <a href="/driver/login" className="text-orange underline">Go to login</a>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-navy flex flex-col items-center justify-center px-6 py-8">
      <div className="w-full max-w-sm bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center gap-2 mb-6">
          <span className="w-2.5 h-2.5 rounded-full bg-orange" />
          <span className="font-semibold text-navy">Driver sign up</span>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input placeholder="Your full name" value={fullName} onChange={e => setFullName(e.target.value)} required className="w-full border border-gray-300 rounded-md px-4 py-3 text-navy" />
          <input placeholder="Your phone" value={phone} onChange={e => setPhone(e.target.value)} className="w-full border border-gray-300 rounded-md px-4 py-3 text-navy" />
          <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full border border-gray-300 rounded-md px-4 py-3 text-navy" />
          <input type="password" placeholder="Choose a password" value={password} onChange={e => setPassword(e.target.value)} required className="w-full border border-gray-300 rounded-md px-4 py-3 text-navy" />
          <input placeholder="Reference code (required — ask a manager)" value={referenceCode} onChange={e => setReferenceCode(e.target.value)} required className="w-full border border-gray-300 rounded-md px-4 py-3 text-navy" />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" disabled={saving} className="w-full bg-orange text-white font-medium py-3 rounded-md disabled:opacity-50">
            {saving ? 'Submitting…' : 'Sign up'}
          </button>
          <a href="/driver/login" className="block text-center text-sm text-orange underline">Already have an account? Log in</a>
        </form>
      </div>
    </div>
  )
}
