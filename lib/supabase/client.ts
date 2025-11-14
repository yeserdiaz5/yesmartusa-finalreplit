import { createBrowserClient } from "@supabase/ssr"

let client: ReturnType<typeof createBrowserClient> | null = null

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Your project's URL and Key are required to create a Supabase client!\n\nCheck your Supabase project's API settings to find these values\n\nhttps://supabase.com/dashboard/project/_/settings/api")
  }

  if (client) return client

  client = createBrowserClient(supabaseUrl, supabaseAnonKey)

  return client
}
