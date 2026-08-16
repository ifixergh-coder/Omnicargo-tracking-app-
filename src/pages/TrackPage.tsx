import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
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

type StatusEvent = { id: number; status: string; note: string | null; created_at: string }
type LocationPoint = { lat: number; lng: number }

export default function TrackPage() {
  const { trackingNumber } = useParams()
  const navigate = useNavigate()
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const marker = useRef<mapboxgl.Marker | null>(null)
  const animationFrame = useRef<number | null>(null)

  const [shipment, setShipment] = useState<Shipment | null>(null)
  const [events, setEvents] = useState<StatusEvent[]>([])
  const [notFound, setNotFound] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!trackingNumber) { setNotFound(true); setLoading(false); return }
    setLoading(true)
    setNotFound(false)

    supabase
      .from('shipments')
      .select('id, tracking_number, status, sender_name, recipient_name, destination_address, assigned_vehicle_id')
      .eq('tracking_number', trackingNumber)
      .maybeSingle()
      .then(
        ({ data, error }) => {
          if (error || !data) { setNotFound(true); setShipment(null) }
          else setShipment(data as Shipment)
          setLoading(false)
        },
        () => { setNotFound(true); setLoading(false) },
      )
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

  // Live map while in transit
  useEffect(() => {
    if (!shipment?.assigned_vehicle_id || !mapContainer.current) return
    const showMap = ['picked_up', 'in_transit', 'arrived_at_facility', 'out_for_delivery'].includes(shipment.status)
    if (!showMap) return

    if (!map.current) {
      map.current = new mapboxgl.Map({ container: mapContainer.current, style: 'mapbox://styles/mapbox/light-v11', center: [0, 0], zoom: 12 })
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
  }, [shipment?.assigned_vehicle_id, shipment?.status])

  // Animated route replay once delivered — uses the actual breadcrumb trail
  // of GPS points captured during the trip, simplified into a line, with the
  // marker animated moving from the first point to the last
  useEffect(() => {
    if (!shipment || shipment.status !== 'delivered' || !shipment.assigned_vehicle_id || !mapContainer.current) return

    async function buildAnimatedRoute() {
      const { data: points } = await supabase
        .from('location_updates')
        .select('lat, lng, recorded_at')
        .eq('vehicle_id', shipment!.assigned_vehicle_id)
        .order('recorded_at', { ascending: true })
        .limit(500)

      if (!points || points.length < 2) return

      // Thin the trail down to a manageable number of points for a clean line
      const step = Math.max(1, Math.floor(points.length / 50))
      const path: LocationPoint[] = points.filter((_, i) => i % step === 0).map((p) => ({ lat: p.lat, lng: p.lng }))

      if (!map.current) {
        map.current = new mapboxgl.Map({
          container: mapContainer.current!,
          style: 'mapbox://styles/mapbox/light-v11',
          center: [path[0].lng, path[0].lat],
          zoom: 12,
        })
      }

      map.current.on('load', () => drawRoute(path))
      if (map.current.isStyleLoaded()) drawRoute(path)
    }

    function drawRoute(path: LocationPoint[]) {
      const coords = path.map((p) => [p.lng, p.lat])

      if (!map.current!.getSource('route')) {
        map.current!.addSource('route', {
          type: 'geojson',
          data: { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: coords } },
        })
        map.current!.addLayer({
          id: 'route-line',
          type: 'line',
          source: 'route',
          paint: { 'line-color': '#0F2A4A', 'line-width': 3, 'line-dasharray': [1, 2] },
        })
      }

      const bounds = coords.reduce(
        (b, c) => b.extend(c as [number, number]),
        new mapboxgl.LngLatBounds(coords[0] as [number, number], coords[0] as [number, number]),
      )
      map.current!.fitBounds(bounds, { padding: 40 })

      // Simple truck emoji marker, animated stepping along the route
      const el = document.createElement('div')
      el.style.fontSize = '28px'
      el.textContent = '🚚'
      const truckMarker = new mapboxgl.Marker({ element: el }).setLngLat(coords[0] as [number, number]).addTo(map.current!)

      let i = 0
      function step() {
        if (i >= coords.length) return
        truckMarker.setLngLat(coords[i] as [number, number])
        i++
        animationFrame.current = window.setTimeout(step, 120) as unknown as number
      }
      step()
    }

    buildAnimatedRoute()

    return () => {
      if (animationFrame.current) clearTimeout(animationFrame.current)
    }
  }, [shipment?.status, shipment?.assigned_vehicle_id])

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

  const showMap = ['picked_up', 'in_transit', 'arrived_at_facility', 'out_for_delivery', 'delivered'].includes(shipment.status)

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

          {shipment.status === 'delivered' && (
            <Link to={`/track/${shipment.tracking_number}/proof`} className="inline-block mt-3 text-sm text-orange underline">
              View delivery photo
            </Link>
          )}
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
