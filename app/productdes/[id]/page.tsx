import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import ProductDetailClient from "./product-detail-client"

export default async function ProductDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  let user = null
  if (authUser) {
    const { data: userProfile } = await supabase
      .from("users")
      .select("*")
      .eq("id", authUser.id)
      .single()
    user = userProfile
  }

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

  // Fetch related variants if this product is part of a variant group
  let relatedVariants: any[] = []
  if (product.variant_group_id) {
    const { data: variants } = await supabase
      .from("products")
      .select("id, title, price, image_url, images, stock_quantity, attributes")
      .eq("variant_group_id", product.variant_group_id)
      .eq("is_active", true)
      .neq("id", params.id) // Exclude current product
      .order("created_at", { ascending: true })

    relatedVariants = variants || []
  }

  return <ProductDetailClient product={product} user={user} relatedVariants={relatedVariants} />
}
