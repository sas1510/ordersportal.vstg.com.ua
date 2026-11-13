export function visicomSuggestion(feature) {
  const p = feature.properties || {};
  const coords = feature.geo_centroid?.coordinates || (feature.geometry?.type === 'Point' ? feature.geometry.coordinates : null);
  if (!Array.isArray(coords) || coords.length !== 2 || !coords.every(Number.isFinite) || Math.abs(coords[0]) > 180 || Math.abs(coords[1]) > 90) return null;
  const category = String(p.categories || '');
  const city = p.settlement || (category === 'adm_settlement' ? p.name : '');
  const street = p.street || (category === 'adr_street' ? p.name : '');
  const house = category === 'adr_address' ? p.name || '' : '';
  return { category, place_id: feature.id, lat: coords[1], lon: coords[0], display_name: p.address || [city, p.street_type, street, house].filter(Boolean).join(', '), fields: {city,street,house} };
}

// Select only one full building match; a street/settlement or a fuzzy house stays a suggestion.
export function exactVisicomAddress(results, query) {
  const normalize = value => String(value || '').normalize('NFKC').toLocaleLowerCase('uk').replace(/[^\p{L}\p{N}]/gu, '');
  const text = normalize(query);
  const houseAtEnd = String(query || "").trim().match(/(?:^|[\s,;])(\d[\d\p{L}\/-]*(?:\s+\p{L})?)\s*[.,;]?$/u)?.[1];
  const matches = results.filter(result => {
    const {city, street, house} = result.fields || {};
    return result.category === 'adr_address' && city && street && house &&
      text.includes(normalize(city)) && text.includes(normalize(street)) && normalize(houseAtEnd) === normalize(house);
  });
  return matches.length === 1 ? matches[0] : null;
}

