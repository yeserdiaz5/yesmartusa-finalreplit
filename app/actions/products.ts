"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import type { Product } from "@/lib/types/database"

export interface CreateProductInput {
  title: string
  description: string
  price: number
  stock_quantity: number
  image_url?: string
  images?: string[]
  category_ids?: string[]
  tag_ids?: string[]
}

export interface UpdateProductInput extends Partial<CreateProductInput> {
  id: string
  is_active?: boolean
}

export async function createProduct(input: CreateProductInput) {
  const supabase = await createClient()

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Unauthorized" }
  }

  // Verify user is a seller or admin
  const { data: userProfile } = await supabase.from("users").select("role").eq("id", user.id).single()

  if (!userProfile || !["seller", "admin"].includes(userProfile.role)) {
    return { error: "Only sellers can create products" }
  }

  // Create product
  const { data: product, error: productError } = await supabase
    .from("products")
    .insert({
      seller_id: user.id,
      title: input.title,
      description: input.description,
      price: input.price,
      stock_quantity: input.stock_quantity,
      image_url: input.image_url,
      images: input.images || [],
      is_active: true,
    })
    .select()
    .single()

  if (productError) {
    return { error: productError.message }
  }

  // Add categories if provided
  if (input.category_ids && input.category_ids.length > 0) {
    const categoryInserts = input.category_ids.map((category_id) => ({
      product_id: product.id,
      category_id,
    }))

    await supabase.from("product_categories").insert(categoryInserts)
  }

  // Add tags if provided
  if (input.tag_ids && input.tag_ids.length > 0) {
    const tagInserts = input.tag_ids.map((tag_id) => ({
      product_id: product.id,
      tag_id,
    }))

    await supabase.from("product_tags").insert(tagInserts)
  }

  revalidatePath("/seller")
  return { data: product }
}

export async function updateProduct(input: UpdateProductInput) {
  const supabase = await createClient()

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Unauthorized" }
  }

  // Verify ownership
  const { data: product } = await supabase.from("products").select("seller_id").eq("id", input.id).single()

  if (!product || product.seller_id !== user.id) {
    return { error: "You can only update your own products" }
  }

  // Update product
  const updateData: Partial<Product> = {}
  if (input.title !== undefined) updateData.title = input.title
  if (input.description !== undefined) updateData.description = input.description
  if (input.price !== undefined) updateData.price = input.price
  if (input.stock_quantity !== undefined) updateData.stock_quantity = input.stock_quantity
  if (input.image_url !== undefined) updateData.image_url = input.image_url
  if (input.images !== undefined) updateData.images = input.images
  if (input.is_active !== undefined) updateData.is_active = input.is_active

  const { data: updatedProduct, error: updateError } = await supabase
    .from("products")
    .update(updateData)
    .eq("id", input.id)
    .select()
    .single()

  if (updateError) {
    return { error: updateError.message }
  }

  // Update categories if provided
  if (input.category_ids !== undefined) {
    // Delete existing categories
    await supabase.from("product_categories").delete().eq("product_id", input.id)

    // Insert new categories
    if (input.category_ids.length > 0) {
      const categoryInserts = input.category_ids.map((category_id) => ({
        product_id: input.id,
        category_id,
      }))
      await supabase.from("product_categories").insert(categoryInserts)
    }
  }

  // Update tags if provided
  if (input.tag_ids !== undefined) {
    // Delete existing tags
    await supabase.from("product_tags").delete().eq("product_id", input.id)

    // Insert new tags
    if (input.tag_ids.length > 0) {
      const tagInserts = input.tag_ids.map((tag_id) => ({
        product_id: input.id,
        tag_id,
      }))
      await supabase.from("product_tags").insert(tagInserts)
    }
  }

  revalidatePath("/seller")
  revalidatePath(`/seller/products/${input.id}/edit`)

  return { data: updatedProduct }
}

export async function deleteProduct(productId: string) {
  const supabase = await createClient()

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Unauthorized" }
  }

  // Verify ownership
  const { data: product } = await supabase.from("products").select("seller_id").eq("id", productId).single()

  if (!product || product.seller_id !== user.id) {
    return { error: "You can only delete your own products" }
  }

  // Delete product (cascade will handle related records)
  const { error } = await supabase.from("products").delete().eq("id", productId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/seller")
  return { success: true }
}

export async function getSellerProducts() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Unauthorized" }
  }

  const { data: products, error } = await supabase
    .from("products")
    .select(
      `
      *,
      product_categories (
        category:categories (*)
      ),
      product_tags (
        tag:tags (*)
      )
    `,
    )
    .eq("seller_id", user.id)
    .order("created_at", { ascending: false })

  if (error) {
    return { error: error.message }
  }

  return { data: products }
}

export async function getCategories() {
  const supabase = await createClient()

  const { data: categories, error } = await supabase.from("categories").select("*").eq("is_active", true).order("name")

  if (error) {
    return { error: error.message }
  }

  return { data: categories }
}

export async function getTags() {
  const supabase = await createClient()

  const { data: tags, error } = await supabase.from("tags").select("*").order("name")

  if (error) {
    return { error: error.message }
  }

  return { data: tags }
}

export async function getProductById(productId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Unauthorized" }
  }

  const { data: product, error } = await supabase
    .from("products")
    .select(
      `
      *,
      product_categories (
        category_id
      ),
      product_tags (
        tag_id
      )
    `,
    )
    .eq("id", productId)
    .eq("seller_id", user.id)
    .single()

  if (error) {
    return { error: error.message }
  }

  return { data: product }
}

export async function createTag(name: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Unauthorized" }
  }

  const slug = name.toLowerCase().replace(/\s+/g, "-")

  const { data: tag, error } = await supabase
    .from("tags")
    .insert({
      name,
      slug,
    })
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  return { data: tag }
}

export async function getAllProducts(categorySlug?: string, searchQuery?: string) {
  const supabase = await createClient()

  let query = supabase
    .from("products")
    .select(
      `
      *,
      seller:users!products_seller_id_fkey (
        id,
        full_name,
        email,
        store_name,
        seller_address
      ),
      product_categories (
        category:categories (*)
      ),
      product_tags (
        tag:tags (*)
      )
    `,
    )
    .eq("is_active", true)
    .order("created_at", { ascending: false })

  if (searchQuery && searchQuery.trim() !== "") {
    query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
  }

  // Filter by category if provided
  if (categorySlug) {
    const { data: category } = await supabase.from("categories").select("id").eq("slug", categorySlug).single()

    if (category) {
      const { data: productIds } = await supabase
        .from("product_categories")
        .select("product_id")
        .eq("category_id", category.id)

      if (productIds && productIds.length > 0) {
        query = query.in(
          "id",
          productIds.map((p) => p.product_id),
        )
      }
    }
  }

  const { data: products, error } = await query

  if (error) {
    return { error: error.message }
  }

  return { data: products }
}

/**
 * Get public products by seller ID (for storefront view)
 * Anyone can view a seller's active products
 */
export async function getProductsBySellerId(sellerId: string) {
  const supabase = await createClient()

  // Get seller info
  const { data: seller, error: sellerError } = await supabase
    .from("users")
    .select("id, full_name, store_name, avatar_url, email")
    .eq("id", sellerId)
    .single()

  if (sellerError || !seller) {
    return { error: "Seller not found" }
  }

  // Get seller's active products
  const { data: products, error: productsError } = await supabase
    .from("products")
    .select(
      `
      *,
      product_categories (
        category:categories (*)
      ),
      product_tags (
        tag:tags (*)
      )
    `,
    )
    .eq("seller_id", sellerId)
    .eq("is_active", true)
    .order("created_at", { ascending: false })

  if (productsError) {
    return { error: productsError.message }
  }

  return { data: { seller, products } }
}
