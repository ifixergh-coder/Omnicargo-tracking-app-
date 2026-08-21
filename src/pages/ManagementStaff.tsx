import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import ManagementNav from '../components/ManagementNav'

type SignupRequest = {
  id: string
  user_id: string
  full_name: string
  email: string
  status: string
  created_at: string
}

type SignupCode = {
  code: string
  used_by: string | null
  created_at: string
}

function generateCode(): string {
  return Array.from({ length: 8 }, () =>
    '0123456789ABCDEFGHJKLMNPQRSTUVWXYZ'.charAt(Math.floor(Math.random() * 34)),
  ).join('')
}

export default function ManagementStaff() {
  const [requests, setRequests] = useState<SignupRequest[]>([])
  const [codes, setCodes] = useState<SignupCode[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)

  function loadData() {
    setLoading(true)
    supabase.from('staff_signup_requests').select('*').eq('status', 'pending').order('created_at', { ascending: false })
      .then(({ data }) => setRequests((data as SignupRequest[]) ?? []))
    supabase.from('staff_signup_codes').select('*').is('used_by', null).order('created_at', { ascending: false }).limit(20)
      .then(({ data }) => { setCodes((data as SignupCode[]) ?? []); setLoading(false) })
  }

  useEffect(() => { loadData() }, [])

  async function approve(req: SignupRequest) {
    setProcessing(req.id)
    await supabase.from('staff_roles').insert({ user_id: req.user_id, role: 'staff' })
    await supabase.from('staff_signup_requests').update({ status: 'approved', reviewed_at: new Date().toISOString() }).eq('id', req.id)
    setProcessing(null)
    loadData()
  }

  async function reject(req: SignupRequest) {
    setProcessing(req.id)
    await supabase.from('staff_signup_requests').update({ status: 'rejected', reviewed_at: new Date().toISOString() }).eq('id', req.id)
    setProcessing(null)
    loadData()
  }

  async function createCode() {
    const { data: userData } = await supabase.auth.getUser()
    await supabase.from('staff_signup_codes').insert({ code: generateCode(), created_by: userData.user?.id })
    loadData()
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      <ManagementNav />
      <div className="max-w-2xl mx-auto px-6">
        <h1 className="text-xl font-semibold text-navy mb-6">Staff accounts</h1>

        <div className="bg-white rounded-lg shadow-sm p-5 mb-6">
          <h2 className="text-sm font-semibold text-slate uppercase mb-3">Pending sign-up requests</h2>
          {loading && <p className="text-sm text-slate">Loading…</p>}
          {!loading && requests.length === 0 && <p className="text-sm text-slate">No pending requests.</p>}
          <div className="space-y-2">
            {requests.map((r) => (
              <div key={r.id} className="flex items-center justify-between border-b border-gray-100 pb-2 text-sm">
                <div>
                  <p className="font-medium text-navy">{r.full_name}</p>
                  <p className="text-xs text-slate">{r.email} · {new Date(r.created_at).toLocaleDateString()}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => approve(r)} disabled={processing === r.id} className="text-xs bg-orange text-white px-3 py-1.5 rounded-md disabled:opacity-50">
                    Approve
                  </button>
                  <button onClick={() => reject(r)} disabled={processing === r.id} className="text-xs border border-gray-300 text-slate px-3 py-1.5 rounded-md disabled:opacity-50">
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate uppercase">Signup reference codes</h2>
            <button onClick={createCode} className="text-xs bg-navy text-white px-3 py-1.5 rounded-md">
              Generate code
            </button>
          </div>
          <p className="text-xs text-slate mb-3">Give a code to a new hire to enter during sign-up. Approval is still required either way.</p>
          <div className="space-y-1">
            {codes.map((c) => (
              <div key={c.code} className="flex items-center justify-between text-sm border-b border-gray-100 pb-1">
                <span className="font-mono text-navy">{c.code}</span>
                <span className="text-xs text-slate">Generated {new Date(c.created_at).toLocaleDateString()}</span>
              </div>
            ))}
            {codes.length === 0 && <p className="text-sm text-slate">No codes generated yet.</p>}
          </div>
        </div>
      </div>
    </div>
  )
}
