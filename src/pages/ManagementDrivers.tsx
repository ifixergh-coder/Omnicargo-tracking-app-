import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import ManagementNav from '../components/ManagementNav'

type Vehicle = {
  id: string
  label: string
  driver_name: string | null
  driver_phone: string | null
  plate_number: string | null
  driver_user_id: string | null
  active: boolean
}

export default function ManagementDrivers() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)

  const [driverName, setDriverName] = useState('')
  const [driverPhone, setDriverPhone] = useState('')
  const [plateNumber, setPlateNumber] = useState('')
  const [vehicleLabel, setVehicleLabel] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [createdMessage, setCreatedMessage] = useState<string | null>(null)

  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null)

  function loadVehicles() {
    setLoading(true)
    supabase.from('vehicles').select('*').order('label').then(({ data }) => {
      setVehicles((data as Vehicle[]) ?? [])
      setLoading(false)
    })
  }

  useEffect(() => { loadVehicles() }, [])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setCreating(true)
    setCreateError(null)
    setCreatedMessage(null)

    const { data: sessionData } = await supabase.auth.getSession()
    const token = sessionData.session?.access_token
    if (!token) {
      setCreateError('Not logged in')
      setCreating(false)
      return
    }

    try {
      const res = await fetch('/api/create-driver', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          driverName, driverPhone, plateNumber, vehicleLabel, email, password,
          managerToken: token,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setCreateError(data.error ?? 'Something went wrong')
      } else {
        setCreatedMessage(`Driver account created for ${driverName}`)
        setDriverName(''); setDriverPhone(''); setPlateNumber(''); setVehicleLabel(''); setEmail(''); setPassword('')
        loadVehicles()
      }
    } catch {
      setCreateError('Could not reach the server. Please try again.')
    } finally {
      setCreating(false)
    }
  }

  async function handleDelete(vehicle: Vehicle) {
    setDeletingId(vehicle.id)
    const { data: sessionData } = await supabase.auth.getSession()
    const token = sessionData.session?.access_token
    if (!token) { setDeletingId(null); return }

    try {
      const res = await fetch('/api/delete-driver', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vehicleId: vehicle.id, driverUserId: vehicle.driver_user_id, managerToken: token }),
      })
      const data = await res.json()
      if (!res.ok) {
        alert(data.error ?? 'Could not delete')
      } else if (data.warning) {
        alert(data.warning)
      }
    } catch {
      alert('Could not reach the server.')
    } finally {
      setDeletingId(null)
      setConfirmingDeleteId(null)
      loadVehicles()
    }
  }

  async function toggleActive(vehicle: Vehicle) {
    await supabase.from('vehicles').update({ active: !vehicle.active }).eq('id', vehicle.id)
    loadVehicles()
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      <ManagementNav />
      <div className="max-w-2xl mx-auto px-6">
        <h1 className="text-xl font-semibold text-navy mb-2">Drivers & vehicles</h1>
        <p className="text-sm text-slate mb-6">
          Driver logins are created here only — there's no public sign-up. Each driver gets their vehicle linked automatically at creation.
        </p>

        <form onSubmit={handleCreate} className="bg-white rounded-lg shadow-sm p-5 mb-6">
          <h2 className="text-sm font-semibold text-slate uppercase mb-3">Add a new driver</h2>
          <input placeholder="Driver name" value={driverName} onChange={e => setDriverName(e.target.value)} required className="w-full border rounded-md px-3 py-2 mb-2" />
          <input placeholder="Driver phone" value={driverPhone} onChange={e => setDriverPhone(e.target.value)} className="w-full border rounded-md px-3 py-2 mb-2" />
          <input placeholder="Vehicle label (e.g. Truck 3)" value={vehicleLabel} onChange={e => setVehicleLabel(e.target.value)} required className="w-full border rounded-md px-3 py-2 mb-2" />
          <input placeholder="Plate number" value={plateNumber} onChange={e => setPlateNumber(e.target.value)} className="w-full border rounded-md px-3 py-2 mb-2" />
          <input type="email" placeholder="Login email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full border rounded-md px-3 py-2 mb-2" />
          <input type="password" placeholder="Login password" value={password} onChange={e => setPassword(e.target.value)} required className="w-full border rounded-md px-3 py-2 mb-2" />
          {createError && <p className="text-sm text-red-600 mb-2">{createError}</p>}
          {createdMessage && <p className="text-sm text-green-600 mb-2">✓ {createdMessage}</p>}
          <button type="submit" disabled={creating} className="w-full bg-orange text-white font-medium py-2 rounded-md disabled:opacity-50">
            {creating ? 'Creating…' : 'Create driver'}
          </button>
        </form>

        <h2 className="text-sm font-semibold text-slate uppercase mb-3">All vehicles</h2>
        {loading && <p className="text-sm text-slate">Loading…</p>}
        <div className="space-y-2">
          {vehicles.map((v) => (
            <div key={v.id} className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-navy">{v.label}</p>
                  <p className="text-sm text-slate">{v.driver_name ?? 'No driver set'} {v.driver_phone && `· ${v.driver_phone}`}</p>
                  <p className="text-xs text-slate mt-1">Plate: {v.plate_number ?? 'Not set'}</p>
                  <p className="text-xs mt-1">
                    {v.driver_user_id ? <span className="text-green-700">✓ Login active</span> : <span className="text-orange">No login linked</span>}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <button onClick={() => toggleActive(v)} className={`text-xs px-3 py-1.5 rounded-md border ${v.active ? 'border-green-600 text-green-700' : 'border-gray-300 text-slate'}`}>
                    {v.active ? 'Active' : 'Inactive'}
                  </button>
                  <button onClick={() => setConfirmingDeleteId(v.id)} className="text-xs text-red-600 underline">Delete</button>
                </div>
              </div>

              {confirmingDeleteId === v.id && (
                <div className="mt-3 bg-red-50 border border-red-200 rounded-md p-3">
                  <p className="text-sm text-red-800 mb-2">
                    Delete this vehicle{v.driver_user_id ? ' and its driver login' : ''}? Past shipments and location history stay on record, just unlinked.
                  </p>
                  <div className="flex gap-2">
                    <button onClick={() => setConfirmingDeleteId(null)} className="flex-1 border border-gray-300 text-slate text-xs py-2 rounded-md">Cancel</button>
                    <button onClick={() => handleDelete(v)} disabled={deletingId === v.id} className="flex-1 bg-red-600 text-white text-xs py-2 rounded-md disabled:opacity-50">
                      {deletingId === v.id ? 'Deleting…' : 'Confirm delete'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
