import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { STATUS_OPTIONS, STATUS_LABELS } from '../lib/statusLabels'

type Shipment = {
  id: string
  tracking_number: string
  sender_name: string
  recipient_name: string
  status: string
  destination_address: string | null
}

export default function DriverBatch() {
  const [vehicleId, setVehicleId] = useState<string | null>(null)
  const [batchId, setBatchId] = useState<string | null>(null)
  const [items, setItems] = useState<Shipment[]>([])
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [savedMessage, setSavedMessage] = useState<string | null>(null)

  async function loadData() {
    setLoading(true)
    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) { setLoading(false); return }

    const { data: vehicle } = await supabase.from('vehicles').select('id').eq('driver_user_id', userData.user.id).maybeSingle()
    if (!vehicle) { setLoading(false); return }
    setVehicleId(vehicle.id)

    const today = new Date().toISOString().slice(0, 10)
    const { data: batch } = await supabase
      .from('batches')
      .select('id, status')
      .eq('driver_vehicle_id', vehicle.id)
      .eq('batch_date', today)
      .maybeSingle()

    if (batch) {
      setBatchId(batch.id)
      setSelectedStatus(batch.status)
      const { data: members } = await supabase
        .from('shipments')
        .select('id, tracking_number, sender_name, recipient_name, status, destination_address')
        .eq('batch_id', batch.id)
        .order('created_at', { ascending: false })
      setItems((members as Shipment[]) ?? [])
    }
    setLoading(false)
  }

  useEffect(() => { loadData() }, [])

  const remaining = items.filter((i) => i.status !== 'delivered')
  const delivered = items.filter((i) => i.status === 'delivered')

  async function confirmBulkStatus() {
    if (!batchId || !selectedStatus || remaining.length === 0) return
    setUpdating(true)
    const { data: userData } = await supabase.auth.getUser()
    const ids = remaining.map((i) => i.id)

    await supabase.from('batches').update({ status: selectedStatus }).eq('id', batchId)
    await supabase.from('shipments').update({ status: selectedStatus }).in('id', ids)
    const events = remaining.map((i) => ({
      shipment_id: i.id, status: selectedStatus, note: 'Bulk update via driver batch', updated_by_email: userData.user?.email,
    }))
    await supabase.from('status_events').insert(events)

    setUpdating(false)
    setSavedMessage(`${remaining.length} item(s) updated to "${STATUS_LABELS[selectedStatus]}"`)
    setTimeout(() => setSavedMessage(null), 4000)
    loadData()
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center text-slate">Loading…</div>

  if (!vehicleId) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="text-navy font-medium">No driver vehicle linked to this account.</p>
        <a href="/driver" className="text-orange underline">Back to driver page</a>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-8">
      <div className="max-w-md mx-auto">
        <a href="/driver" className="text-orange underline text-sm">← Back to location sharing</a>
        <h1 className="text-xl font-semibold text-navy mt-4 mb-2">Today's items</h1>

        {!batchId ? (
          <p className="text-sm text-slate">No batch started today yet — scan a pickup to begin one.</p>
        ) : (
          <>
            <div className="bg-white rounded-lg shadow-sm p-5 mb-6">
              <p className="text-sm text-slate mb-1">
                <span className="font-semibold text-navy">{remaining.length}</span> remaining ·
                <span className="ml-1">{delivered.length} delivered</span>
              </p>
              <p className="text-xs text-slate mb-3">Select a status to update all remaining items together</p>
              <div className="grid grid-cols-2 gap-2 mb-3">
                {STATUS_OPTIONS.filter((s) => s !== 'delivered').map((s) => (
                  <button key={s} onClick={() => setSelectedStatus(s)} className={`text-sm py-2 px-2 rounded-md border text-center leading-tight ${selectedStatus === s ? 'bg-orange text-white border-orange' : 'border-gray-300 text-navy'}`}>
                    {STATUS_LABELS[s]}
                  </button>
                ))}
              </div>
              <button onClick={confirmBulkStatus} disabled={updating || remaining.length === 0} className="w-full bg-navy text-white font-medium py-3 rounded-md disabled:opacity-40">
                {updating ? 'Updating…' : `Update all ${remaining.length} remaining item(s)`}
              </button>
              {savedMessage && <p className="text-sm text-green-600 text-center mt-3 font-medium">✓ {savedMessage}</p>}
              <p className="text-xs text-slate mt-3">To mark an individual item delivered (with photo), scan its QR code.</p>
            </div>

            <h2 className="text-sm font-semibold text-slate uppercase mb-2">Remaining ({remaining.length})</h2>
            <div className="space-y-2 mb-6">
              {remaining.map((i) => (
                <Link key={i.id} to={`/staff/scan/${i.tracking_number}`} className="block bg-white rounded-lg shadow-sm p-3 text-sm">
                  <p className="font-mono text-navy">{i.tracking_number}</p>
                  <p className="text-xs text-slate">{i.sender_name} → {i.recipient_name}</p>
                  {i.destination_address && <p className="text-xs text-slate">{i.destination_address}</p>}
                </Link>
              ))}
            </div>

            {delivered.length > 0 && (
              <>
                <h2 className="text-sm font-semibold text-slate uppercase mb-2">Delivered ({delivered.length})</h2>
                <div className="space-y-2">
                  {delivered.map((i) => (
                    <div key={i.id} className="bg-gray-100 rounded-lg p-3 text-sm opacity-50">
                      <p className="font-mono text-slate line-through">{i.tracking_number}</p>
                      <p className="text-xs text-slate">{i.sender_name} → {i.recipient_name}</p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}
