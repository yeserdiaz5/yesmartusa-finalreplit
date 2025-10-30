import ShipEngine from "shipengine"

// Initialize ShipEngine client
// IMPORTANTE: En producción usa SHIPENGINE_PRODUCTION_API_KEY
// En desarrollo usa SHIPENGINE_API_KEY
const getShipEngineApiKey = () => {
  // Primero intenta usar la key de producción
  if (process.env.SHIPENGINE_PRODUCTION_API_KEY) {
    console.log("[ShipEngine] Using PRODUCTION API key")
    return process.env.SHIPENGINE_PRODUCTION_API_KEY
  }
  
  // Si no existe, usa la key de desarrollo
  if (process.env.SHIPENGINE_API_KEY) {
    console.log("[ShipEngine] Using DEVELOPMENT API key - Labels may not work in production!")
    return process.env.SHIPENGINE_API_KEY
  }
  
  return ""
}

export const shipengine = new ShipEngine({
  apiKey: getShipEngineApiKey(),
})

// Check if API key is configured
export function isShipEngineConfigured(): boolean {
  return !!(process.env.SHIPENGINE_PRODUCTION_API_KEY || process.env.SHIPENGINE_API_KEY)
}

// Check if using production API key
export function isUsingProductionKey(): boolean {
  return !!process.env.SHIPENGINE_PRODUCTION_API_KEY
}

// Get the API key being used
export function getApiKey(): string {
  return getShipEngineApiKey()
}
