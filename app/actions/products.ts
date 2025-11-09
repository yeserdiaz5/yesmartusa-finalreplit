"use server"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { revalidatePath } from "next/cache"
import type { Product, ShippingPolicy, ProductCondition } from "@/lib/types/database"
import { updateProductEmbedding } from "@/lib/embeddings"

export interface CreateProductInput {
  title: string
  description: string
  price: number
  stock_quantity: number
  image_url?: string
  images?: string[]
  brand?: string | null
  condition?: ProductCondition | null
  category_ids?: string[]
  tag_ids?: string[]
  shipping_policy?: ShippingPolicy | null
  shipping_cost?: number | null
  package_length?: number | null
  package_width?: number | null
  package_height?: number | null
  package_weight?: number | null
  asin?: string | null
  attributes?: Record<string, string>
  parent_id?: string | null
}

export interface VariantInput {
  asin?: string | null  // Optional for manual variants
  title: string
  price: number
  stock_quantity: number  // Stock for each variant
  image_url: string  // Main image (for backward compatibility)
  images: string[]  // Multiple images for variant
  attributes: Record<string, string>
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
      brand: input.brand || null,
      condition: input.condition || null,
      is_active: true,
      shipping_policy: input.shipping_policy || null,
      shipping_cost: input.shipping_cost || null,
      package_length: input.package_length || null,
      package_width: input.package_width || null,
      package_height: input.package_height || null,
      package_weight: input.package_weight || null,
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

  // Generate embedding asynchronously (don't wait for completion)
  const imageUrl = input.image_url || input.images?.[0]
  if (imageUrl && process.env.OPENAI_API_KEY) {
    const adminClient = createAdminClient()
    updateProductEmbedding(adminClient, product.id, imageUrl).catch((error) => {
      console.error(`[Create Product] Failed to generate embedding for product ${product.id}:`, error)
    })
  }

  revalidatePath("/seller")
  return { data: product }
}

// Helper function to rollback all created products and their relations
async function rollbackProducts(supabase: any, productIds: string[]) {
  if (productIds.length === 0) return

  // Delete relations first (categories and tags)
  await supabase.from("product_categories").delete().in("product_id", productIds)
  await supabase.from("product_tags").delete().in("product_id", productIds)

  // Then delete products
  await supabase.from("products").delete().in("id", productIds)
}

export async function createProductWithVariants(
  parentInput: CreateProductInput,
  selectedVariants: VariantInput[]
) {
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

  // Validate variants up-front
  for (const variant of selectedVariants) {
    if (!variant.title || !variant.title.trim()) {
      return { error: "All variants must have a valid title" }
    }
    if (variant.price <= 0) {
      return { error: "All variants must have a valid price" }
    }
    if (variant.stock_quantity < 0) {
      return { error: "All variants must have valid stock quantity" }
    }
    if (!variant.images || variant.images.length === 0) {
      return { error: "All variants must have at least one image" }
    }
  }

  try {
    // Step 1: Create parent product with ASIN
    const { data: parentProduct, error: parentError } = await supabase
      .from("products")
      .insert({
        seller_id: user.id,
        title: parentInput.title,
        description: parentInput.description,
        price: parentInput.price,
        stock_quantity: parentInput.stock_quantity,
        image_url: parentInput.image_url,
        images: parentInput.images || [],
        brand: parentInput.brand || null,
        condition: parentInput.condition || null,
        is_active: true,
        shipping_policy: parentInput.shipping_policy || null,
        shipping_cost: parentInput.shipping_cost || null,
        package_length: parentInput.package_length || null,
        package_width: parentInput.package_width || null,
        package_height: parentInput.package_height || null,
        package_weight: parentInput.package_weight || null,
        asin: parentInput.asin || null,
        attributes: parentInput.attributes || {},
        parent_id: null,
      })
      .select()
      .single()

    if (parentError) {
      throw new Error(`Failed to create parent product: ${parentError.message}`)
    }

    const createdProductIds = [parentProduct.id]

    // Step 2: Add categories and tags to parent
    if (parentInput.category_ids && parentInput.category_ids.length > 0) {
      const categoryInserts = parentInput.category_ids.map((category_id) => ({
        product_id: parentProduct.id,
        category_id,
      }))
      const { error: categoryError } = await supabase.from("product_categories").insert(categoryInserts)
      if (categoryError) {
        // Rollback: Delete parent product and its relations
        await rollbackProducts(supabase, [parentProduct.id])
        throw new Error(`Failed to add categories to parent product: ${categoryError.message}`)
      }
    }

    if (parentInput.tag_ids && parentInput.tag_ids.length > 0) {
      const tagInserts = parentInput.tag_ids.map((tag_id) => ({
        product_id: parentProduct.id,
        tag_id,
      }))
      const { error: tagError } = await supabase.from("product_tags").insert(tagInserts)
      if (tagError) {
        // Rollback: Delete parent product and its relations
        await rollbackProducts(supabase, [parentProduct.id])
        throw new Error(`Failed to add tags to parent product: ${tagError.message}`)
      }
    }

    // Step 3: Create variant products if any selected
    if (selectedVariants.length > 0) {
      const variantInserts = selectedVariants.map((variant) => ({
        seller_id: user.id,
        parent_id: parentProduct.id,
        title: variant.title,
        description: parentInput.description,
        price: variant.price,
        stock_quantity: variant.stock_quantity,  // Use stock from variant
        image_url: variant.image_url,
        images: variant.images.length > 0 ? variant.images : [variant.image_url],  // Use variant images or fallback
        brand: parentInput.brand || null,
        condition: parentInput.condition || null,
        is_active: true,
        shipping_policy: parentInput.shipping_policy || null,
        shipping_cost: parentInput.shipping_cost || null,
        package_length: parentInput.package_length || null,
        package_width: parentInput.package_width || null,
        package_height: parentInput.package_height || null,
        package_weight: parentInput.package_weight || null,
        asin: variant.asin || null,  // Optional for manual variants
        attributes: variant.attributes,
      }))

      const { data: variantProducts, error: variantError } = await supabase
        .from("products")
        .insert(variantInserts)
        .select()

      if (variantError) {
        // Rollback: Delete parent product and its relations
        await rollbackProducts(supabase, [parentProduct.id])
        throw new Error(`Failed to create variants: ${variantError.message}`)
      }

      if (!variantProducts || variantProducts.length === 0) {
        // Rollback: Delete parent product and its relations
        await rollbackProducts(supabase, [parentProduct.id])
        throw new Error("No variants were created")
      }

      createdProductIds.push(...variantProducts.map((p) => p.id))

      // Add categories and tags to each variant
      for (const variantProduct of variantProducts) {
        if (parentInput.category_ids && parentInput.category_ids.length > 0) {
          const categoryInserts = parentInput.category_ids.map((category_id) => ({
            product_id: variantProduct.id,
            category_id,
          }))
          const { error: catError } = await supabase.from("product_categories").insert(categoryInserts)
          if (catError) {
            // Rollback: Delete all created products and their relations
            await rollbackProducts(supabase, createdProductIds)
            throw new Error(`Failed to add categories to variant: ${catError.message}`)
          }
        }

        if (parentInput.tag_ids && parentInput.tag_ids.length > 0) {
          const tagInserts = parentInput.tag_ids.map((tag_id) => ({
            product_id: variantProduct.id,
            tag_id,
          }))
          const { error: tagError } = await supabase.from("product_tags").insert(tagInserts)
          if (tagError) {
            // Rollback: Delete all created products and their relations
            await rollbackProducts(supabase, createdProductIds)
            throw new Error(`Failed to add tags to variant: ${tagError.message}`)
          }
        }
      }
    }

    // Step 4: Generate embeddings asynchronously for all created products
    const adminClient = createAdminClient()
    for (const productId of createdProductIds) {
      const product = productId === parentProduct.id ? parentProduct : await supabase
        .from("products")
        .select("image_url, images")
        .eq("id", productId)
        .single()
        .then(({ data }) => data)

      if (product) {
        const imageUrl = product.image_url || product.images?.[0]
        if (imageUrl) {
          updateProductEmbedding(adminClient, productId, imageUrl).catch((error) => {
            console.error(`[Create Product With Variants] Failed to generate embedding for product ${productId}:`, error)
          })
        }
      }
    }

    revalidatePath("/seller")
    return {
      data: {
        parent: parentProduct,
        variantCount: selectedVariants.length,
        totalProducts: createdProductIds.length,
      },
    }
  } catch (error: any) {
    console.error("[Create Product With Variants] Error:", error)
    return { error: error.message || "Failed to create product with variants" }
  }
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
  if (input.brand !== undefined) updateData.brand = input.brand
  if (input.condition !== undefined) updateData.condition = input.condition
  if (input.is_active !== undefined) updateData.is_active = input.is_active
  if (input.shipping_policy !== undefined) updateData.shipping_policy = input.shipping_policy
  if (input.shipping_cost !== undefined) updateData.shipping_cost = input.shipping_cost
  if (input.package_length !== undefined) updateData.package_length = input.package_length
  if (input.package_width !== undefined) updateData.package_width = input.package_width
  if (input.package_height !== undefined) updateData.package_height = input.package_height
  if (input.package_weight !== undefined) updateData.package_weight = input.package_weight

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

  // Regenerate embedding if image was updated
  const imageUrl = input.image_url || input.images?.[0]
  if ((input.image_url !== undefined || input.images !== undefined) && imageUrl && process.env.OPENAI_API_KEY) {
    const adminClient = createAdminClient()
    updateProductEmbedding(adminClient, input.id, imageUrl).catch((error) => {
      console.error(`[Update Product] Failed to generate embedding for product ${input.id}:`, error)
    })
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
    .select("id, full_name, store_name, avatar_url, email, seller_address")
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
