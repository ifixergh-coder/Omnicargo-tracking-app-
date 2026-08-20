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
  const [trackingSource, setTrackingSource] = useState('phone')
  const [hardwareDeviceId, setHardwareDeviceId] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editPlate, setEditPlate] = useState('')

  const [linkingVehicleId, setLinkingVehicleId] = useState<string | null>(null)
  const [linkEmail, setLinkEmail] = useState('')
  const [linkError, setLinkError] = useState<string | null>(null)
  const [linking, setLinking] = useState(false)

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
      setLabel(''); setDriverName(''); setDriverPhone(''); setPlateNumber(''); setHardwareDeviceId(''); setTrackingSource('phone')
      loadVehicles()
    }
    setSaving(false)
  }

  async function toggleActive(vehicle: Vehicle) {
    await supabase.from('vehicles').update({ active: !vehicle.active }).eq('id', vehicle.id)
    loadVehicles()
  }

  function startEditPlate(vehicle: Vehicle) {
    setEditingId(vehicle.id)
    setEditPlate(vehicle.plate_number ?? '')
  }

  async function savePlate(vehicleId: string) {
    await supabase.from('vehicles').update({ plate_number: editPlate || null }).eq('id', vehicleId)
    setEditingId(null)
    loadVehicles()
  }

  async function linkDriverLogin(vehicleId: string) {
    setLinking(true)
    setLinkError(null)
    const { data, error } = await supabase.rpc('link_vehicle_to_driver_by_email', {
      vehicle_id: vehicleId,
      driver_email: linkEmail.trim(),
    })
    if (error) {
      setLinkError(error.message)
      setLinking(false)
      return
    }
    if (!data) {
      setLinkError('No account found with that email. They need to sign up first.')
      setLinking(false)
      return
    }
    setLinking(false)
    setLinkingVehicleId(null)
    setLinkEmail('')
    loadVehicles()
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24 md:pb-8">
      <StaffNav />
      <div className="max-w-2xl mx-auto px-6">
        <h1 className="text-xl font-semibold text-navy mb-6">Vehicles</h1>

        <form onSubmit={handleAdd} className="bg-white rounded-lg shadow-sm p-5 mb-6">
          <h2 className="text-sm font-semibold text-slate uppercase mb-3">Add vehicle</h2>
          <input placeholder="Label (e.g. Truck 3, Kojo's bike)" value={label} onChange={e => setLabel(e.target.value)} required className="w-full border rounded-md px-3 py-2 mb-2" />
          <input placeholder="Driver name (optional)" value={driverName} onChange={e => setDriverName(e.target.value)} className="w-full border rounded-md px-3 py-2 mb-2" />
          <input placeholder="Driver phone (optional)" value={driverPhone} onChange={e => setDriverPhone(e.target.value)} className="w-full border rounded-md px-3 py-2 mb-2" />
          <input placeholder="Plate number (e.g. GT 1234-24)" value={plateNumber} onChange={e => setPlateNumber(e.target.value)} className="w-full border rounded-md px-3 py-2 mb-2" />
          <label className="block text-sm text-slate mb-1">Tracking source</label>
          <select value={trackingSource} onChange={e => setTrackingSource(e.target.value)} className="w-full border rounded-md px-3 py-2 mb-2">
            <option value="phone">Phone (driver shares location)</option>
            <option value="hardware">Hardware GPS tracker</option>
          </select>
          {trackingSource === 'hardware' && (
            <input placeholder="Hardware device ID" value={hardwareDeviceId} onChange={e => setHardwareDeviceId(e.target.value)} className="w-full border rounded-md px-3 py-2 mb-2" />
          )}
          {error && <p className="text-sm text-red-600 mb-2">{error}</p>}
          <button type="submit" disabled={saving} className="w-full bg-orange text-white font-medium py-2 rounded-md disabled:opacity-50">
            {saving ? 'Adding…' : 'Add vehicle'}
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

                  {editingId === v.id ? (
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        placeholder="Plate number"
                        value={editPlate}
                        onChange={(e) => setEditPlate(e.target.value)}
                        className="border rounded-md px-2 py-1 text-sm"
                      />
                      <button onClick={() => savePlate(v.id)} className="text-xs text-orange underline">Save</button>
                      <button onClick={() => setEditingId(null)} className="text-xs text-slate underline">Cancel</button>
                    </div>
                  ) : (
                    <p className="text-xs text-slate mt-1">
                      Plate: {v.plate_number ?? 'Not set'} <button onClick={() => startEditPlate(v)} className="text-orange underline ml-1">Edit</button>
                    </p>
                  )}

                  <p className="text-xs text-slate mt-1">
                    {v.tracking_source === 'hardware' ? `Hardware (${v.hardware_device_id ?? 'no device ID'})` : 'Phone tracking'}
                  </p>
                  <p className="text-xs mt-1">
                    {v.driver_user_id ? (
                      <span className="text-green-700">✓ Driver login linked</span>
                    ) : (
                      <span className="text-orange">No login linked — driver-only features won't work</span>
                    )}
                  </p>
                </div>
                <button onClick={() => toggleActive(v)} className={`text-xs px-3 py-1.5 rounded-md border shrink-0 ${v.active ? 'border-green-600 text-green-700' : 'border-gray-300 text-slate'}`}>
                  {v.active ? 'Active' : 'Inactive'}
                </button>
              </div>

              {!v.driver_user_id && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  {linkingVehicleId === v.id ? (
                    <div>
                      <p className="text-xs text-slate mb-2">
                        Enter the email of a rider who has already signed up at /driver/signup or /staff/signup with this exact address.
                      </p>
                      <input
                        placeholder="driver@email.com"
                        value={linkEmail}
                        onChange={(e) => setLinkEmail(e.target.value)}
                        className="w-full border rounded-md px-3 py-2 mb-2 text-sm"
                      />
                      {linkError && <p className="text-xs text-red-600 mb-2">{linkError}</p>}
                      <div className="flex gap-2">
                        <button onClick={() => { setLinkingVehicleId(null); setLinkError(null) }} className="flex-1 border border-gray-300 text-slate text-xs py-2 rounded-md">
                          Cancel
                        </button>
                        <button onClick={() => linkDriverLogin(v.id)} disabled={linking || !linkEmail.trim()} className="flex-1 bg-orange text-white text-xs py-2 rounded-md disabled:opacity-50">
                          {linking ? 'Linking…' : 'Link login'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => setLinkingVehicleId(v.id)} className="text-xs text-orange underline">
                      Link a driver login to this vehicle
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
