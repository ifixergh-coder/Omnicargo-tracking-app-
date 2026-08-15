import { useEffect, useRef, useState } from 'react'

type Props = {
  onSelect: (result: { address: string; lat: number; lng: number }) => void
  placeholder?: string
}

declare global {
  interface Window {
    google: any
    initGooglePlaces?: () => void
  }
}

let scriptLoadingPromise: Promise<void> | null = null

function loadGooglePlacesScript(apiKey: string): Promise<void> {
  if (window.google?.maps?.places) return Promise.resolve()
  if (scriptLoadingPromise) return scriptLoadingPromise

  scriptLoadingPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`
    script.async = true
    script.onload = () => resolve()
    script.onerror = reject
    document.head.appendChild(script)
  })
  return scriptLoadingPromise
}

export default function LocationSearch({ onSelect, placeholder }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
    if (!apiKey) return
    loadGooglePlacesScript(apiKey).then(() => setReady(true)).catch(() => setReady(false))
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
