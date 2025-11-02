import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getProductById, getCategories, getTags } from "@/app/actions/products"
import ProductForm from "@/app/seller/products/product-form"
import SiteHeader from "@/components/site-header"

export default async function EditProductPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Get user profile
  const { data: userProfile } = await supabase.from("users").select("*").eq("id", user.id).single()

  if (!userProfile) {
    redirect("/")
  }

  // Get product data
  const productResult = await getProductById(params.id)

  if (productResult.error || !productResult.data) {
    redirect("/seller")
  }

  const product = productResult.data

  // Get categories and tags
  const [categoriesResult, tagsResult] = await Promise.all([getCategories(), getTags()])

  const categories = categoriesResult.data || []
  const tags = tagsResult.data || []

  // Extract category and tag IDs
  const productCategories = product.product_categories?.map((pc: any) => pc.category_id) || []
  const productTags = product.product_tags?.map((pt: any) => pt.tag_id) || []

  return (
    <div className="min-h-screen bg-gray-50">
      <SiteHeader user={userProfile} showSearch={false} />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Editar Producto</h1>
          <ProductForm
            categories={categories}
            tags={tags}
            product={product}
            productCategories={productCategories}
            productTags={productTags}
          />
        </div>
      </div>
    </div>
  )
}
