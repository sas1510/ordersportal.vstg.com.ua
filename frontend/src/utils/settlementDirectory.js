const normalizeRegion = value => String(value || '').trim().toLocaleLowerCase('uk-UA').replace(/\s+область$/u, '').replace('рівненьська', 'рівненська');
export function regionForAddress(regions, name) {
  return regions.find(region => normalizeRegion(region.name) === normalizeRegion(name) || normalizeRegion(region.sourceName) === normalizeRegion(name));
}
export function settlementsForRegion(directory, regionName) {
  const region = regionForAddress(directory.regions || [], regionName);
  if (!region) return [];
  return (directory.settlements || []).filter(item => item.regionId === region.id).map(item => ({ ...item, value: item.district ? `${item.name} — ${item.district}` : item.name }));
}
