import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import PublicNav from '../components/PublicNav'

export default function CustomerLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError(error.message)
    else navigate('/account')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PublicNav />
      <div className="max-w-sm mx-auto px-6 py-12">
        <h1 className="text-xl font-semibold text-navy mb-6">Log in</h1>
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm p-6 space-y-3">
          <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full border rounded-md px-3 py-2" />
          <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required className="w-full border rounded-md px-3 py-2" />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" className="w-full bg-orange text-white font-medium py-3 rounded-md">Log in</button>
          <a href="/account/signup" className="block text-center text-sm text-orange underline">New here? Create an account</a>
        </form>
      </div>
    </div>
  )
}
