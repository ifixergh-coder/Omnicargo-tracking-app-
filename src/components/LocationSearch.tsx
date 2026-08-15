import { useEffect, useRef, useState } from 'react'
import { loadGoogleMapsScript } from '../lib/googleMaps'

type Props = {
  onSelect: (result: { address: string; lat: number; lng: number }) => void
  placeholder?: string
}

export default function LocationSearch({ onSelect, placeholder }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    loadGoogleMapsScript().then(() => setReady(true)).catch(() => setReady(false))
  }, [])

  useEffect(() => {
    if (!ready || !inputRef.current) return
    const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
      componentRestrictions: { country: 'gh' },
      fields: ['formatted_address', 'geometry', 'name'],
    })
    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace()
      if (place.geometry?.location) {
        onSelect({
          address: place.name ? `${place.name}, ${place.formatted_address}` : place.formatted_address,
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
        })
      }
    })
  }, [ready, onSelect])

  return (
    <input
      ref={inputRef}
      placeholder={placeholder ?? 'Search for a landmark or address'}
      className="w-full border rounded-md px-3 py-2"
    />
  )
}
