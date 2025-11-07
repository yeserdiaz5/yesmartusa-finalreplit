"use client"

import { Button } from "@/components/ui/button"
import { useState } from "react"

export default function ClearStripeAccountsPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{
    success: boolean
    message: string
    count?: number
  } | null>(null)

  const clearAccounts = async () => {
    if (!confirm("¿Estás seguro de que quieres limpiar todas las cuentas de Stripe? Esto eliminará las referencias a cuentas TEST que ya no existen.")) {
      return
    }

    setLoading(true)
    setResult(null)

    try {
      const response = await fetch("/api/debug/clear-stripe-accounts", {
        method: "POST",
      })

      const data = await response.json()
      setResult(data)
    } catch (error: any) {
      setResult({
        success: false,
        message: error.message || "Error al limpiar las cuentas",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Limpiar Cuentas de Stripe TEST</h1>
          <p className="text-muted-foreground">
            Esta herramienta elimina las referencias a cuentas de Stripe Connect creadas en modo TEST
          </p>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-yellow-800 mb-2">⚠️ Advertencia</h2>
          <div className="text-sm text-yellow-700 space-y-2">
            <p>Esta acción va a:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Eliminar todas las referencias a cuentas de Stripe Connect en la base de datos</li>
              <li>Marcar todos los usuarios como no verificados</li>
              <li>Permitir que se creen nuevas cuentas en modo LIVE</li>
            </ul>
            <p className="mt-3 font-semibold">
              Esto es necesario cuando cambias de claves TEST a claves LIVE porque son entornos separados.
            </p>
          </div>
        </div>

        <div className="bg-card border rounded-lg p-6 space-y-4">
          <h2 className="text-xl font-semibold">¿Cuándo usar esta herramienta?</h2>
          <div className="text-sm text-muted-foreground space-y-2">
            <p>Usa esta herramienta cuando:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Acabas de cambiar de claves TEST a claves LIVE</li>
              <li>Recibes el error: "account that is not connected to your platform"</li>
              <li>Las cuentas de Stripe Connect no funcionan después de cambiar a LIVE</li>
            </ul>
          </div>
        </div>

        <div className="bg-card border rounded-lg p-6 space-y-4">
          <h2 className="text-xl font-semibold">Acción</h2>
          <Button
            onClick={clearAccounts}
            disabled={loading}
            variant="destructive"
            size="lg"
            className="w-full"
            data-testid="button-clear-stripe-accounts"
          >
            {loading ? "Limpiando..." : "Limpiar Cuentas de Stripe TEST"}
          </Button>
        </div>

        {result && (
          <div className={`rounded-lg p-6 ${
            result.success 
              ? "bg-green-50 border border-green-200" 
              : "bg-red-50 border border-red-200"
          }`}>
            <h3 className={`font-semibold mb-2 ${
              result.success ? "text-green-800" : "text-red-800"
            }`}>
              {result.success ? "✅ Limpieza Exitosa" : "❌ Error"}
            </h3>
            <p className={`text-sm ${
              result.success ? "text-green-700" : "text-red-700"
            }`}>
              {result.message}
            </p>
            {result.count !== undefined && (
              <p className="text-sm text-green-700 mt-2">
                Cuentas limpiadas: {result.count}
              </p>
            )}
          </div>
        )}

        {result?.success && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="font-semibold text-blue-800 mb-2">Próximos Pasos</h3>
            <ol className="list-decimal list-inside space-y-2 text-sm text-blue-700">
              <li>Cierra sesión y vuelve a iniciar sesión</li>
              <li>Ve a la página de vendedor (/seller)</li>
              <li>Haz clic en "Verificar con Stripe para vender"</li>
              <li>Ahora se creará una nueva cuenta en modo LIVE</li>
            </ol>
          </div>
        )}
      </div>
    </div>
  )
}
