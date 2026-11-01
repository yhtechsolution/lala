// Display text for a distance in kilometres. Pure, so it is easy to test.
export function formatDistance(km: number) {
  if (!Number.isFinite(km) || km < 0) return '';
  if (km < 1)
    return `${Math.max(10, Math.round((km * 1000) / 10) * 10)} m away`;
  if (km < 10) return `${km.toFixed(1)} km away`;
  return `${Math.round(km).toLocaleString('en-US')} km away`;
}
