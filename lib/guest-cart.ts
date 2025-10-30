"use client"

export interface GuestCartItem {
  product_id: string
  quantity: number
  product: {
    id: string
    title: string
    price: number
    image_url: string
    stock_quantity: number
    seller_id: string
  }
}

const CART_KEY = "yesmart_guest_cart"

export function getGuestCart(): GuestCartItem[] {
  if (typeof window === "undefined") return []
  const cart = localStorage.getItem(CART_KEY)
  return cart ? JSON.parse(cart) : []
}

export function addToGuestCart(product: GuestCartItem["product"], quantity = 1): void {
  const cart = getGuestCart()
  const existingItem = cart.find((item) => item.product_id === product.id)

  if (existingItem) {
    existingItem.quantity += quantity
  } else {
    cart.push({
      product_id: product.id,
      quantity,
      product,
    })
  }

  localStorage.setItem(CART_KEY, JSON.stringify(cart))
  window.dispatchEvent(new Event("cartUpdated"))
}

export function updateGuestCartQuantity(productId: string, quantity: number): void {
  const cart = getGuestCart()
  const item = cart.find((item) => item.product_id === productId)

  if (item) {
    if (quantity <= 0) {
      removeFromGuestCart(productId)
    } else {
      item.quantity = quantity
      localStorage.setItem(CART_KEY, JSON.stringify(cart))
      window.dispatchEvent(new Event("cartUpdated"))
    }
  }
}

export function removeFromGuestCart(productId: string): void {
  const cart = getGuestCart()
  const filtered = cart.filter((item) => item.product_id !== productId)
  localStorage.setItem(CART_KEY, JSON.stringify(filtered))
  window.dispatchEvent(new Event("cartUpdated"))
}

export function clearGuestCart(): void {
  localStorage.removeItem(CART_KEY)
  window.dispatchEvent(new Event("cartUpdated"))
}

export function getGuestCartCount(): number {
  const cart = getGuestCart()
  return cart.reduce((sum, item) => sum + item.quantity, 0)
}
