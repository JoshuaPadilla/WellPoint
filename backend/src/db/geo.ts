export type GeoJSONFeature = {
  type: 'Feature';
  properties: Record<string, unknown>;
  geometry: {
    type: string;
    coordinates: unknown;
  };
};

export type GeoJSONFile = {
  type: 'FeatureCollection';
  features: GeoJSONFeature[];
};

export function ringCentroid(
  ring: number[][],
): { lat: number; lng: number; area: number } {
  let area = 0;
  let cx = 0;
  let cy = 0;
  for (let i = 0; i < ring.length - 1; i++) {
    const [lng1, lat1] = ring[i];
    const [lng2, lat2] = ring[i + 1];
    const f = lng1 * lat2 - lng2 * lat1;
    area += f;
    cx += (lng1 + lng2) * f;
    cy += (lat1 + lat2) * f;
  }
  area /= 2;
  const a = Math.abs(area);
  if (a < 1e-12) {
    const mid = Math.floor(ring.length / 2);
    return { lng: ring[mid][0], lat: ring[mid][1], area: 0 };
  }
  return { lng: cx / (6 * area), lat: cy / (6 * area), area: a };
}

export function geometryCentroid(geometry: {
  type: string;
  coordinates: unknown;
}): { lat: number; lng: number } {
  const coords = geometry.coordinates as number[][][][];
  const rings: number[][][] =
    geometry.type === 'MultiPolygon'
      ? coords.map((poly) => poly[0])
      : [coords[0]];

  let totalArea = 0;
  let latSum = 0;
  let lngSum = 0;
  for (const ring of rings) {
    const { lat, lng, area } = ringCentroid(ring);
    totalArea += area;
    latSum += lat * area;
    lngSum += lng * area;
  }
  if (totalArea < 1e-12) {
    const first = rings[0] ?? [[0, 0]];
    const mid = Math.floor(first.length / 2);
    return { lng: first[mid][0], lat: first[mid][1] };
  }
  return { lng: lngSum / totalArea, lat: latSum / totalArea };
}

export function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}
