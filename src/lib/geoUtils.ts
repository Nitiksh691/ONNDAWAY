/**
 * Pure client-safe geo utilities — NO server imports, NO mongoose.
 * Safe to import in any Client Component.
 */

/**
 * Calculates Haversine distance in kilometers between two lat/lng coordinates.
 */
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const R = 6371; // Earth radius in km

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(2));
}

/**
 * Checks whether the current time falls within store opening and closing hours.
 */
export function isStoreOpen(openingTime: string, closingTime: string): boolean {
  if (!openingTime || !closingTime) return true;
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const [openH, openM] = openingTime.split(":").map(Number);
  const [closeH, closeM] = closingTime.split(":").map(Number);

  const openMinutes = openH * 60 + (openM || 0);
  const closeMinutes = closeH * 60 + (closeM || 0);

  // Normal daytime hours (e.g., 08:00 to 23:00)
  if (closeMinutes > openMinutes) {
    return currentMinutes >= openMinutes && currentMinutes <= closeMinutes;
  }
  // Overnight hours (e.g., 18:00 to 04:00)
  return currentMinutes >= openMinutes || currentMinutes <= closeMinutes;
}
