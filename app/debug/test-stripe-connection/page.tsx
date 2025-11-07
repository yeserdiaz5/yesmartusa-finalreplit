import { stripe } from "@/lib/stripe"

export const dynamic = "force-dynamic"

export default async function TestStripeConnectionPage() {
  let connectionStatus = {
    isLive: false,
    isConnected: false,
    error: null as string | null,
    accountInfo: null as any,
  }

  try {
    // Intentar obtener información de la cuenta de Stripe
    const balance = await stripe.balance.retrieve()
    
    // Verificar si estamos en modo live
    const keyPrefix = process.env.STRIPE_SECRET_KEY?.substring(0, 8) || ""
    const isLive = keyPrefix.startsWith("sk_live_")
    
    connectionStatus = {
      isLive,
      isConnected: true,
      error: null,
      accountInfo: {
        currency: balance.available[0]?.currency || "usd",
        hasBalance: balance.available.length > 0,
        mode: isLive ? "LIVE" : "TEST",
      },
    }
  } catch (error: any) {
    connectionStatus = {
      isLive: false,
      isConnected: false,
      error: error.message,
      accountInfo: null,
    }
  }

  const keyPrefix = process.env.STRIPE_SECRET_KEY?.substring(0, 10) || ""
  const publicKeyPrefix = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.substring(0, 10) || ""

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Prueba de Conexión a Stripe</h1>
          <p className="text-muted-foreground">
            Esta página verifica que tus claves de Stripe estén funcionando correctamente
          </p>
        </div>

        {/* Estado de Conexión */}
        <div className="bg-card border rounded-lg p-6 space-y-4">
          <h2 className="text-xl font-semibold mb-4">Estado de Conexión</h2>
          
          <div className={`p-4 rounded-lg ${
            connectionStatus.isConnected 
              ? "bg-green-50 border border-green-200" 
              : "bg-red-50 border border-red-200"
          }`}>
            <p className={`text-lg font-bold ${
              connectionStatus.isConnected ? "text-green-700" : "text-red-700"
            }`}>
              {connectionStatus.isConnected ? "✅ CONECTADO A STRIPE" : "❌ ERROR DE CONEXIÓN"}
            </p>
            {connectionStatus.error && (
              <p className="text-red-600 text-sm mt-2">
                Error: {connectionStatus.error}
              </p>
            )}
          </div>

          {connectionStatus.isConnected && (
            <div className={`p-4 rounded-lg ${
              connectionStatus.isLive 
                ? "bg-green-50 border border-green-200" 
                : "bg-yellow-50 border border-yellow-200"
            }`}>
              <p className={`text-lg font-bold ${
                connectionStatus.isLive ? "text-green-700" : "text-yellow-700"
              }`}>
                {connectionStatus.isLive ? "✅ MODO PRODUCCIÓN (LIVE)" : "⚠️ MODO PRUEBA (TEST)"}
              </p>
            </div>
          )}
        </div>

        {/* Información de las Claves */}
        <div className="bg-card border rounded-lg p-6 space-y-4">
          <h2 className="text-xl font-semibold mb-4">Claves Configuradas</h2>
          
          <div className="space-y-3">
            <div className="border-t pt-4">
              <h3 className="font-semibold mb-2">STRIPE_SECRET_KEY</h3>
              <div className="bg-muted p-3 rounded font-mono text-sm">
                <div className="flex items-center justify-between">
                  <span>{keyPrefix}*********************</span>
                  <span className={`px-2 py-1 rounded text-xs font-bold ${
                    keyPrefix.startsWith("sk_live_") 
                      ? "bg-green-100 text-green-700" 
                      : "bg-yellow-100 text-yellow-700"
                  }`}>
                    {keyPrefix.startsWith("sk_live_") ? "LIVE" : "TEST"}
                  </span>
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="font-semibold mb-2">NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY</h3>
              <div className="bg-muted p-3 rounded font-mono text-sm">
                <div className="flex items-center justify-between">
                  <span>{publicKeyPrefix}*********************</span>
                  <span className={`px-2 py-1 rounded text-xs font-bold ${
                    publicKeyPrefix.startsWith("pk_live_") 
                      ? "bg-green-100 text-green-700" 
                      : "bg-yellow-100 text-yellow-700"
                  }`}>
                    {publicKeyPrefix.startsWith("pk_live_") ? "LIVE" : "TEST"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Información de la Cuenta */}
        {connectionStatus.accountInfo && (
          <div className="bg-card border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Información de la Cuenta</h2>
            <div className="space-y-2 text-sm">
              <p><strong>Modo:</strong> {connectionStatus.accountInfo.mode}</p>
              <p><strong>Moneda:</strong> {connectionStatus.accountInfo.currency.toUpperCase()}</p>
              <p><strong>Estado:</strong> Activa y funcionando</p>
            </div>
          </div>
        )}

        {/* Próximos Pasos */}
        <div className="bg-card border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Próximos Pasos</h2>
          {connectionStatus.isConnected && connectionStatus.isLive ? (
            <div className="space-y-2 text-sm text-green-700">
              <p>✅ Tus claves LIVE están funcionando correctamente</p>
              <p>✅ Tu aplicación está lista para recibir pagos reales</p>
              <p>✅ Puedes comenzar a usar Stripe Connect en producción</p>
            </div>
          ) : connectionStatus.isConnected && !connectionStatus.isLive ? (
            <div className="space-y-2 text-sm text-yellow-700">
              <p>⚠️ Estás usando claves de PRUEBA</p>
              <p>⚠️ Para producción, actualiza a claves LIVE desde Stripe Dashboard</p>
            </div>
          ) : (
            <div className="space-y-2 text-sm text-red-700">
              <p>❌ Las claves de Stripe no están funcionando</p>
              <p>❌ Verifica que hayas copiado las claves completas y sin espacios</p>
              <p>❌ Ve a https://dashboard.stripe.com/apikeys y vuelve a copiarlas</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
