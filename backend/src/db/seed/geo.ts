export interface GeoFeature {
  name: string;
  psgcCode: string;
  areaSqKm: number;
  geometry: { type: string; coordinates: unknown };
}

export interface GeoImportResult {
  features: GeoFeature[];
  center: { lat: number; lng: number };
}

function ringCentroid(ring: number[][]): {
  cx: number;
  cy: number;
  area: number;
} {
  let area = 0;
  let cx = 0;
  let cy = 0;
  for (let i = 0; i < ring.length - 1; i++) {
    const x0 = ring[i][0];
    const y0 = ring[i][1];
    const x1 = ring[i + 1][0];
    const y1 = ring[i + 1][1];
    const cross = x0 * y1 - x1 * y0;
    area += cross;
    cx += (x0 + x1) * cross;
    cy += (y0 + y1) * cross;
  }
  area *= 0.5;
  if (area === 0) {
    return { cx: ring[0][0], cy: ring[0][1], area: 0 };
  }
  return { cx: cx / (6 * area), cy: cy / (6 * area), area: Math.abs(area) };
}

function polygonCentroid(polygon: number[][][]): {
  lng: number;
  lat: number;
  area: number;
} {
  const outer = polygon[0];
  const { cx, cy, area } = ringCentroid(outer);
  return { lng: cx, lat: cy, area };
}

function multiPolygonCentroid(multi: number[][][][]): {
  lng: number;
  lat: number;
  area: number;
} {
  let totalArea = 0;
  let weightedLng = 0;
  let weightedLat = 0;
  for (const polygon of multi) {
    const { lng, lat, area } = polygonCentroid(polygon);
    totalArea += area;
    weightedLng += lng * area;
    weightedLat += lat * area;
  }
  if (totalArea === 0) {
    const first = multi[0][0][0];
    return { lng: first[0], lat: first[1], area: 0 };
  }
  return {
    lng: weightedLng / totalArea,
    lat: weightedLat / totalArea,
    area: totalArea,
  };
}

export function geometryCentroid(geometry: {
  type: string;
  coordinates: unknown;
}): { lng: number; lat: number; area: number } {
  if (geometry.type === 'Polygon') {
    return polygonCentroid(geometry.coordinates as number[][][]);
  }
  if (geometry.type === 'MultiPolygon') {
    return multiPolygonCentroid(geometry.coordinates as number[][][][]);
  }
  return { lng: 0, lat: 0, area: 0 };
}

export function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}
