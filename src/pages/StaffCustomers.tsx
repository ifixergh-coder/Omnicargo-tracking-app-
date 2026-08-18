import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import StaffNav from '../components/StaffNav'

type Customer = { id: string; name: string; phone: string | null; email: string | null }

export default function StaffCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    let q = supabase.from('customers').select('id, name, phone, email').order('name').limit(100)
    if (query.trim()) q = q.or(`name.ilike.%${query}%,phone.ilike.%${query}%`)
    q.then(({ data }) => { setCustomers((data as Customer[]) ?? []); setLoading(false) })
  }, [query])

  return (
    <div className="min-h-screen bg-gray-50 pb-24 md:pb-8">
      <StaffNav />
      <div className="max-w-2xl mx-auto px-6">
        <h1 className="text-xl font-semibold text-navy mb-4">Customers</h1>
        <input
          placeholder="Search by name or phone"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full border rounded-md px-3 py-2 mb-4"
        />
        {loading && <p className="text-sm text-slate">Loading…</p>}
        <div className="space-y-2">
          {customers.map((c) => (
            <div key={c.id} className="bg-white rounded-lg shadow-sm p-4 flex items-center justify-between">
              <div>
                <p className="font-medium text-navy">{c.name}</p>
                <p className="text-sm text-slate">{c.phone} {c.email && `· ${c.email}`}</p>
              </div>
              <Link to={`/staff/customers/${c.id}`} className="bg-orange text-white text-sm font-medium px-4 py-2 rounded-md shrink-0">
                View details
              </Link>
            </div>
          ))}
          {!loading && customers.length === 0 && <p className="text-sm text-slate">No customers found.</p>}
        </div>
      </div>
    </div>
  )
}
