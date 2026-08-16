// Haversine distance in km between two coordinates
export function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// Greedy nearest-neighbor ordering — not a true optimal route (that's a much
// harder problem), but a reasonable, fast approximation: always go to
// whichever remaining stop is closest to wherever you currently are.
export function orderByProximity<T extends { lat: number | null; lng: number | null }>(
  startLat: number,
  startLng: number,
  stops: T[],
): T[] {
  const remaining = stops.filter((s) => s.lat != null && s.lng != null)
  const withoutCoords = stops.filter((s) => s.lat == null || s.lng == null)
  const ordered: T[] = []
  let curLat = startLat
  let curLng = startLng

  while (remaining.length > 0) {
    let nearestIdx = 0
    let nearestDist = Infinity
    for (let i = 0; i < remaining.length; i++) {
      const d = distanceKm(curLat, curLng, remaining[i].lat as number, remaining[i].lng as number)
      if (d < nearestDist) { nearestDist = d; nearestIdx = i }
    }
    const next = remaining.splice(nearestIdx, 1)[0]
    ordered.push(next)
    curLat = next.lat as number
    curLng = next.lng as number
  }

  return [...ordered, ...withoutCoords]
}
