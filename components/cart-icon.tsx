"use client"

import { ShoppingCart } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { getCartCount } from "@/app/actions/cart"
import { getGuestCart } from "@/lib/guest-cart"

export function CartIcon() {
  const [count, setCount] = useState(0)

  useEffect(() => {
    let isAuthenticated = false

    const fetchCount = async () => {
      try {
        // Try to get authenticated user cart count first
        const result = await getCartCount()

        if (result && result.success && result.count !== undefined) {
          // User is authenticated, use server-side count
          isAuthenticated = true
          setCount(result.count)
        } else {
          // User is not authenticated, use guest cart count
          isAuthenticated = false
          const guestCart = getGuestCart()
          const guestCount = guestCart.reduce((sum, item) => sum + item.quantity, 0)
          setCount(guestCount)
        }
      } catch (error) {
        // On error, fallback to guest cart
        isAuthenticated = false
        const guestCart = getGuestCart()
        const guestCount = guestCart.reduce((sum, item) => sum + item.quantity, 0)
        setCount(guestCount)
      }
    }

    fetchCount()

    // Refresh count every 2 seconds only for authenticated users
    // For guests, rely on events only (no need to poll server)
    const interval = setInterval(() => {
      if (isAuthenticated) {
        fetchCount()
      } else {
        // For guests, just check localStorage
        const guestCart = getGuestCart()
        const guestCount = guestCart.reduce((sum, item) => sum + item.quantity, 0)
        setCount(guestCount)
      }
    }, 2000)

    // Listen for custom cart update event for immediate updates
    const handleCartUpdate = () => {
      fetchCount()
    }
    window.addEventListener("cartUpdated", handleCartUpdate)

    // Listen for storage events (when cart changes in another tab)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "guest_cart") {
        fetchCount()
      }
    }
    window.addEventListener("storage", handleStorageChange)

    return () => {
      clearInterval(interval)
      window.removeEventListener("cartUpdated", handleCartUpdate)
      window.removeEventListener("storage", handleStorageChange)
    }
  }, [])

  return (
    <Link href="/cartplus" className="relative hover:text-blue-100 transition-colors">
      <ShoppingCart className="h-6 w-6" />
      {count > 0 && (
        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
          {count}
        </span>
      )}
    </Link>
  )
}
