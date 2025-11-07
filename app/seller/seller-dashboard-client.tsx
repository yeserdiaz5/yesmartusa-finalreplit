"use client"

import {
  Plus,
  Package,
  Eye,
  Edit,
  Trash2,
  DollarSign,
  ShoppingBag,
  AlertCircle,
  CheckCircle2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { SiteHeader } from "@/components/site-header"
import type { User } from "@/lib/types/database"
import Link from "next/link"
import { useLanguage } from "@/lib/i18n/LanguageContext"

interface SellerDashboardClientProps {
  user: User
  products: any[]
  orders: any[]
}

export default function SellerDashboardClient({ user, products }: SellerDashboardClientProps) {
  const { t } = useLanguage()

  // Check if seller is verified
  const isVerified = user.stripe_account_verified

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <SiteHeader user={user} />

      {/* Secondary header for dashboard title */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">{t("myProductListings")}</h1>
              <p className="text-gray-600">{t("manageYourProducts")}</p>
            </div>
            <div className="flex gap-2">
              {isVerified && (
                <>
                  <Link href="/seller/my-orders">
                    <Button variant="outline" className="bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100" data-testid="button-my-orders">
                      <ShoppingBag className="w-4 h-4 mr-2" />
                      {t("myOrdersButton")}
                    </Button>
                  </Link>
                  <Link href="/seller/products/new">
                    <Button className="bg-blue-600 hover:bg-blue-700" data-testid="button-add-product">
                      <Plus className="w-4 h-4 mr-2" />
                      {t("addProduct")}
                    </Button>
                  </Link>
                </>
              )}
              <Link href="/seller/pagos">
                <Button variant="outline" className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100" data-testid="button-earnings">
                  <DollarSign className="w-4 h-4 mr-2" />
                  {t("myEarnings")}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Welcome Message for Unverified Sellers - BLOCKS ENTIRE DASHBOARD */}
        {!isVerified ? (
          <div className="max-w-3xl mx-auto">
            <Card className="border-blue-200 shadow-lg">
              <CardHeader className="text-center pb-4">
                <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Package className="w-10 h-10 text-white" />
                </div>
                <CardTitle className="text-3xl font-bold text-gray-900 mb-2">
                  {t("welcomeToSelling")}
                </CardTitle>
                <CardDescription className="text-lg text-gray-600">
                  {t("welcomeSellerSubtitle")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Instructions */}
                <Alert className="border-blue-200 bg-blue-50">
                  <AlertCircle className="h-5 w-5 text-blue-600" />
                  <AlertDescription className="text-blue-900 font-medium">
                    {t("verificationRequired")}
                  </AlertDescription>
                </Alert>

                {/* Steps to get started */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg text-gray-900">{t("stepsToStart")}</h3>
                  
                  <div className="space-y-3">
                    <div className="flex items-start gap-3 p-4 bg-white border rounded-lg">
                      <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                        <span className="text-orange-600 font-bold">1</span>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 mb-1">{t("sellerStep1Title")}</h4>
                        <p className="text-sm text-gray-600">{t("sellerStep1Description")}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-4 bg-white border rounded-lg">
                      <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                        <span className="text-orange-600 font-bold">2</span>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 mb-1">{t("sellerStep2Title")}</h4>
                        <p className="text-sm text-gray-600">{t("sellerStep2Description")}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-4 bg-white border rounded-lg">
                      <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                        <span className="text-orange-600 font-bold">3</span>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 mb-1">{t("sellerStep3Title")}</h4>
                        <p className="text-sm text-gray-600">{t("sellerStep3Description")}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* CTA Button */}
                <div className="pt-4">
                  <Link href="/seller/pagos" className="block">
                    <Button className="w-full h-12 text-lg bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700" data-testid="button-setup-payments">
                      <DollarSign className="w-5 h-5 mr-2" />
                      {t("setupPaymentMethod")}
                    </Button>
                  </Link>
                </div>

                {/* Additional Info */}
                <div className="bg-gray-50 rounded-lg p-4 mt-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                    <div className="text-sm text-gray-700">
                      <strong>{t("verificationTimeTitle")}:</strong> {t("verificationTimeDescription")}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          /* Product Listings - Only show when verified */
          <>
        <div className="flex justify-between items-center mb-6">
          <div className="flex gap-2">
            <select className="border rounded-md px-3 py-2 text-sm">
              <option>{t("allStatus")}</option>
              <option>{t("active")}</option>
              <option>{t("inactive")}</option>
            </select>
          </div>
        </div>

        {products.length > 0 ? (
          <div className="grid gap-4">
            {products.map((product) => {
              const trustScore = 75 + Math.floor(Math.random() * 20)
              const views = Math.floor(Math.random() * 2000)
              const sales = Math.floor(Math.random() * 200)

              return (
                <Card key={product.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <Link href={`/productdes/${product.id}`} className="shrink-0">
                        <img
                          src={product.image_url || "/placeholder.svg"}
                          alt={product.title}
                          className="w-16 h-16 object-cover rounded-md hover:opacity-80 transition-opacity"
                        />
                      </Link>
                      <div className="flex-1">
                        <Link href={`/productdes/${product.id}`}>
                          <h3 className="font-medium hover:text-blue-600 transition-colors cursor-pointer">{product.title}</h3>
                        </Link>
                        <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                          <span>${product.price}</span>
                          <span>{t("stock")}: {product.stock_quantity}</span>
                          <Badge
                            className={
                              product.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                            }
                          >
                            {product.is_active ? t("active") : t("inactive")}
                          </Badge>
                          {product.product_categories && product.product_categories.length > 0 && (
                            <span className="text-xs text-blue-600">
                              {product.product_categories[0].category.name}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-600">{t("trustScore")}</div>
                        <div className="font-bold">{trustScore}%</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-600">{t("views")}</div>
                        <div className="font-bold">{views}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-600">{t("sales")}</div>
                        <div className="font-bold">{sales}</div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Link href={`/seller/products/${product.id}/edit`}>
                          <Button variant="outline" size="sm">
                            <Edit className="w-4 h-4" />
                          </Button>
                        </Link>
                        <Button variant="outline" size="sm">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">{t("noProductsYet")}</h3>
              <p className="text-gray-600 mb-4">{t("startSellingMessage")}</p>
              <Link href="/seller/products/new">
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  {t("addFirstProduct")}
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
        </>
        )}
      </div>
    </div>
  )
}
