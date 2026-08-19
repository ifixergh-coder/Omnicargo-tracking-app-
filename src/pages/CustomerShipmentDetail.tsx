import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import CustomerNav from '../components/CustomerNav'
import LocationSearch from '../components/LocationSearch'
import { STATUS_LABELS } from '../lib/statusLabels'

type Shipment = {
  id: string
  tracking_number: string
  status: string
  destination_address: string | null
}

export default function CustomerShipmentDetail() {
  const { id } = useParams()
  const [shipment, setShipment] = useState<Shipment | null>(null)
  const [pickedUpAt, setPickedUpAt] = useState<Date | null>(null)
  const [loading, setLoading] = useState(true)

  const [newAddress, setNewAddress] = useState('')
  const [newLat, setNewLat] = useState<number | null>(null)
  const [newLng, setNewLng] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [savedMessage, setSavedMessage] = useState<string | null>(null)

  async function load() {
    if (!id) return
    setLoading(true)
    const { data } = await supabase.from('shipments').select('id, tracking_number, status, destination_address').eq('id', id).maybeSingle()
    setShipment(data as Shipment)

    const { data: pickupEvent } = await supabase
      .from('status_events').select('created_at').eq('shipment_id', id).eq('status', 'picked_up')
      .order('created_at', { ascending: true }).limit(1).maybeSingle()
    setPickedUpAt(pickupEvent ? new Date(pickupEvent.created_at) : null)
    setLoading(false)
  }

  useEffect(() => { load() }, [id])

  const withinWindow = !pickedUpAt || (Date.now() - pickedUpAt.getTime()) < 30 * 60 * 1000

  async function handleUpdateAddress(e: React.FormEvent) {
    e.preventDefault()
    if (!shipment || !newAddress) return
    setSaving(true)
    setError(null)
    const { error } = await supabase.rpc('customer_update_delivery_address', {
      p_shipment_id: shipment.id, p_address: newAddress, p_lat: newLat, p_lng: newLng,
    })
    setSaving(false)
    if (error) {
      setError(error.message)
    } else {
      setSavedMessage('Delivery address updated')
      setTimeout(() => setSavedMessage(null), 3000)
      load()
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center text-slate">Loading…</div>
  if (!shipment) return <div className="min-h-screen flex items-center justify-center text-slate">Shipment not found.</div>

  return (
    <div className="min-h-screen bg-gray-50">
      <CustomerNav />
      <div className="max-w-md mx-auto px-6 pb-8">
        <Link to="/account" className="text-orange underline text-sm">← My shipments</Link>

        <div className="bg-white rounded-lg shadow-sm p-5 mt-4 mb-6">
          <p className="font-mono font-bold text-lg text-navy">{shipment.tracking_number}</p>
          <p className="text-sm text-slate mt-1">{STATUS_LABELS[shipment.status] ?? shipment.status}</p>
          {shipment.destination_address && <p className="text-sm text-slate mt-2">Current delivery address: {shipment.destination_address}</p>}
          <Link to={`/track/${shipment.tracking_number}`} className="text-sm text-orange underline mt-2 inline-block">Track this shipment</Link>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-5">
          <h2 className="text-sm font-semibold text-slate uppercase mb-2">Change delivery address</h2>
          {withinWindow ? (
            <>
              <p className="text-xs text-slate mb-3">
                {pickedUpAt
                  ? 'You can change this within 30 minutes of pickup.'
                  : 'You can change this any time before pickup.'}
              </p>
              <form onSubmit={handleUpdateAddress}>
                <LocationSearch placeholder="Search for a new delivery address" onSelect={({ address, lat, lng }) => { setNewAddress(address); setNewLat(lat); setNewLng(lng) }} />
                {newAddress && <p className="text-sm text-slate mt-2 mb-2">{newAddress}</p>}
                {error && <p className="text-sm text-red-600 mb-2">{error}</p>}
                <button type="submit" disabled={saving || !newAddress} className="w-full bg-orange text-white font-medium py-2.5 rounded-md disabled:opacity-50 mt-2">
                  {saving ? 'Updating…' : 'Update address'}
                </button>
                {savedMessage && <p className="text-sm text-green-600 text-center mt-2">✓ {savedMessage}</p>}
              </form>
            </>
          ) : (
            <p className="text-sm text-slate">
              The 30-minute window to change this shipment's delivery address has passed. Contact us directly if you need to make a change.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
