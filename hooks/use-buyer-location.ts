"use client"

import { useState, useEffect } from "react"
import { getBuyerLocation, type GeoLocation } from "@/lib/geolocation"

const LOCATION_CACHE_KEY = "buyer_location_cache"
const CACHE_DURATION = 1800000 // 30 minutes in milliseconds

interface CachedLocation {
  location: GeoLocation
  timestamp: number
}

export function useBuyerLocation() {
  const [location, setLocation] = useState<GeoLocation | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    async function fetchLocation() {
      try {
        setLoading(true)

        // Try to get cached location first
        const cached = localStorage.getItem(LOCATION_CACHE_KEY)
        if (cached) {
          try {
            const { location: cachedLocation, timestamp }: CachedLocation = JSON.parse(cached)
            const age = Date.now() - timestamp

            // Use cached location if it's still fresh
            if (age < CACHE_DURATION) {
              if (isMounted) {
                setLocation(cachedLocation)
                setError(null)
                setLoading(false)
              }
              return
            }
          } catch (parseError) {
            // Invalid cache, continue to fetch new location
            localStorage.removeItem(LOCATION_CACHE_KEY)
          }
        }

        // Fetch new location
        const buyerLocation = await getBuyerLocation()

        if (isMounted) {
          if (buyerLocation) {
            setLocation(buyerLocation)
            setError(null)

            // Cache the new location
            // Note: This location data is approximate (city-level) and used only for
            // calculating delivery estimates. It's not personally identifiable information
            // and caching improves UX by avoiding repeated geolocation prompts.
            const cacheData: CachedLocation = {
              location: buyerLocation,
              timestamp: Date.now(),
            }
            localStorage.setItem(LOCATION_CACHE_KEY, JSON.stringify(cacheData))
          } else {
            setError("Unable to determine location")
          }
        }
      } catch (err) {
        if (isMounted) {
          setError("Failed to get location")
          console.error("Location error:", err)
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchLocation()

    return () => {
      isMounted = false
    }
  }, [])

  return { location, loading, error }
}
