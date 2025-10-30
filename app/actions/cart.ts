"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export interface CartItem {
  id: string
  user_id: string
  product_id: string
  quantity: number
  created_at: string
  updated_at: string
  product: {
    id: string
    title: string
    price: number
    image_url: string
    images: string[]
    stock_quantity: number
    seller_id: string
  }
}

export async function getCart() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "No autenticado" }
  }

  const { data, error } = await supabase
    .from("cart_items")
    .select(`
      *,
      product:products(
        id,
        title,
        price,
        image_url,
        images,
        stock_quantity,
        seller_id
      )
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("[v0] Error fetching cart:", error)
    return { success: false, error: error.message }
  }

  return { success: true, data: data as CartItem[] }
}

export async function addToCart(productId: string, quantity = 1) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "Debes iniciar sesión para agregar productos al carrito" }
  }

  // Check if item already exists in cart
  const { data: existingItem } = await supabase
    .from("cart_items")
    .select("*")
    .eq("user_id", user.id)
    .eq("product_id", productId)
    .single()

  if (existingItem) {
    // Update quantity
    const { error } = await supabase
      .from("cart_items")
      .update({
        quantity: existingItem.quantity + quantity,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existingItem.id)

    if (error) {
      console.error("[v0] Error updating cart item:", error)
      return { success: false, error: error.message }
    }
  } else {
    // Insert new item
    const { error } = await supabase.from("cart_items").insert({
      user_id: user.id,
      product_id: productId,
      quantity,
    })

    if (error) {
      console.error("[v0] Error adding to cart:", error)
      return { success: false, error: error.message }
    }
  }

  revalidatePath("/")
  return { success: true, message: "Producto agregado al carrito" }
}

export async function updateCartItemQuantity(cartItemId: string, quantity: number) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "No autenticado" }
  }

  if (quantity <= 0) {
    return removeFromCart(cartItemId)
  }

  const { error } = await supabase
    .from("cart_items")
    .update({
      quantity,
      updated_at: new Date().toISOString(),
    })
    .eq("id", cartItemId)
    .eq("user_id", user.id)

  if (error) {
    console.error("[v0] Error updating cart item:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/cart")
  return { success: true }
}

export async function removeFromCart(cartItemId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "No autenticado" }
  }

  const { error } = await supabase.from("cart_items").delete().eq("id", cartItemId).eq("user_id", user.id)

  if (error) {
    console.error("[v0] Error removing from cart:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/cart")
  return { success: true }
}

export async function clearCart() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "No autenticado" }
  }

  const { error } = await supabase.from("cart_items").delete().eq("user_id", user.id)

  if (error) {
    console.error("[v0] Error clearing cart:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/cart")
  return { success: true }
}

export async function getCartCount() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: true, count: 0 }
  }

  const { data, error } = await supabase.from("cart_items").select("quantity").eq("user_id", user.id)

  if (error) {
    console.error("[v0] Error fetching cart count:", error)
    return { success: false, error: error.message }
  }

  const count = data?.reduce((sum, item) => sum + item.quantity, 0) || 0
  return { success: true, count }
}
