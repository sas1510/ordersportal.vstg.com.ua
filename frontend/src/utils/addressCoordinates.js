export function coordinateNumber(value) {
  if (typeof value !== "number" && typeof value !== "string") return null;
  if (typeof value === "string" && !value.trim()) return null;
  const number = Number(typeof value === "string" ? value.trim().replace(",", ".") : value);
  return Number.isFinite(number) ? number : null;
}

export function extractAddressCoordinates(address) {
  if (!address) return null;
  let pair = null;
  if (typeof address.Coordinates === "string") {
    const text = address.Coordinates.trim();
    // Legacy pairs contain both decimal commas and the pair-separating comma.
    const legacy = text.match(/^([+-]?\d+),(\d+)\s*,\s*([+-]?\d+),(\d+)$/);
    pair = legacy ? [legacy[1] + "." + legacy[2], legacy[3] + "." + legacy[4]] : text.split(/\s*[,;]\s*/);
    if (pair.length !== 2) pair = null;
  }
  const lat = coordinateNumber(pair?.[0] ?? address.Latitude ?? address.lat);
  const lng = coordinateNumber(pair?.[1] ?? address.Longitude ?? address.lng);
  return lat !== null && lng !== null && lat !== 0 && lng !== 0 && Math.abs(lat) <= 90 && Math.abs(lng) <= 180 ? { lat, lng } : null;
}
