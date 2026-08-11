import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<'loading' | 'in' | 'out'>('loading')

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session ? 'in' : 'out'))
    const { data: listener } = supabase.auth.onAuthStateChange((_e, session) => {
      setSession(session ? 'in' : 'out')
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  if (session === 'loading') return <div className="min-h-screen flex items-center justify-center text-slate">Loading…</div>
  if (session === 'out') return <Navigate to="/staff/login" replace />
  return <>{children}</>
}
