"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { createTestUser } from "@/app/actions/auth"
import Link from "next/link"

export default function CreateTestUserPage() {
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  const testCredentials = {
    email: "test@yesmartusa.com",
    password: "TestUser123!",
    fullName: "Usuario de Prueba",
  }

  async function handleCreateTestUser() {
    setLoading(true)
    setMessage("")
    setError("")

    try {
      console.log("[v0] Creating test user with admin API...")
      const result = await createTestUser()

      console.log("[v0] Test user creation result:", result)

      if (result.success) {
        setMessage(
          "✅ Usuario de prueba creado exitosamente! " +
            "Ahora puedes iniciar sesión con las credenciales mostradas abajo. " +
            "El usuario tiene rol de administrador y NO requiere confirmación de email.",
        )
      } else {
        // Check if user already exists
        if (
          result.error?.includes("already") ||
          result.error?.includes("duplicate") ||
          result.error?.includes("User already registered")
        ) {
          setMessage(
            "✅ El usuario de prueba ya existe. " + "Puedes iniciar sesión con las credenciales mostradas abajo.",
          )
        } else {
          setError("❌ Error: " + (result.error || "Error desconocido"))
        }
      }
    } catch (err: any) {
      console.error("[v0] Error creating test user:", err)
      setError("❌ Error: " + err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    handleCreateTestUser()
  }, [])

  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Usuario de Prueba</CardTitle>
          <CardDescription>
            Usuario de prueba con privilegios de administrador para probar el flujo completo
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading && (
            <Alert>
              <AlertDescription>⏳ Creando usuario de prueba...</AlertDescription>
            </Alert>
          )}

          {message && (
            <Alert>
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="p-4 bg-muted rounded-lg">
            <h3 className="font-semibold mb-2">Credenciales del Usuario de Prueba:</h3>
            <div className="space-y-1 text-sm">
              <p>
                <strong>Email:</strong> {testCredentials.email}
              </p>
              <p>
                <strong>Contraseña:</strong> {testCredentials.password}
              </p>
              <p>
                <strong>Nombre:</strong> {testCredentials.fullName}
              </p>
              <p>
                <strong>Rol:</strong> Administrador
              </p>
            </div>
          </div>

          {!loading && (
            <div className="space-y-2">
              <Link href="/auth/login" className="block">
                <Button className="w-full">Ir a Iniciar Sesión</Button>
              </Link>
              <Button onClick={handleCreateTestUser} variant="outline" className="w-full bg-transparent">
                Recrear Usuario
              </Button>
            </div>
          )}

          <div className="text-xs text-muted-foreground text-center">
            El usuario se crea automáticamente al cargar esta página. No se requiere confirmación de email.
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
