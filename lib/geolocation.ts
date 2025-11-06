/**
 * Calculate the distance between two geographic coordinates using the Haversine formula
 * @param lat1 Latitude of first point
 * @param lon1 Longitude of first point
 * @param lat2 Latitude of second point
 * @param lon2 Longitude of second point
 * @returns Distance in kilometers
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371 // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1)
  const dLon = toRadians(lon2 - lon1)

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const distance = R * c

  return distance
}

/**
 * Convert degrees to radians
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180)
}

/**
 * Get estimated delivery time message based on distance
 * @param distanceKm Distance in kilometers
 * @returns Delivery time message in Spanish
 */
export function getDeliveryTimeMessage(distanceKm: number): string {
  if (distanceKm < 80) {
    // Less than 80km (50mi)
    return "Envío en 1 día."
  } else if (distanceKm >= 80 && distanceKm <= 350) {
    // Between 80km and 350km (50-220mi)
    return "Envío en menos de 24 horas."
  } else {
    // More than 350km (>220mi)
    return "Envío en 1–2 días."
  }
}

/**
 * Geocode a city and state to latitude/longitude coordinates
 * Uses OpenStreetMap Nominatim with proper caching and rate limiting
 * 
 * @param city City name
 * @param state State code (e.g., "FL", "CA")
 * @returns Coordinates or null if not found
 */
export async function geocodeAddress(
  city: string,
  state: string
): Promise<{ lat: number; lng: number } | null> {
  // Check cache first to avoid hitting rate limits
  const cacheKey = `geocode_${city}_${state}`
  const cached = typeof window !== "undefined" ? sessionStorage.getItem(cacheKey) : null
  
  if (cached) {
    try {
      return JSON.parse(cached)
    } catch {
      // Invalid cache, continue to fetch
    }
  }

  try {
    // Add delay to respect rate limits (max 1 request per second for Nominatim)
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?city=${encodeURIComponent(
        city
      )}&state=${encodeURIComponent(state)}&country=USA&format=json&limit=1`,
      {
        headers: {
          "User-Agent": "YesmartUSA-App/1.0 (marketplace)",
        },
      }
    )

    if (!response.ok) {
      // Handle rate limiting specifically
      if (response.status === 429) {
        console.warn("Geocoding rate limit reached. Using fallback.")
      } else {
        console.error("Geocoding API request failed:", response.statusText)
      }
      return null
    }

    const data = await response.json()

    if (data && data.length > 0) {
      const coords = {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
      }
      
      // Cache successful result
      if (typeof window !== "undefined") {
        sessionStorage.setItem(cacheKey, JSON.stringify(coords))
      }
      
      return coords
    }

    return null
  } catch (error) {
    console.error("Error geocoding address:", error)
    return null
  }
}

export interface GeoLocation {
  latitude: number
  longitude: number
  accuracy?: number
}

/**
 * Get buyer's current location using browser geolocation API
 * @returns Promise with location coordinates or null if unavailable
 */
export async function getBuyerLocation(): Promise<GeoLocation | null> {
  // Check if geolocation is supported
  if (!("geolocation" in navigator)) {
    console.warn("Geolocation is not supported by this browser")
    return null
  }

  try {
    // Try to get GPS location
    const position = await new Promise<GeolocationPosition>(
      (resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 300000, // Cache location for 5 minutes
        })
      }
    )

    return {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
    }
  } catch (error) {
    console.warn("GPS geolocation failed, trying IP-based location:", error)
    // Fall back to IP-based geolocation
    return getIPBasedLocation()
  }
}

/**
 * Get approximate location based on IP address
 * Uses a free IP geolocation service
 * @returns Promise with location coordinates or null if unavailable
 */
async function getIPBasedLocation(): Promise<GeoLocation | null> {
  try {
    // Using ipapi.co free tier (no API key required for basic usage)
    const response = await fetch("https://ipapi.co/json/")

    if (!response.ok) {
      console.error("IP geolocation request failed:", response.statusText)
      return null
    }

    const data = await response.json()

    if (data.latitude && data.longitude) {
      return {
        latitude: data.latitude,
        longitude: data.longitude,
      }
    }

    return null
  } catch (error) {
    console.error("Error getting IP-based location:", error)
    return null
  }
}
