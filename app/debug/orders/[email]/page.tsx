import { createClient } from "@/lib/supabase/server"
import { getOrdersByUserEmail } from "@/app/actions/orders"
import OrdersPageClient from "@/app/orders/orders-page-client"

export default async function DebugOrdersPage({ params }: { params: { email: string } }) {
  const supabase = await createClient()

  // Get current user for the header
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: userProfile } = user
    ? await supabase.from("users").select("*").eq("id", user.id).maybeSingle()
    : { data: null }

  // Decode the email from the URL
  const email = decodeURIComponent(params.email)

  console.log("[v0] Debug page - Fetching orders for:", email)

  // Fetch orders for the specified email
  const ordersResult = await getOrdersByUserEmail(email)

  console.log("[v0] Debug page - Orders result:", {
    success: ordersResult.success,
    hasData: !!ordersResult.data,
    dataLength: ordersResult.data?.length,
    error: ordersResult.error,
  })

  // Ensure orders is always an array, never undefined
  const orders = Array.isArray(ordersResult.data) ? ordersResult.data : []

  console.log("[v0] Debug page - Final orders array length:", orders.length)

  return (
    <div>
      <div className="bg-purple-100 border-l-4 border-purple-500 text-purple-700 p-4 mb-4">
        <p className="font-bold">Modo Debug: Viendo pedidos de {email}</p>
        <p className="text-sm">Esta es una página de prueba para ver pedidos de un usuario específico.</p>
        <p className="text-sm mt-2">Total de pedidos encontrados: {orders.length}</p>
        {ordersResult.error && <p className="text-sm mt-2 text-red-600">Error: {ordersResult.error}</p>}
      </div>
      <OrdersPageClient user={userProfile} orders={orders} />
    </div>
  )
}
