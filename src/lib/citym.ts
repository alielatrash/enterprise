// CITYm (City Match) utilities
// Format: "PICKUP_CITY->DROPOFF_CITY"

export function generateCitym(pickupCity: string, dropoffCity: string): string {
  return `${pickupCity.trim()}->${dropoffCity.trim()}`
}

export function parseCitym(citym: string): { pickup: string; dropoff: string } | null {
  const parts = citym.split('->')
  if (parts.length !== 2) return null
  return {
    pickup: parts[0].trim(),
    dropoff: parts[1].trim(),
  }
}

export function formatCitym(citym: string): string {
  const parsed = parseCitym(citym)
  if (!parsed) return citym
  return `${parsed.pickup} → ${parsed.dropoff}`
}
