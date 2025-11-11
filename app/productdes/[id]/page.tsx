import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import ProductDetailClient from "./product-detail-client"

export default async function ProductDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: product, error } = await supabase
    .from("products")
    .select(
      `
      *,
      seller:users!products_seller_id_fkey (
        id,
        full_name,
        email
      ),
      product_categories (
        category:categories (*)
      ),
      product_tags (
        tag:tags (*)
      )
    `,
    )
    .eq("id", params.id)
    .eq("is_active", true)
    .single()

  if (error || !product) {
    notFound()
  }

  return <ProductDetailClient product={product} user={user} />
}
