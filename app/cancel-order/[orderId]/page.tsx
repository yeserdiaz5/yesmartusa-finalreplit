import CancelOrderPageClient from "./cancel-order-client"

export default function CancelOrderPage({ params }: { params: { orderId: string } }) {
  return <CancelOrderPageClient orderId={params.orderId} />
}
