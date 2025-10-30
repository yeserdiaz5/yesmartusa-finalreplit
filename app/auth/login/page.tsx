import { login } from "./actions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"

export default function LoginPage() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Iniciar Sesión</CardTitle>
            <CardDescription>Ingresa tu email para acceder a tu cuenta</CardDescription>
          </CardHeader>
          <CardContent>
            <form>
              <div className="flex flex-col gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" placeholder="tu@email.com" required />
                </div>
                <div className="grid gap-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Contraseña</Label>
                    <Link href="/auth/reset-password" className="text-sm text-blue-600 hover:underline">
                      ¿Olvidaste tu contraseña?
                    </Link>
                  </div>
                  <Input id="password" name="password" type="password" required />
                </div>
                <Button formAction={login} className="w-full">
                  Iniciar Sesión
                </Button>
              </div>
              <div className="mt-4 text-center text-sm">
                ¿No tienes cuenta?{" "}
                <Link href="/auth/sign-up" className="underline underline-offset-4">
                  Regístrate
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
