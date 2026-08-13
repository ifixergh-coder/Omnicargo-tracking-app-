import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { generateBatchNumber } from '../lib/batchNumber'
import { LOCATIONS } from '../lib/locations'
import { STATUS_LABELS } from '../lib/statusLabels'
import StaffNav from '../components/StaffNav'

type Batch = {
  id: string
  batch_number: string
  origin: string | null
  destination: string | null
  status: string
  created_at: string
  itemCount?: number
}

type Vehicle = { id: string; label: string }

export default function StaffBatches() {
  const [batches, setBatches] = useState<Batch[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)

  const [origin, setOrigin] = useState('')
  const [destination, setDestination] = useState('')
  const [vehicleId, setVehicleId] = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function loadBatches() {
    setLoading(true)
    supabase.from('batches').select('*').order('created_at', { ascending: false }).then(async ({ data }) => {
      const list = (data as Batch[]) ?? []
      const withCounts = await Promise.all(
        list.map(async (b) => {
          const { count } = await supabase.from('shipments').select('id', { count: 'exact', head: true }).eq('batch_id', b.id)
          return { ...b, itemCount: count ?? 0 }
        }),
      )
      setBatches(withCounts)
      setLoading(false)
    })
  }

  useEffect(() => {
    loadBatches()
    supabase.from('vehicles').select('id, label').eq('active', true).order('label')
      .then(({ data }) => setVehicles((data as Vehicle[]) ?? []))
  }, [])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setCreating(true)
    setError(null)
    const { error } = await supabase.from('batches').insert({
      batch_number: generateBatchNumber(),
      origin: origin || null,
      destination: destination || null,
      assigned_vehicle_id: vehicleId || null,
    })
    if (error) setError(error.message)
    else { setOrigin(''); setDestination(''); setVehicleId(''); loadBatches() }
    setCreating(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24 md:pb-8">
      <StaffNav />
      <div className="max-w-2xl mx-auto px-6">
        <h1 className="text-xl font-semibold text-navy mb-6">Batches</h1>

        <form onSubmit={handleCreate} className="bg-white rounded-lg shadow-sm p-5 mb-6">
          <h2 className="text-sm font-semibold text-slate uppercase mb-3">Create batch</h2>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <select value={origin} onChange={e => setOrigin(e.target.value)} className="border rounded-md px-3 py-2">
              <option value="">From…</option>
              {LOCATIONS.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
            <select value={destination} onChange={e => setDestination(e.target.value)} className="border rounded-md px-3 py-2">
              <option value="">To…</option>
              {LOCATIONS.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
          <select value={vehicleId} onChange={e => setVehicleId(e.target.value)} className="w-full border rounded-md px-3 py-2 mb-3">
            <option value="">Assign vehicle (optional)</option>
            {vehicles.map((v) => <option key={v.id} value={v.id}>{v.label}</option>)}
          </select>
          {error && <p className="text-sm text-red-600 mb-2">{error}</p>}
          <button type="submit" disabled={creating} className="w-full bg-orange text-white font-medium py-2 rounded-md disabled:opacity-50">
            {creating ? 'Creating…' : 'Create batch'}
          </button>
        </form>

        <h2 className="text-sm font-semibold text-slate uppercase mb-3">All batches</h2>
        {loading && <p className="text-sm text-slate">Loading…</p>}
        <div className="space-y-2">
          {batches.map((b) => (
            <Link key={b.id} to={`/staff/batches/${b.id}`} className="block bg-white rounded-lg shadow-sm p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-mono font-medium text-navy">{b.batch_number}</p>
                  <p className="text-sm text-slate">{b.origin ?? '—'} → {b.destination ?? '—'}</p>
                  <p className="text-xs text-slate mt-1">{STATUS_LABELS[b.status] ?? b.status} · {b.itemCount} item(s)</p>
                </div>
              </div>
            </Link>
          ))}
          {!loading && batches.length === 0 && <p className="text-sm text-slate">No batches yet.</p>}
        </div>
      </div>
    </div>
  )
}
