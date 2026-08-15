import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function StaffLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError(error.message)
    else navigate('/staff/shipments')
  }

  return (
    <div className="min-h-screen bg-navy flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center gap-2 mb-6">
          <span className="w-2.5 h-2.5 rounded-full bg-orange" />
          <span className="font-semibold text-navy">Staff sign in</span>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full border border-gray-300 rounded-md px-4 py-3 text-navy" />
          <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required className="w-full border border-gray-300 rounded-md px-4 py-3 text-navy" />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" className="w-full bg-orange text-white font-medium py-3 rounded-md">Sign in</button>
          <a href="/staff/signup" className="block text-center text-sm text-orange underline">New staff member? Sign up</a>
        </form>
      </div>
    </div>
  )
}
