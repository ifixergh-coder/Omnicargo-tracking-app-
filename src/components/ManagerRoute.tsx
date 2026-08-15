import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function ManagerRoute({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<'loading' | 'allowed' | 'denied'>('loading')

  useEffect(() => {
    async function check() {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) { setStatus('denied'); return }
      const { data: roleRow } = await supabase
        .from('staff_roles')
        .select('role')
        .eq('user_id', userData.user.id)
        .maybeSingle()
      setStatus(roleRow?.role === 'manager' ? 'allowed' : 'denied')
    }
    check()
  }, [])

  if (status === 'loading') return <div className="min-h-screen flex items-center justify-center text-slate">Loading…</div>
  if (status === 'denied') return <Navigate to="/staff/shipments" replace />
  return <>{children}</>
}
