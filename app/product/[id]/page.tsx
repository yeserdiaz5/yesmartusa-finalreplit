import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import ProductDetailClient from "./product-detail-client"

export default async function ProductDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()

  // Fetch product with all related data
  const { data: product, error } = await supabase
    .from("products")
    .select(`
      *,
      seller:users!seller_id(id, full_name, email),
      product_categories(
        category:categories(id, name, slug)
      ),
      product_tags(
        tag:tags(id, name)
      )
    `)
    .eq("id", params.id)
    .single()

  if (error || !product) {
    notFound()
  }

  // Get user for authentication check
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return <ProductDetailClient product={product} user={user} />
}
