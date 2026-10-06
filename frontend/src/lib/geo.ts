export interface Boundary {
  type: string
  coordinates: unknown
}

export interface Projector {
  (lng: number, lat: number): { x: number; y: number }
}

function collectCoords(
  boundary: Boundary,
  visit: (lng: number, lat: number) => void,
): void {
  if (boundary.type === 'MultiPolygon') {
    const polys = boundary.coordinates as number[][][][]
    for (const poly of polys) {
      for (const ring of poly) {
        for (const coord of ring) {
          visit(coord[0], coord[1])
        }
      }
    }
  } else {
    const rings = boundary.coordinates as number[][][]
    for (const ring of rings) {
      for (const coord of ring) {
        visit(coord[0], coord[1])
      }
    }
  }
}

export function buildProjector(
  boundaries: (Boundary | null | undefined)[],
  width: number,
  height: number,
): Projector {
  let minLng = Number.POSITIVE_INFINITY
  let maxLng = Number.NEGATIVE_INFINITY
  let minLat = Number.POSITIVE_INFINITY
  let maxLat = Number.NEGATIVE_INFINITY

  for (const boundary of boundaries) {
    if (!boundary) continue
    collectCoords(boundary, (lng, lat) => {
      if (lng < minLng) minLng = lng
      if (lng > maxLng) maxLng = lng
      if (lat < minLat) minLat = lat
      if (lat > maxLat) maxLat = lat
    })
  }

  const lngSpan = maxLng - minLng || 1
  const latSpan = maxLat - minLat || 1
  const padding = 8

  return (lng: number, lat: number) => {
    const x = padding + ((lng - minLng) / lngSpan) * (width - padding * 2)
    const y = padding + ((maxLat - lat) / latSpan) * (height - padding * 2)
    return { x, y }
  }
}

export function boundaryToPath(boundary: Boundary, project: Projector): string {
  const parts: string[] = []
  const polygons: number[][][][] =
    boundary.type === 'MultiPolygon'
      ? (boundary.coordinates as number[][][][])
      : [boundary.coordinates as number[][][]]

  for (const polygon of polygons) {
    for (const ring of polygon) {
      if (ring.length === 0) continue
      let d = ''
      ring.forEach((coord, i) => {
        const { x, y } = project(coord[0], coord[1])
        d += `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`
      })
      d += 'Z'
      parts.push(d)
    }
  }
  return parts.join(' ')
}
