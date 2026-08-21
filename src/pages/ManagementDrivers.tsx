import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import ManagementNav from '../components/ManagementNav'

type DriverRequest = {
  id: string
  user_id: string
  full_name: string
  phone: string | null
  email: string
  created_at: string
}

type DriverCode = { code: string; used_by: string | null; created_at: string }

type Vehicle = {
  id: string
  label: string
  vehicle_type: string | null
  plate_number: string | null
  driver_name: string | null
  driver_phone: string | null
  driver_user_id: string | null
  active: boolean
}

function generateCode(): string {
  return Array.from({ length: 8 }, () =>
    '0123456789ABCDEFGHJKLMNPQRSTUVWXYZ'.charAt(Math.floor(Math.random() * 34)),
  ).join('')
}

export default function ManagementDrivers() {
  const [requests, setRequests] = useState<DriverRequest[]>([])
  const [codes, setCodes] = useState<DriverCode[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null)
  const [selectedVehicleFor, setSelectedVehicleFor] = useState<Record<string, string>>({})

  const [vehicleLabel, setVehicleLabel] = useState('')
  const [vehicleType, setVehicleType] = useState('')
  const [plateNumber, setPlateNumber] = useState('')
  const [addingVehicle, setAddingVehicle] = useState(false)
  const [vehicleError, setVehicleError] = useState<string | null>(null)

  function loadData() {
    setLoading(true)
    supabase.from('driver_signup_requests').select('*').eq('status', 'pending').order('created_at', { ascending: false })
      .then(({ data }) => setRequests((data as DriverRequest[]) ?? []))
    supabase.from('driver_signup_codes').select('*').order('created_at', { ascending: false }).limit(20)
      .then(({ data }) => setCodes((data as DriverCode[]) ?? []))
    supabase.from('vehicles').select('*').order('label')
      .then(({ data }) => { setVehicles((data as Vehicle[]) ?? []); setLoading(false) })
  }

  useEffect(() => { loadData() }, [])

  const unassignedVehicles = vehicles.filter((v) => !v.driver_user_id && v.active)

  async function createCode() {
    const { data: userData } = await supabase.auth.getUser()
    await supabase.from('driver_signup_codes').insert({ code: generateCode(), created_by: userData.user?.id })
    loadData()
  }

  async function addVehicle(e: React.FormEvent) {
    e.preventDefault()
    setAddingVehicle(true)
    setVehicleError(null)
    const { error } = await supabase.from('vehicles').insert({
      label: vehicleLabel,
      vehicle_type: vehicleType || null,
      plate_number: plateNumber || null,
      tracking_source: 'phone',
      active: true,
    })
    if (error) {
      setVehicleError(error.message)
    } else {
      setVehicleLabel(''); setVehicleType(''); setPlateNumber('')
      loadData()
    }
    setAddingVehicle(false)
  }

  async function assignVehicle(req: DriverRequest) {
    const vehicleId = selectedVehicleFor[req.id]
    if (!vehicleId) return
    setProcessing(req.id)

    const { error: assignError } = await supabase.from('vehicles').update({
      driver_user_id: req.user_id,
      driver_name: req.full_name,
      driver_phone: req.phone,
    }).eq('id', vehicleId)

    if (assignError) {
      alert(assignError.message)
      setProcessing(null)
      return
    }

    await supabase.from('driver_signup_requests').update({ status: 'approved', reviewed_at: new Date().toISOString() }).eq('id', req.id)
    setProcessing(null)
    loadData()
  }

  async function reject(req: DriverRequest) {
    setProcessing(req.id)
    await supabase.from('driver_signup_requests').update({ status: 'rejected', reviewed_at: new Date().toISOString() }).eq('id', req.id)
    setProcessing(null)
    loadData()
  }

  async function unassignVehicle(vehicle: Vehicle) {
    await supabase.from('vehicles').update({ driver_user_id: null, driver_name: null, driver_phone: null }).eq('id', vehicle.id)
    loadData()
  }

  async function handleDeleteVehicle(vehicle: Vehicle) {
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
      if (!res.ok) alert(data.error ?? 'Could not delete')
      else if (data.warning) alert(data.warning)
    } catch {
      alert('Could not reach the server.')
    } finally {
      setDeletingId(null)
      setConfirmingDeleteId(null)
      loadData()
    }
  }

  async function toggleActive(vehicle: Vehicle) {
    await supabase.from('vehicles').update({ active: !vehicle.active }).eq('id', vehicle.id)
    loadData()
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      <ManagementNav />
      <div className="max-w-2xl mx-auto px-6">
        <h1 className="text-xl font-semibold text-navy mb-6">Drivers & vehicles</h1>

        <div className="bg-white rounded-lg shadow-sm p-5 mb-6">
          <h2 className="text-sm font-semibold text-slate uppercase mb-3">Add a vehicle to the fleet</h2>
          <form onSubmit={addVehicle}>
            <input placeholder="Vehicle name (e.g. Truck 3)" value={vehicleLabel} onChange={e => setVehicleLabel(e.target.value)} required className="w-full border rounded-md px-3 py-2 mb-2" />
            <select value={vehicleType} onChange={e => setVehicleType(e.target.value)} className="w-full border rounded-md px-3 py-2 mb-2">
              <option value="">Vehicle type…</option>
              <option value="Truck">Truck</option>
              <option value="Van">Van</option>
              <option value="Motorbike">Motorbike</option>
              <option value="Car">Car</option>
              <option value="Tricycle">Tricycle</option>
            </select>
            <input placeholder="Plate number" value={plateNumber} onChange={e => setPlateNumber(e.target.value)} className="w-full border rounded-md px-3 py-2 mb-2" />
            {vehicleError && <p className="text-sm text-red-600 mb-2">{vehicleError}</p>}
            <button type="submit" disabled={addingVehicle} className="w-full bg-navy text-white font-medium py-2 rounded-md disabled:opacity-50">
              {addingVehicle ? 'Adding…' : 'Add vehicle'}
            </button>
          </form>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-5 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate uppercase">Sign-up reference codes</h2>
            <button onClick={createCode} className="text-xs bg-navy text-white px-3 py-1.5 rounded-md">
              Generate code
            </button>
          </div>
          <p className="text-xs text-slate mb-3">
            Give a code to a new driver to enter at /driver/signup.
          </p>
          <div className="space-y-1">
            {codes.map((c) => (
              <div key={c.code} className="flex items-center justify-between text-sm border-b border-gray-100 pb-1">
                <span className="font-mono text-navy">{c.code}</span>
                <span className="text-xs text-slate">{c.used_by ? 'Used' : 'Unused'} · {new Date(c.created_at).toLocaleDateString()}</span>
              </div>
            ))}
            {codes.length === 0 && <p className="text-sm text-slate">No codes generated yet.</p>}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-5 mb-6">
          <h2 className="text-sm font-semibold text-slate uppercase mb-3">Drivers waiting for a vehicle</h2>
          {loading && <p className="text-sm text-slate">Loading…</p>}
          {!loading && requests.length === 0 && <p className="text-sm text-slate">No pending sign-ups.</p>}
          <div className="space-y-3">
            {requests.map((r) => (
              <div key={r.id} className="border-b border-gray-100 pb-3 text-sm">
                <p className="font-medium text-navy">{r.full_name}</p>
                <p className="text-xs text-slate mb-2">{r.email} {r.phone && `· ${r.phone}`} · {new Date(r.created_at).toLocaleDateString()}</p>
                <div className="flex gap-2 items-center flex-wrap">
                  <select
                    value={selectedVehicleFor[r.id] ?? ''}
                    onChange={(e) => setSelectedVehicleFor((prev) => ({ ...prev, [r.id]: e.target.value }))}
                    className="text-sm border rounded-md px-2 py-1.5"
                  >
                    <option value="">Select vehicle…</option>
                    {unassignedVehicles.map((v) => (
                      <option key={v.id} value={v.id}>{v.label} {v.plate_number && `— ${v.plate_number}`}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => assignVehicle(r)}
                    disabled={processing === r.id || !selectedVehicleFor[r.id]}
                    className="text-xs bg-orange text-white px-3 py-1.5 rounded-md disabled:opacity-50"
                  >
                    Assign vehicle
                  </button>
                  <button onClick={() => reject(r)} disabled={processing === r.id} className="text-xs border border-gray-300 text-slate px-3 py-1.5 rounded-md disabled:opacity-50">
                    Reject
                  </button>
                </div>
                {unassignedVehicles.length === 0 && (
                  <p className="text-xs text-orange mt-2">No unassigned vehicles available — add one above first.</p>
                )}
              </div>
            ))}
          </div>
        </div>

        <h2 className="text-sm font-semibold text-slate uppercase mb-3">All vehicles</h2>
        <div className="space-y-2">
          {vehicles.map((v) => (
            <div key={v.id} className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-navy">{v.label} {v.vehicle_type && <span className="text-xs text-slate">({v.vehicle_type})</span>}</p>
                  <p className="text-xs text-slate mt-1">Plate: {v.plate_number ?? 'Not set'}</p>
                  {v.driver_user_id ? (
                    <p className="text-xs text-green-700 mt-1">✓ Assigned to {v.driver_name ?? 'a driver'} {v.driver_phone && `· ${v.driver_phone}`}</p>
                  ) : (
                    <p className="text-xs text-orange mt-1">Unassigned</p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <button onClick={() => toggleActive(v)} className={`text-xs px-3 py-1.5 rounded-md border ${v.active ? 'border-green-600 text-green-700' : 'border-gray-300 text-slate'}`}>
                    {v.active ? 'Active' : 'Inactive'}
                  </button>
                  {v.driver_user_id && (
                    <button onClick={() => unassignVehicle(v)} className="text-xs text-orange underline">Unassign driver</button>
                  )}
                  <button onClick={() => setConfirmingDeleteId(v.id)} className="text-xs text-red-600 underline">Delete</button>
                </div>
              </div>

              {confirmingDeleteId === v.id && (
                <div className="mt-3 bg-red-50 border border-red-200 rounded-md p-3">
                  <p className="text-sm text-red-800 mb-2">
                    Delete this vehicle{v.driver_user_id ? ' and remove its assigned driver\'s login' : ''}? Past shipments and location history stay on record, just unlinked.
                  </p>
                  <div className="flex gap-2">
                    <button onClick={() => setConfirmingDeleteId(null)} className="flex-1 border border-gray-300 text-slate text-xs py-2 rounded-md">Cancel</button>
                    <button onClick={() => handleDeleteVehicle(v)} disabled={deletingId === v.id} className="flex-1 bg-red-600 text-white text-xs py-2 rounded-md disabled:opacity-50">
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
