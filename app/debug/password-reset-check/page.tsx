"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { CheckCircle2, XCircle, AlertCircle, Copy, Check } from "lucide-react"
import { useState, useEffect } from "react"

export default function PasswordResetCheckPage() {
  const [copied, setCopied] = useState(false)
  const [envVars, setEnvVars] = useState({
    appUrl: "",
    nextPublicAppUrl: "",
    currentOrigin: ""
  })

  useEffect(() => {
    setEnvVars({
      appUrl: "Check server logs",
      nextPublicAppUrl: process.env.NEXT_PUBLIC_APP_URL || "NOT SET",
      currentOrigin: window.location.origin
    })
  }, [])

  const expectedUrl = "https://1c35f3c7-3225-40e0-808a-a1917f7beffb-00-3vvdy5qmtaazz.janeway.replit.dev"
  const isCorrect = envVars.nextPublicAppUrl === expectedUrl || envVars.currentOrigin === expectedUrl

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Password Reset Diagnostic</h1>
        <p className="text-muted-foreground">
          Verifica la configuración para el reset de contraseña
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Estado de Configuración</CardTitle>
          <CardDescription>Variables de entorno y configuración actual</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="font-medium">NEXT_PUBLIC_APP_URL:</span>
              {envVars.nextPublicAppUrl === expectedUrl ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
            </div>
            <code className="block bg-muted p-2 rounded text-sm">
              {envVars.nextPublicAppUrl}
            </code>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="font-medium">Current Origin:</span>
              {envVars.currentOrigin === expectedUrl ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
            </div>
            <code className="block bg-muted p-2 rounded text-sm">
              {envVars.currentOrigin}
            </code>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="font-medium">Expected URL:</span>
            </div>
            <code className="block bg-muted p-2 rounded text-sm">
              {expectedUrl}
            </code>
          </div>
        </CardContent>
      </Card>

      {!isCorrect && (
        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Problema Detectado</AlertTitle>
          <AlertDescription>
            Las variables de entorno no coinciden con la URL esperada. Esto causará que los enlaces de reset de contraseña apunten a localhost.
          </AlertDescription>
        </Alert>
      )}

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Configuración de Supabase Dashboard</CardTitle>
          <CardDescription>URL que debes configurar en Supabase</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Importante</AlertTitle>
            <AlertDescription>
              Debes agregar esta URL en Supabase Dashboard → Authentication → URL Configuration → Redirect URLs
            </AlertDescription>
          </Alert>

          <div>
            <p className="text-sm text-muted-foreground mb-2">
              Copia esta URL y agrégala a las Redirect URLs en Supabase:
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-muted p-3 rounded text-sm">
                {expectedUrl}/auth/update-password
              </code>
              <Button
                variant="outline"
                size="icon"
                onClick={() => copyToClipboard(`${expectedUrl}/auth/update-password`)}
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pasos para Solucionar</CardTitle>
          <CardDescription>Sigue estos pasos en orden</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                1
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-2">Abre Supabase Dashboard</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  Ve a Authentication → URL Configuration
                </p>
                <Button variant="outline" size="sm" asChild>
                  <a 
                    href="https://supabase.com/dashboard/project/_/auth/url-configuration" 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    Abrir Supabase Dashboard
                  </a>
                </Button>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                2
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-2">Agrega la Redirect URL</h3>
                <p className="text-sm text-muted-foreground">
                  En la sección "Redirect URLs", agrega la URL que copiaste arriba:
                </p>
                <code className="block bg-muted p-2 rounded text-sm mt-2">
                  {expectedUrl}/auth/update-password
                </code>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                3
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-2">Guarda los cambios</h3>
                <p className="text-sm text-muted-foreground">
                  Haz clic en "Save" en Supabase Dashboard
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                4
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-2">Prueba el reset de contraseña</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  Ve a la página de reset y solicita un nuevo enlace
                </p>
                <Button variant="outline" size="sm" asChild>
                  <a href="/auth/reset-password">
                    Ir a Reset Password
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
