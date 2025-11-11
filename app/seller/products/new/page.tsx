import { requireAuth } from "@/lib/auth/utils"
import { redirect } from "next/navigation"
import ProductForm from "@/app/seller/products/product-form"
import { getCategories, getTags } from "@/app/actions/products"
import { SiteHeader } from "@/components/site-header"

export const dynamic = "force-dynamic"

export default async function NewProductPage() {
  try {
    const user = await requireAuth() // Removed role restriction - all authenticated users can create products
    const categoriesResult = await getCategories()
    const tagsResult = await getTags()

    return (
      <div className="min-h-screen bg-gray-50">
        <SiteHeader user={user} showSearch={false} />

        {/* Secondary header for page title */}
        <div className="bg-white border-b">
          <div className="container mx-auto px-4 py-4">
            <h1 className="text-2xl font-bold">Agregar Nuevo Producto</h1>
          </div>
        </div>

        <div className="container mx-auto px-4 py-6">
          <div className="max-w-3xl mx-auto">
            <ProductForm categories={categoriesResult.data || []} tags={tagsResult.data || []} />
          </div>
        </div>
      </div>
    )
  } catch (error) {
    redirect("/")
  }
}
