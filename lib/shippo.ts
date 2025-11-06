import Shippo from "shippo"

if (!process.env.SHIPPO_API_KEY) {
  console.error("[v0] SHIPPO_API_KEY is not set in environment variables")
}

// Initialize Shippo client
// You need to add SHIPPO_API_KEY to your environment variables
export const shippo = new Shippo({
  apiKeyHeader: process.env.SHIPPO_API_KEY || "",
})

// Shippo carrier codes
export const CARRIERS = {
  USPS: "usps",
  FEDEX: "fedex",
  UPS: "ups",
  DHL: "dhl_express",
} as const

// Shippo service levels
export const SERVICE_LEVELS = {
  USPS_PRIORITY: "usps_priority",
  USPS_FIRST: "usps_first",
  FEDEX_GROUND: "fedex_ground",
  FEDEX_2DAY: "fedex_2_day",
  UPS_GROUND: "ups_ground",
  UPS_NEXT_DAY_AIR: "ups_next_day_air",
} as const
