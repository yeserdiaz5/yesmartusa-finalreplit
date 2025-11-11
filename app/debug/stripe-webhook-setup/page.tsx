"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Copy, Check, ExternalLink, AlertCircle, CheckCircle2 } from "lucide-react"
import { useState } from "react"

export default function StripeWebhookSetupPage() {
  const [copied, setCopied] = useState(false)
  const webhookUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/api/stripe-webhook`
    : "https://your-domain.com/api/stripe-webhook"

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(webhookUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Configuración de Webhook de Stripe</h1>
        <p className="text-muted-foreground">
          Sigue estos pasos para configurar los webhooks de Stripe y habilitar los emails automáticos de bienvenida
        </p>
      </div>

      <Alert className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Importante</AlertTitle>
        <AlertDescription>
          Sin configurar el webhook, los usuarios verificados NO recibirán el email de bienvenida automáticamente.
        </AlertDescription>
      </Alert>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>URL del Webhook</CardTitle>
          <CardDescription>Copia esta URL para configurarla en Stripe</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <code className="flex-1 bg-muted p-3 rounded-md text-sm overflow-x-auto">
              {webhookUrl}
            </code>
            <Button
              variant="outline"
              size="icon"
              onClick={copyToClipboard}
              data-testid="button-copy-webhook-url"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Pasos para Configurar</CardTitle>
          <CardDescription>Configuración en Stripe Dashboard</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                1
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-2">Abre tu Stripe Dashboard</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Ve a tu cuenta de Stripe y navega a la sección de Developers
                </p>
                <Button variant="outline" size="sm" asChild data-testid="button-stripe-dashboard">
                  <a href="https://dashboard.stripe.com/webhooks" target="_blank" rel="noopener noreferrer">
                    Abrir Stripe Dashboard
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </a>
                </Button>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                2
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-2">Agrega un nuevo endpoint</h3>
                <p className="text-sm text-muted-foreground">
                  En la sección de Webhooks, haz clic en "Add endpoint" o "Agregar endpoint"
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                3
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-2">Pega la URL del webhook</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  En el campo "Endpoint URL", pega la siguiente URL:
                </p>
                <code className="block bg-muted p-2 rounded text-sm">
                  {webhookUrl}
                </code>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                4
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-2">Selecciona el evento</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  En "Select events to listen to", busca y selecciona:
                </p>
                <div className="bg-muted p-3 rounded-md">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <code className="text-sm font-mono">account.updated</code>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                5
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-2">Guarda el endpoint</h3>
                <p className="text-sm text-muted-foreground">
                  Haz clic en "Add endpoint" para guardar la configuración
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                6
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-2">Verifica el Signing Secret</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  Después de crear el webhook, Stripe te mostrará el "Signing secret". 
                  Asegúrate de que este valor coincida con tu variable de entorno <code className="bg-muted px-1">STRIPE_WEBHOOK_SECRET</code>
                </p>
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    Si el signing secret no coincide, copia el nuevo valor y actualiza tu variable de entorno
                  </AlertDescription>
                </Alert>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>¿Qué sucede después?</CardTitle>
          <CardDescription>Flujo automático de emails</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-medium">Cuando un usuario completa el onboarding de Stripe</p>
                <p className="text-sm text-muted-foreground">
                  Stripe envía un evento <code className="bg-muted px-1">account.updated</code> a tu webhook
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-medium">Tu aplicación recibe la notificación</p>
                <p className="text-sm text-muted-foreground">
                  El webhook verifica que la cuenta esté habilitada para cobros (<code className="bg-muted px-1">charges_enabled</code>)
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-medium">Se actualiza el usuario en la base de datos</p>
                <p className="text-sm text-muted-foreground">
                  Se marca como verificado y se registra la fecha de verificación
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-medium">Se envía automáticamente el email de bienvenida</p>
                <p className="text-sm text-muted-foreground">
                  El usuario recibe un email confirmando que su cuenta está lista para vender
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
