/**
 * Creates a simple Supabase client for use in Server Actions
 * Uses direct fetch to avoid body.tee() errors
 */
export function createActionClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  return {
    from: (table: string) => ({
      select: (columns: string) => ({
        eq: (column: string, value: any) => ({
          single: async () => {
            try {
              const url = `${supabaseUrl}/rest/v1/${table}?${column}=eq.${value}&select=${columns}`
              const response = await fetch(url, {
                headers: {
                  apikey: supabaseKey,
                  Authorization: `Bearer ${supabaseKey}`,
                  "Content-Type": "application/json",
                  Prefer: "return=representation",
                },
              })

              if (!response.ok) {
                const error = await response.text()
                return { data: null, error: { message: error } }
              }

              const data = await response.json()
              return { data: data[0] || null, error: null }
            } catch (error: any) {
              return { data: null, error: { message: error.message } }
            }
          },
        }),
      }),
      insert: async (values: any) => {
        try {
          const url = `${supabaseUrl}/rest/v1/${table}`
          const response = await fetch(url, {
            method: "POST",
            headers: {
              apikey: supabaseKey,
              Authorization: `Bearer ${supabaseKey}`,
              "Content-Type": "application/json",
              Prefer: "return=representation",
            },
            body: JSON.stringify(values),
          })

          if (!response.ok) {
            const error = await response.text()
            return { data: null, error: { message: error } }
          }

          const data = await response.json()
          return { data, error: null }
        } catch (error: any) {
          return { data: null, error: { message: error.message } }
        }
      },
      update: (values: any) => ({
        eq: async (column: string, value: any) => {
          try {
            const url = `${supabaseUrl}/rest/v1/${table}?${column}=eq.${value}`
            const response = await fetch(url, {
              method: "PATCH",
              headers: {
                apikey: supabaseKey,
                Authorization: `Bearer ${supabaseKey}`,
                "Content-Type": "application/json",
                Prefer: "return=representation",
              },
              body: JSON.stringify(values),
            })

            if (!response.ok) {
              const error = await response.text()
              return { data: null, error: { message: error } }
            }

            const data = await response.json()
            return { data, error: null }
          } catch (error: any) {
            return { data: null, error: { message: error.message } }
          }
        },
      }),
    }),
  }
}
