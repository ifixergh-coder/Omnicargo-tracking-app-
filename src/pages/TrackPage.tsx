import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import mapboxgl from 'mapbox-gl'
import { supabase } from '../lib/supabase'
import { STATUS_LABELS } from '../lib/statusLabels'

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN

type Shipment = {
  id: string
  tracking_number: string
  status: string
  sender_name: string
  recipient_name: string
  destination_address: string | null
  assigned_vehicle_id: string | null
}

type StatusEvent = {
  id: number
  status: string
  note: string | null
  created_at: string
}

export default function TrackPage() {
  const { trackingNumber } = useParams()
  const navigate = useNavigate()
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const marker = useRef<mapboxgl.Marker | null>(null)

  const [shipment, setShipment] = useState<Shipment | null>(null)
  const [events, setEvents] = useState<StatusEvent[]>([])
  const [notFound, setNotFound] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!trackingNumber) return
    setLoading(true)
    setNotFound(false)
    supabase
      .from('shipments')
      .select('id, tracking_number, status, sender_name, recipient_name, destination_address, assigned_vehicle_id')
      .eq('tracking_number', trackingNumber)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error || !data) { setNotFound(true); setShipment(null) }
        else setShipment(data as Shipment)
        setLoading(false)
      })
  }, [trackingNumber])

  useEffect(() => {
    if (!shipment) return
    supabase.from('status_events').select('id, status, note, created_at').eq('shipment_id', shipment.id)
      .order('created_at', { ascending: true }).then(({ data }) => setEvents((data as StatusEvent[]) ?? []))

    const channel = supabase.channel(`status-${shipment.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'status_events', filter: `shipment_id=eq.${shipment.id}` },
        (payload) => setEvents((prev) => [...prev, payload.new as StatusEvent]))
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [shipment?.id])

  useEffect(() => {
    if (!shipment?.assigned_vehicle_id || !mapContainer.current) return

    if (!map.current) {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/light-v11',
        center: [0, 0],
        zoom: 12,
      })
    }

    supabase.from('location_updates').select('lat, lng').eq('vehicle_id', shipment.assigned_vehicle_id)
      .order('recorded_at', { ascending: false }).limit(1).maybeSingle()
      .then(({ data }) => {
        if (data && map.current) {
          const pos: [number, number] = [data.lng, data.lat]
          map.current.setCenter(pos)
          marker.current = new mapboxgl.Marker({ color: '#F5821F' }).setLngLat(pos).addTo(map.current)
        }
      })

    const channel = supabase.channel(`location-${shipment.assigned_vehicle_id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'location_updates', filter: `vehicle_id=eq.${shipment.assigned_vehicle_id}` },
        (payload) => {
          const { lat, lng } = payload.new as { lat: number; lng: number }
          const pos: [number, number] = [lng, lat]
          if (!map.current) return
          if (!marker.current) marker.current = new mapboxgl.Marker({ color: '#F5821F' }).setLngLat(pos).addTo(map.current)
          else marker.current.setLngLat(pos)
          map.current.panTo(pos)
        })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [shipment?.assigned_vehicle_id])

  if (loading) return <div className="min-h-screen flex items-center justify-center text-slate">Looking up shipment…</div>

  if (notFound) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-navy font-medium">No shipment found for that tracking number.</p>
        <button onClick={() => navigate('/')} className="text-orange underline">Try another number</button>
      </div>
    )
  }

  if (!shipment) return null

  const showMap = ['picked_up', 'in_transit', 'arrived_at_facility', 'out_for_delivery'].includes(shipment.status)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-navy px-6 py-5 text-white">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-2.5 h-2.5 rounded-full bg-orange" />
          <span className="font-semibold">OmniCargo Tracking</span>
        </div>
        <p className="font-mono text-sm text-white/70">{shipment.tracking_number}</p>
      </div>

      {showMap && <div ref={mapContainer} className="w-full h-72 bg-gray-200" />}

      <div className="px-6 py-5 max-w-md mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-5 mb-5">
          <p className="text-xs uppercase tracking-wide text-slate mb-1">Status</p>
          <p className="text-lg font-semibold text-navy">{STATUS_LABELS[shipment.status] ?? shipment.status}</p>
          {shipment.destination_address && <p className="text-sm text-slate mt-2">Delivering to: {shipment.destination_address}</p>}
        </div>

        <div className="bg-white rounded-lg shadow-sm p-5">
          <p className="text-xs uppercase tracking-wide text-slate mb-3">Timeline</p>
          <ol className="space-y-3">
            {events.map((e) => (
              <li key={e.id} className="flex gap-3">
                <span className="w-2 h-2 mt-1.5 rounded-full bg-orange shrink-0" />
                <div>
                  <p className="text-sm font-medium text-navy">{STATUS_LABELS[e.status] ?? e.status}</p>
                  <p className="text-xs text-slate">{new Date(e.created_at).toLocaleString()}</p>
                  {e.note && <p className="text-xs text-slate mt-0.5">{e.note}</p>}
                </div>
              </li>
            ))}
            {events.length === 0 && <p className="text-sm text-slate">No updates yet.</p>}
          </ol>
        </div>
      </div>
    </div>
  )
}
