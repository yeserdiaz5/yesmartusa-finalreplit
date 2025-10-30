"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

export default function ResetAuthPage() {
  const router = useRouter()

  useEffect(() => {
    async function resetAuth() {
      const supabase = createClient()

      // Sign out
      await supabase.auth.signOut()

      // Clear all cookies
      document.cookie.split(";").forEach((c) => {
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/")
      })

      // Clear local storage
      localStorage.clear()
      sessionStorage.clear()

      // Redirect to login
      setTimeout(() => {
        window.location.href = "/auth/login"
      }, 1000)
    }

    resetAuth()
  }, [router])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Limpiando sesión...</h1>
        <p>Serás redirigido al login en un momento.</p>
      </div>
    </div>
  )
}
