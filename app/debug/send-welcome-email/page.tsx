"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useState } from "react"

export default function SendWelcomeEmailPage() {
  const [email, setEmail] = useState("yeserdiaz5@gmail.com")
  const [name, setName] = useState("")
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<{
    success: boolean
    message: string
  } | null>(null)

  const sendEmail = async () => {
    if (!email) {
      setResult({
        success: false,
        message: "Por favor ingresa un email",
      })
      return
    }

    setSending(true)
    setResult(null)

    try {
      const response = await fetch("/api/debug/send-welcome-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          name: name || email,
        }),
      })

      const data = await response.json()
      setResult(data)
    } catch (error: any) {
      setResult({
        success: false,
        message: error.message || "Error al enviar el email",
      })
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Enviar Email de Bienvenida</h1>
          <p className="text-muted-foreground">
            Envía manualmente el email de bienvenida a vendedores verificados
          </p>
        </div>

        <Card className="border-blue-500">
          <CardHeader>
            <CardTitle>¿Por qué usar esta herramienta?</CardTitle>
            <CardDescription>
              Si un vendedor fue aprobado por Stripe pero no recibió el email de bienvenida automático
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
              <p className="text-sm text-blue-700">
                <strong>Nota:</strong> Esto puede pasar si el webhook de Stripe Connect no está configurado correctamente
                o si hubo un error al enviar el email automáticamente.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Información del Vendedor</CardTitle>
            <CardDescription>
              Ingresa el email del vendedor verificado
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email del Vendedor</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vendedor@ejemplo.com"
                data-testid="input-email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Nombre del Vendedor (Opcional)</Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nombre completo"
                data-testid="input-name"
              />
            </div>

            <Button
              onClick={sendEmail}
              disabled={sending}
              className="w-full"
              data-testid="button-send-email"
            >
              {sending ? "Enviando..." : "Enviar Email de Bienvenida"}
            </Button>
          </CardContent>
        </Card>

        {result && (
          <Card className={result.success ? "border-green-500" : "border-red-500"}>
            <CardHeader>
              <CardTitle className={result.success ? "text-green-700" : "text-red-700"}>
                {result.success ? "✅ Email Enviado" : "❌ Error"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className={`text-sm ${result.success ? "text-green-700" : "text-red-700"}`}>
                {result.message}
              </p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Configurar Webhook para el Futuro</CardTitle>
            <CardDescription>
              Para que los emails se envíen automáticamente
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Para evitar tener que enviar emails manualmente, configura el webhook de Stripe Connect:
            </p>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>Ve a: <a href="https://dashboard.stripe.com/webhooks" target="_blank" rel="noopener" className="text-blue-600 underline">Stripe Webhooks</a></li>
              <li>Asegúrate de estar en <strong>modo LIVE</strong></li>
              <li>Haz clic en "Add endpoint"</li>
              <li>Endpoint URL: <code className="bg-muted px-2 py-1 rounded">https://yesmartusa.com/api/stripe/webhook</code></li>
              <li>Selecciona estos eventos:
                <ul className="list-disc list-inside ml-4 mt-1">
                  <li>account.updated</li>
                  <li>account.application.deauthorized</li>
                  <li>capability.updated</li>
                </ul>
              </li>
              <li>Copia el <strong>Webhook Signing Secret</strong> y añádelo a tus variables de entorno como <code className="bg-muted px-2 py-1 rounded">STRIPE_WEBHOOK_SECRET</code></li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
