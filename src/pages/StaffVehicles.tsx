import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import StaffNav from '../components/StaffNav'

type Vehicle = {
  id: string
  label: string
  driver_name: string | null
  driver_phone: string | null
  plate_number: string | null
  tracking_source: string
  hardware_device_id: string | null
  driver_user_id: string | null
  active: boolean
}

export default function StaffVehicles() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [label, setLabel] = useState('')
  const [driverName, setDriverName] = useState('')
  const [driverPhone, setDriverPhone] = useState('')
  const [plateNumber, setPlateNumber] = useState('')
  const [trackingSource, setTrackingSource] = useState('hardware')
  const [hardwareDeviceId, setHardwareDeviceId] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function loadVehicles() {
    setLoading(true)
    supabase.from('vehicles').select('*').order('label').then(({ data }) => {
      setVehicles((data as Vehicle[]) ?? [])
      setLoading(false)
    })
  }

  useEffect(() => { loadVehicles() }, [])

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    const { error } = await supabase.from('vehicles').insert({
      label,
      driver_name: driverName || null,
      driver_phone: driverPhone || null,
      plate_number: plateNumber || null,
      tracking_source: trackingSource,
      hardware_device_id: trackingSource === 'hardware' ? (hardwareDeviceId || null) : null,
      active: true,
    })
    if (error) {
      setError(error.message)
    } else {
      setLabel(''); setDriverName(''); setDriverPhone(''); setPlateNumber(''); setHardwareDeviceId('')
      loadVehicles()
    }
    setSaving(false)
  }

  async function toggleActive(vehicle: Vehicle) {
    await supabase.from('vehicles').update({ active: !vehicle.active }).eq('id', vehicle.id)
    loadVehicles()
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24 md:pb-8">
      <StaffNav />
      <div className="max-w-2xl mx-auto px-6">
        <h1 className="text-xl font-semibold text-navy mb-2">Vehicles</h1>
        <p className="text-sm text-slate mb-6">
          This is for vehicles tracked by hardware GPS trackers. Driver logins and phone-tracked vehicles are set up by management.
        </p>

        <form onSubmit={handleAdd} className="bg-white rounded-lg shadow-sm p-5 mb-6">
          <h2 className="text-sm font-semibold text-slate uppercase mb-3">Add vehicle</h2>
          <input placeholder="Label (e.g. Truck 3)" value={label} onChange={e => setLabel(e.target.value)} required className="w-full border rounded-md px-3 py-2 mb-2" />
          <input placeholder="Driver name (optional)" value={driverName} onChange={e => setDriverName(e.target.value)} className="w-full border rounded-md px-3 py-2 mb-2" />
          <input placeholder="Driver phone (optional)" value={driverPhone} onChange={e => setDriverPhone(e.target.value)} className="w-full border rounded-md px-3 py-2 mb-2" />
          <input placeholder="Plate number" value={plateNumber} onChange={e => setPlateNumber(e.target.value)} className="w-full border rounded-md px-3 py-2 mb-2" />
          <input placeholder="Hardware device ID" value={hardwareDeviceId} onChange={e => setHardwareDeviceId(e.target.value)} className="w-full border rounded-md px-3 py-2 mb-2" />
          {error && <p className="text-sm text-red-600 mb-2">{error}</p>}
          <button type="submit" disabled={saving} className="w-full bg-orange text-white font-medium py-2 rounded-md disabled:opacity-50">
            {saving ? 'Adding…' : 'Add vehicle'}
          </button>
        </form>

        <h2 className="text-sm font-semibold text-slate uppercase mb-3">All vehicles</h2>
        {loading && <p className="text-sm text-slate">Loading…</p>}
        <div className="space-y-2">
          {vehicles.map((v) => (
            <div key={v.id} className="bg-white rounded-lg shadow-sm p-4 flex items-center justify-between">
              <div>
                <p className="font-medium text-navy">{v.label}</p>
                <p className="text-sm text-slate">{v.driver_name ?? 'No driver set'} {v.driver_phone && `· ${v.driver_phone}`}</p>
                <p className="text-xs text-slate mt-1">Plate: {v.plate_number ?? 'Not set'}</p>
                <p className="text-xs text-slate mt-1">
                  {v.tracking_source === 'hardware' ? `Hardware (${v.hardware_device_id ?? 'no device ID'})` : 'Phone tracking'}
                </p>
                {v.driver_user_id && <p className="text-xs text-green-700 mt-1">✓ Has a driver login (managed under Management → Drivers)</p>}
              </div>
              <button onClick={() => toggleActive(v)} className={`text-xs px-3 py-1.5 rounded-md border shrink-0 ${v.active ? 'border-green-600 text-green-700' : 'border-gray-300 text-slate'}`}>
                {v.active ? 'Active' : 'Inactive'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
