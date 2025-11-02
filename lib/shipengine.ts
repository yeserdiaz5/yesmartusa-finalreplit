import ShipEngine from "shipengine"

// Initialize ShipEngine client
export const shipengine = new ShipEngine({
  apiKey: process.env.SHIPENGINE_API_KEY as string,
})

// Check if API key is configured
export function isShipEngineConfigured(): boolean {
  return !!process.env.SHIPENGINE_API_KEY
}
