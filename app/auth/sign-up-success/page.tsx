import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function SignUpSuccessPage() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">¡Gracias por registrarte!</CardTitle>
            <CardDescription>Verifica tu email para continuar</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Te hemos enviado un email de confirmación. Por favor, verifica tu cuenta antes de iniciar sesión.
            </p>
            <Button asChild className="w-full">
              <Link href="/auth/login">Ir a Iniciar Sesión</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
