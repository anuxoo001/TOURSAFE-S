import mongoose from 'mongoose';

export const haversineDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// point-in-polygon test (ray casting). Point is {lat, lng}, polygon = [[lng,lat],...]
export const pointInPolygon = (point, polygon) => {
  const { lat, lng } = point;
  let inside = false;
  const coords = polygon[0] && Array.isArray(polygon[0][0]) ? polygon[0] : polygon;
  for (let i = 0, j = coords.length - 1; i < coords.length; j = i++) {
    const xi = coords[i][0];
    const yi = coords[i][1];
    const xj = coords[j][0];
    const yj = coords[j][1];
    const intersect =
      yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
};

export const zoneContainsPoint = (zone, lat, lng) => {
  const geo = zone.geometry;
  if (!geo) return false;
  if (geo.type === 'Point') {
    const [zoneLng, zoneLat] = geo.coordinates;
    const radius = zone.radius || 500;
    return haversineDistance(lat, lng, zoneLat, zoneLng) <= radius;
  }
  if (geo.type === 'Polygon') {
    return pointInPolygon({ lat, lng }, geo.coordinates);
  }
  return false;
};

export const isGeoJsonPolygon = (obj) => {
  return (
    obj &&
    obj.type === 'Polygon' &&
    Array.isArray(obj.coordinates) &&
    Array.isArray(obj.coordinates[0]) &&
    Array.isArray(obj.coordinates[0][0])
  );
};

export const sanitizeCoord = (lat, lng) => {
  const la = Number(lat);
  const ln = Number(lng);
  if (isNaN(la) || isNaN(ln)) return null;
  if (la < -90 || la > 90 || ln < -180 || ln > 180) return null;
  return [ln, la];
};
