import { loadGoogleMapsScript } from './googleMaps'

// Converts raw coordinates into a real, readable address.
// Falls back to plain coordinates if Google can't resolve one.
export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    await loadGoogleMapsScript()
    return await new Promise((resolve) => {
      const geocoder = new window.google.maps.Geocoder()
      geocoder.geocode({ location: { lat, lng } }, (results: any, status: string) => {
        if (status === 'OK' && results?.[0]) resolve(results[0].formatted_address)
        else resolve(`Current location (${lat.toFixed(5)}, ${lng.toFixed(5)})`)
      })
    })
  } catch {
    return `Current location (${lat.toFixed(5)}, ${lng.toFixed(5)})`
  }
}
