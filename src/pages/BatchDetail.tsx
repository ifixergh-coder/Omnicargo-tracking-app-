import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { STATUS_OPTIONS, STATUS_LABELS } from '../lib/statusLabels'
import StaffNav from '../components/StaffNav'

type Batch = {
  id: string
  batch_number: string
  origin: string | null
  destination: string | null
  status: string
}

type Shipment = {
  id: string
  tracking_number: string
  sender_name: string
  recipient_name: string
  status: string
}

export default function BatchDetail() {
  const { id } = useParams()
  const [batch, setBatch] = useState<Batch | null>(null)
  const [members, setMembers] = useState<Shipment[]>([])
  const [unassigned, setUnassigned] = useState<Shipment[]>([])
  const [selectedToAdd, setSelectedToAdd] = useState<Set<string>>(new Set())
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null)
  const [updating, setUpdating] = useState(false)
  const [savedMessage, setSavedMessage] = useState<string | null>(null)
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null)

  function loadAll() {
    if (!id) return
    supabase.from('batches').select('*').eq('id', id).maybeSingle().then(({ data }) => {
      setBatch(data as Batch)
      setSelectedStatus((data as Batch)?.status ?? null)
    })
    supabase.from('shipments').select('id, tracking_number, sender_name, recipient_name, status').eq('batch_id', id)
      .then(({ data }) => setMembers((data as Shipment[]) ?? []))
    supabase.from('shipments').select('id, tracking_number, sender_name, recipient_name, status').is('batch_id', null)
      .order('created_at', { ascending: false }).limit(50)
      .then(({ data }) => setUnassigned((data as Shipment[]) ?? []))
  }

  useEffect(() => {
    loadAll()
    supabase.auth.getUser().then(({ data }) => setCurrentUserEmail(data.user?.email ?? null))
  }, [id])

  function toggleSelect(shipmentId: string) {
    setSelectedToAdd((prev) => {
      const next = new Set(prev)
      if (next.has(shipmentId)) next.delete(shipmentId)
      else next.add(shipmentId)
      return next
    })
  }

  async function addSelected() {
    if (selectedToAdd.size === 0) return
    await supabase.from('shipments').update({ batch_id: id }).in('id', Array.from(selectedToAdd))
    setSelectedToAdd(new Set())
    loadAll()
  }

  async function removeMember(shipmentId: string) {
    await supabase.from('shipments').update({ batch_id: null }).eq('id', shipmentId)
    loadAll()
  }

  async function confirmBulkStatus() {
    if (!batch || !selectedStatus || members.length === 0) return
    setUpdating(true)
    await supabase.from('batches').update({ status: selectedStatus }).eq('id', batch.id)
    await supabase.from('shipments').update({ status: selectedStatus }).eq('batch_id', batch.id)
    const events = members.map((m) => ({
      shipment_id: m.id,
      status: selectedStatus,
      note: `Bulk update via batch ${batch.batch_number}`,
      updated_by_email: currentUserEmail,
    }))
    await supabase.from('status_events').insert(events)
    setUpdating(false)
    setSavedMessage(`All ${members.length} item(s) updated to "${STATUS_LABELS[selectedStatus]}"`)
    setTimeout(() => setSavedMessage(null), 4000)
    loadAll()
  }

  if (!batch) return <div className="min-h-screen flex items-center justify-center text-slate">Loading…</div>

  const hasChange = selectedStatus !== batch.status

  return (
    <div className="min-h-screen bg-gray-50 pb-24 md:pb-8">
      <StaffNav />
      <div className="max-w-2xl mx-auto px-6">
        <Link to="/staff/batches" className="text-orange underline text-sm">← All batches</Link>

        <div className="bg-white rounded-lg shadow-sm p-5 mt-4 mb-6">
          <div className="flex items-center justify-between mb-1">
            <p className="font-mono font-bold text-lg text-navy">{batch.batch_number}</p>
            <Link to={`/staff/batches/${batch.id}/waybill`} className="text-orange underline text-sm">View waybill</Link>
          </div>
          <p className="text-sm text-slate mb-4">{batch.origin ?? '—'} → {batch.destination ?? '—'} · {members.length} item(s)</p>

          <p className="text-xs font-semibold text-slate uppercase mb-2">
            Current status: <span className="text-navy">{STATUS_LABELS[batch.status]}</span>
          </p>
          <div className="grid grid-cols-2 gap-2 mb-4">
            {STATUS_OPTIONS.map((s) => (
              <button
                key={s}
                onClick={() => setSelectedStatus(s)}
                className={`text-sm py-2 px-2 rounded-md border text-center leading-tight ${
                  selectedStatus === s ? 'bg-orange text-white border-orange' : 'border-gray-300 text-navy'
                }`}
              >
                {STATUS_LABELS[s]}
              </button>
            ))}
          </div>
          <button
            onClick={confirmBulkStatus}
            disabled={!hasChange || updating || members.length === 0}
            className="w-full bg-navy text-white font-medium py-3 rounded-md disabled:opacity-40"
          >
            {updating ? 'Updating all items…' : hasChange ? `Update all ${members.length} item(s) to: ${STATUS_LABELS[selectedStatus!]}` : 'No change selected'}
          </button>
          {savedMessage && <p className="text-sm text-green-600 text-center mt-3 font-medium">✓ {savedMessage}</p>}
        </div>

        <div className="bg-white rounded-lg shadow-sm p-5 mb-6">
          <h2 className="text-sm font-semibold text-slate uppercase mb-3">Items in this batch ({members.length})</h2>
          {members.length === 0 && <p className="text-sm text-slate">No items added yet.</p>}
          <div className="space-y-2">
            {members.map((m) => (
              <div key={m.id} className="flex items-center justify-between text-sm border-b border-gray-100 pb-2">
                <div>
                  <p className="font-mono text-navy">{m.tracking_number}</p>
                  <p className="text-xs text-slate">{m.sender_name} → {m.recipient_name}</p>
                </div>
                <button onClick={() => removeMember(m.id)} className="text-xs text-red-600 underline">Remove</button>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-5">
          <h2 className="text-sm font-semibold text-slate uppercase mb-3">Add unassigned shipments</h2>
          <div className="space-y-2 mb-3 max-h-64 overflow-y-auto">
            {unassigned.map((s) => (
              <label key={s.id} className="flex items-center gap-2 text-sm border-b border-gray-100 pb-2">
                <input type="checkbox" checked={selectedToAdd.has(s.id)} onChange={() => toggleSelect(s.id)} />
                <span className="font-mono text-navy">{s.tracking_number}</span>
                <span className="text-xs text-slate">{s.sender_name} → {s.recipient_name}</span>
              </label>
            ))}
            {unassigned.length === 0 && <p className="text-sm text-slate">No unassigned shipments available.</p>}
          </div>
          <button onClick={addSelected} disabled={selectedToAdd.size === 0} className="w-full bg-orange text-white font-medium py-2 rounded-md disabled:opacity-50">
            Add {selectedToAdd.size > 0 ? `${selectedToAdd.size} ` : ''}selected item(s)
          </button>
        </div>
      </div>
    </div>
  )
}
