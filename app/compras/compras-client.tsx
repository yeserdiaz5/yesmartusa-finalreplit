"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import SiteHeader from "@/components/site-header"
import type { User, CompraWithItems, OrderItem, Product } from "@/lib/types/database"
import { Package, Calendar, DollarSign, Truck, ExternalLink } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { CancelOrderDialog } from "@/components/cancel-order-dialog"
import { useLanguage } from "@/lib/i18n/LanguageContext"

interface ComprasClientProps {
  user: User | null
  compras: CompraWithItems[]
}

export default function ComprasClient({ user, compras = [] }: ComprasClientProps) {
  const { t, language } = useLanguage()
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "paid":
        return "bg-green-100 text-green-800"
      case "shipped":
        return "bg-blue-100 text-blue-800"
      case "delivered":
        return "bg-green-100 text-green-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending":
        return t("statusPending")
      case "paid":
        return t("statusPaid")
      case "shipped":
        return t("statusShipped")
      case "delivered":
        return t("statusDelivered")
      case "cancelled":
        return t("statusCancelled")
      default:
        return status
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(language === "es" ? "es-ES" : "en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const getTrackingUrl = (trackingNumber: string, carrier: string) => {
    const carrierLower = carrier.toLowerCase()
    
    if (carrierLower.includes('usps')) {
      return `https://tools.usps.com/go/TrackConfirmAction?tLabels=${trackingNumber}`
    } else if (carrierLower.includes('ups')) {
      return `https://www.ups.com/track?loc=en_US&tracknum=${trackingNumber}`
    } else if (carrierLower.includes('fedex')) {
      return `https://www.fedex.com/fedextrack/?tracknumbers=${trackingNumber}`
    } else if (carrierLower.includes('dhl')) {
      return `https://www.dhl.com/en/express/tracking.html?AWB=${trackingNumber}`
    } else {
      // Default generic search
      return `https://www.google.com/search?q=track+${carrier}+${trackingNumber}`
    }
  }

  // Agrupar órdenes por estado
  const groupedOrders = useMemo(() => {
    const paid = compras.filter(c => c.status === 'paid')
    const shipped = compras.filter(c => c.status === 'shipped' || c.status === 'delivered')
    const cancelled = compras.filter(c => c.status === 'cancelled')
    const other = compras.filter(c => 
      c.status !== 'paid' && 
      c.status !== 'shipped' && 
      c.status !== 'delivered' && 
      c.status !== 'cancelled'
    )
    
    return { paid, shipped, cancelled, other }
  }, [compras])

  // Renderizar una orden
  const renderOrder = (compra: CompraWithItems) => (
    <Card key={compra.id} data-testid={`card-order-${compra.id}`}>
      <CardHeader className="border-b">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <CardTitle className="text-lg">{t("purchaseNumber")}{compra.id.slice(0, 8)}</CardTitle>
            <div className="flex items-center text-sm text-gray-600">
              <Calendar className="w-4 h-4 mr-1" />
              {formatDate(compra.created_at)}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge className={getStatusColor(compra.status)}>
              {getStatusLabel(compra.status)}
            </Badge>
            <div className="flex items-center font-semibold text-lg">
              <DollarSign className="w-5 h-5" />
              {compra.total_amount.toFixed(2)}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-4">
          {compra.order_items?.map((item: OrderItem & { product?: Product }) => (
            <div key={item.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
              <Link href={`/productdes/${item.product?.id || item.product_id}`} className="shrink-0">
                {item.product?.image_url || (item.product?.images && item.product.images[0]) ? (
                  <Image
                    src={item.product.image_url || (item.product.images ? item.product.images[0] : '')}
                    alt={item.product.title}
                    width={80}
                    height={80}
                    className="rounded-md object-cover hover:opacity-80 transition-opacity"
                  />
                ) : (
                  <div className="w-20 h-20 bg-gray-200 rounded-md flex items-center justify-center hover:opacity-80 transition-opacity">
                    <Package className="w-8 h-8 text-gray-400" />
                  </div>
                )}
              </Link>
              <div className="flex-1">
                <Link href={`/productdes/${item.product?.id || item.product_id}`}>
                  <h4 className="font-semibold hover:text-blue-600 transition-colors cursor-pointer">
                    {item.product?.title || t("orderItem")}
                  </h4>
                </Link>
                <p className="text-sm text-gray-600">
                  {t("quantity")} {item.quantity} × ${item.price_at_purchase.toFixed(2)}
                </p>
              </div>
              <div className="font-semibold">
                ${(item.quantity * item.price_at_purchase).toFixed(2)}
              </div>
            </div>
          ))}
        </div>
        
        {compra.shipping_address && (
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-semibold mb-2">{t("shippingAddress")}</h4>
            <p className="text-sm text-gray-700">
              {(compra.shipping_address as any).full_name && (
                <>
                  {(compra.shipping_address as any).full_name}
                  <br />
                </>
              )}
              {(compra.shipping_address as any).address_line1 || compra.shipping_address.street}
              {(compra.shipping_address as any).address_line2 && (
                <>
                  <br />
                  {(compra.shipping_address as any).address_line2}
                </>
              )}
              <br />
              {compra.shipping_address.city}, {compra.shipping_address.state}{" "}
              {(compra.shipping_address as any).postal_code || compra.shipping_address.zip}
            </p>
          </div>
        )}

        {(compra.status === "shipped" || compra.status === "delivered") && (compra as any).shipments && (compra as any).shipments.length > 0 && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Truck className="w-5 h-5 text-green-700" />
              <h4 className="font-semibold text-green-900">{t("shippingInformation")}</h4>
            </div>
            {(compra as any).shipments.map((shipment: any) => (
              <div key={shipment.id} className="mt-2">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <span className="text-sm font-medium text-green-800">{t("trackingNumber")}:</span>
                  <Link
                    href={getTrackingUrl(shipment.tracking_number, shipment.carrier || 'USPS')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 font-medium hover:underline"
                    data-testid={`link-tracking-${shipment.tracking_number}`}
                  >
                    {shipment.tracking_number}
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
                {shipment.carrier && (
                  <p className="text-sm text-green-700 mt-1">
                    {t("carrier")}: {shipment.carrier}
                  </p>
                )}
                {shipment.estimated_delivery && (
                  <p className="text-sm text-green-700 mt-1">
                    {t("estimatedDelivery")}: {formatDate(shipment.estimated_delivery)}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {(compra.status === "paid") && (
          <div className="mt-4">
            <CancelOrderDialog
              orderId={compra.id}
              userType="buyer"
              onCancelled={() => window.location.reload()}
            />
          </div>
        )}

        {compra.status === "cancelled" && compra.cancellation_reason && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm font-medium text-red-900 mb-1">{t("orderCancelled")}</p>
            <p className="text-sm text-red-800">{compra.cancellation_reason}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <SiteHeader user={user} />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{t("myPurchasesTitle")}</h1>
          <p className="text-gray-600">{t("myPurchasesSubtitle")}</p>
        </div>

        {!Array.isArray(compras) || compras.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Package className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-xl font-semibold mb-2">{t("noPurchases")}</h3>
              <p className="text-gray-600">{t("noPurchasesMessage")}</p>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="paid" className="w-full">
            <TabsList className={`grid w-full mb-6 ${groupedOrders.other.length > 0 ? 'grid-cols-4' : 'grid-cols-3'}`}>
              <TabsTrigger value="paid" className="relative" data-testid="tab-paid">
                {t("tabPaid")}
                {groupedOrders.paid.length > 0 && (
                  <Badge className="ml-2 bg-green-600 text-white hover:bg-green-700">
                    {groupedOrders.paid.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="shipped" className="relative" data-testid="tab-shipped">
                {t("tabShipped")}
                {groupedOrders.shipped.length > 0 && (
                  <Badge className="ml-2 bg-blue-600 text-white hover:bg-blue-700">
                    {groupedOrders.shipped.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="cancelled" className="relative" data-testid="tab-cancelled">
                {t("tabCancelled")}
                {groupedOrders.cancelled.length > 0 && (
                  <Badge className="ml-2 bg-red-600 text-white hover:bg-red-700">
                    {groupedOrders.cancelled.length}
                  </Badge>
                )}
              </TabsTrigger>
              {groupedOrders.other.length > 0 && (
                <TabsTrigger value="other" className="relative" data-testid="tab-other">
                  {t("tabOther")}
                  <Badge className="ml-2 bg-yellow-600 text-white hover:bg-yellow-700">
                    {groupedOrders.other.length}
                  </Badge>
                </TabsTrigger>
              )}
            </TabsList>

            {/* Tab: Pagados */}
            <TabsContent value="paid" className="space-y-4">
              {groupedOrders.paid.length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <DollarSign className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-xl font-semibold mb-2">{t("noPaidOrders")}</h3>
                    <p className="text-gray-600">{t("noPaidOrdersMessage")}</p>
                  </CardContent>
                </Card>
              ) : (
                <>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                    <p className="text-green-900 font-medium">
                      {(() => {
                        const count = groupedOrders.paid.length
                        const plural = count === 1 ? t("paidOrderSingular") : t("paidOrderPlural")
                        return t("paidOrdersBanner").replace("{count}", count.toString()).replace("{plural}", plural)
                      })()}
                    </p>
                  </div>
                  <div className="space-y-4">
                    {groupedOrders.paid.map(renderOrder)}
                  </div>
                </>
              )}
            </TabsContent>

            {/* Tab: Enviados */}
            <TabsContent value="shipped" className="space-y-4">
              {groupedOrders.shipped.length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Truck className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-xl font-semibold mb-2">{t("noShippedOrders")}</h3>
                    <p className="text-gray-600">{t("noShippedOrdersMessage")}</p>
                  </CardContent>
                </Card>
              ) : (
                <>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <p className="text-blue-900 font-medium">
                      {(() => {
                        const count = groupedOrders.shipped.length
                        const plural = count === 1 ? t("shippedOrderSingular") : t("shippedOrderPlural")
                        return t("shippedOrdersBanner").replace("{count}", count.toString()).replace("{plural}", plural)
                      })()}
                    </p>
                  </div>
                  <div className="space-y-4">
                    {groupedOrders.shipped.map(renderOrder)}
                  </div>
                </>
              )}
            </TabsContent>

            {/* Tab: Cancelados */}
            <TabsContent value="cancelled" className="space-y-4">
              {groupedOrders.cancelled.length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Package className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-xl font-semibold mb-2">{t("noCancelledOrders")}</h3>
                    <p className="text-gray-600">{t("noCancelledOrdersMessage")}</p>
                  </CardContent>
                </Card>
              ) : (
                <>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                    <p className="text-red-900 font-medium">
                      {(() => {
                        const count = groupedOrders.cancelled.length
                        const plural = count === 1 ? t("cancelledOrderSingular") : t("cancelledOrderPlural")
                        return t("cancelledOrdersBanner").replace("{count}", count.toString()).replace("{plural}", plural)
                      })()}
                    </p>
                  </div>
                  <div className="space-y-4">
                    {groupedOrders.cancelled.map(renderOrder)}
                  </div>
                </>
              )}
            </TabsContent>

            {/* Tab: Otros (solo visible si hay compras con estado no reconocido) */}
            {groupedOrders.other.length > 0 && (
              <TabsContent value="other" className="space-y-4">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4" data-testid="banner-other-status">
                  <p className="text-yellow-900 font-medium">
                    {(() => {
                      const count = groupedOrders.other.length
                      const plural = count === 1 ? t("otherOrderSingular") : t("otherOrderPlural")
                      return t("otherOrdersBanner").replace("{count}", count.toString()).replace("{plural}", plural)
                    })()}
                  </p>
                  <p className="text-yellow-800 text-sm mt-1">
                    {t("otherOrdersMessage")}
                  </p>
                </div>
                <div className="space-y-4">
                  {groupedOrders.other.map(renderOrder)}
                </div>
              </TabsContent>
            )}
          </Tabs>
        )}
      </main>
    </div>
  )
}
