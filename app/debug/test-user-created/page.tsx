import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { CheckCircle2, XCircle } from "lucide-react"

export default function TestUserCreatedPage({
  searchParams,
}: {
  searchParams: { success?: string }
}) {
  const success = searchParams.success === "true"

  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {success ? (
              <>
                <CheckCircle2 className="h-6 w-6 text-green-600" />
                Usuario Creado
              </>
            ) : (
              <>
                <XCircle className="h-6 w-6 text-red-600" />
                Error
              </>
            )}
          </CardTitle>
          <CardDescription>
            {success
              ? "El usuario de prueba ha sido creado exitosamente"
              : "Hubo un error al crear el usuario de prueba"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {success && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h3 className="font-semibold mb-2 text-green-900">Credenciales de Acceso:</h3>
              <div className="space-y-1 text-sm text-green-800">
                <p>
                  <strong>Email:</strong> test@yesmartusa.com
                </p>
                <p>
                  <strong>Contraseña:</strong> TestUser123!
                </p>
                <p>
                  <strong>Nombre:</strong> Usuario de Prueba
                </p>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Button asChild className="w-full">
              <Link href="/auth/login">Iniciar Sesión</Link>
            </Button>
            <Button asChild variant="outline" className="w-full bg-transparent">
              <Link href="/">Ir al Inicio</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
