import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function StaffSignup() {
  const [fullName, setFullName] = useState('')
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
      .from('staff_signup_codes')
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

    await supabase.from('staff_signup_requests').insert({
      user_id: data.user.id,
      full_name: fullName,
      email,
      reference_code_used: referenceCode.trim(),
    })

    await supabase.from('staff_signup_codes')
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
          A manager needs to approve your account before you can log in. You'll be able to sign in once approved.
        </p>
        <a href="/staff/login" className="text-orange underline">Back to login</a>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-navy flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center gap-2 mb-6">
          <span className="w-2.5 h-2.5 rounded-full bg-orange" />
          <span className="font-semibold text-navy">Staff sign up</span>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input placeholder="Full name" value={fullName} onChange={e => setFullName(e.target.value)} required className="w-full border border-gray-300 rounded-md px-4 py-3 text-navy" />
          <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full border border-gray-300 rounded-md px-4 py-3 text-navy" />
          <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required className="w-full border border-gray-300 rounded-md px-4 py-3 text-navy" />
          <input placeholder="Reference code (required — ask a manager)" value={referenceCode} onChange={e => setReferenceCode(e.target.value)} required className="w-full border border-gray-300 rounded-md px-4 py-3 text-navy" />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" disabled={saving} className="w-full bg-orange text-white font-medium py-3 rounded-md disabled:opacity-50">
            {saving ? 'Submitting…' : 'Sign up'}
          </button>
          <a href="/staff/login" className="block text-center text-sm text-orange underline">Already approved? Log in</a>
        </form>
      </div>
    </div>
  )
}
