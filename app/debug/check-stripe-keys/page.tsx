export const dynamic = "force-dynamic"

export default function CheckStripeKeysPage() {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY || ""
  const stripePublicKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ""
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || ""

  // Extract prefixes (first 10 characters) to identify if live or test
  const secretPrefix = stripeSecretKey.substring(0, 10)
  const publicPrefix = stripePublicKey.substring(0, 10)
  const webhookPrefix = webhookSecret.substring(0, 10)

  // Determine mode
  const isLiveSecret = secretPrefix.startsWith("sk_live_")
  const isLivePublic = publicPrefix.startsWith("pk_live_")
  const isLiveMode = isLiveSecret && isLivePublic

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Verificación de Claves de Stripe</h1>
          <p className="text-muted-foreground">
            Esta página muestra solo los prefijos de tus claves de Stripe (sin mostrar las claves completas)
          </p>
        </div>

        <div className="bg-card border rounded-lg p-6 space-y-4">
          <div>
            <h2 className="text-xl font-semibold mb-4">Estado General</h2>
            <div className={`p-4 rounded-lg ${isLiveMode ? "bg-green-50 border border-green-200" : "bg-yellow-50 border border-yellow-200"}`}>
              <p className={`text-lg font-bold ${isLiveMode ? "text-green-700" : "text-yellow-700"}`}>
                {isLiveMode ? "✅ MODO PRODUCCIÓN (LIVE)" : "⚠️ MODO PRUEBA (TEST)"}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="border-t pt-4">
              <h3 className="font-semibold mb-2">STRIPE_SECRET_KEY</h3>
              <div className="bg-muted p-3 rounded font-mono text-sm">
                <div className="flex items-center justify-between">
                  <span>{secretPrefix}*********************</span>
                  <span className={`px-2 py-1 rounded text-xs font-bold ${isLiveSecret ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                    {isLiveSecret ? "LIVE" : "TEST"}
                  </span>
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="font-semibold mb-2">NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY</h3>
              <div className="bg-muted p-3 rounded font-mono text-sm">
                <div className="flex items-center justify-between">
                  <span>{publicPrefix}*********************</span>
                  <span className={`px-2 py-1 rounded text-xs font-bold ${isLivePublic ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                    {isLivePublic ? "LIVE" : "TEST"}
                  </span>
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="font-semibold mb-2">STRIPE_WEBHOOK_SECRET</h3>
              <div className="bg-muted p-3 rounded font-mono text-sm">
                <span>{webhookPrefix}*********************</span>
              </div>
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="font-semibold mb-2">Información Importante</h3>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>• Las claves <strong>sk_live_</strong> y <strong>pk_live_</strong> son para PRODUCCIÓN</p>
              <p>• Las claves <strong>sk_test_</strong> y <strong>pk_test_</strong> son para PRUEBAS</p>
              <p>• Para producción en yesmartusa.com debes usar claves LIVE</p>
              <p>• El webhook secret debe coincidir con el modo (live o test)</p>
            </div>
          </div>

          {!isLiveMode && (
            <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg">
              <p className="text-orange-800 font-semibold">⚠️ Advertencia</p>
              <p className="text-orange-700 text-sm mt-1">
                Estás usando claves de PRUEBA. Para producción en https://yesmartusa.com debes actualizar a claves LIVE desde tu Stripe Dashboard.
              </p>
            </div>
          )}

          {isLiveMode && (
            <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
              <p className="text-green-800 font-semibold">✅ Perfecto</p>
              <p className="text-green-700 text-sm mt-1">
                Estás usando claves de PRODUCCIÓN. Tu aplicación está lista para recibir pagos reales en https://yesmartusa.com
              </p>
            </div>
          )}
        </div>

        <div className="bg-card border rounded-lg p-6">
          <h3 className="font-semibold mb-3">Cómo obtener claves LIVE</h3>
          <ol className="space-y-2 text-sm text-muted-foreground list-decimal list-inside">
            <li>Ve a: <a href="https://dashboard.stripe.com/apikeys" target="_blank" rel="noopener noreferrer" className="text-primary underline">https://dashboard.stripe.com/apikeys</a></li>
            <li>Activa el modo LIVE (toggle en la parte superior derecha)</li>
            <li>Copia la "Publishable key" que empieza con <code className="bg-muted px-1">pk_live_</code></li>
            <li>Copia la "Secret key" que empieza con <code className="bg-muted px-1">sk_live_</code></li>
            <li>Actualiza estos valores en tus Replit Secrets</li>
            <li>También actualiza STRIPE_WEBHOOK_SECRET con el signing secret del webhook en modo LIVE</li>
          </ol>
        </div>
      </div>
    </div>
  )
}
