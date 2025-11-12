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
        const result = await getCartCount()

        if (result && result.success && result.count !== undefined) {
          isAuthenticated = true
          setCount(result.count)
        } else {
          isAuthenticated = false
          const guestCart = getGuestCart()
          const guestCount = guestCart.reduce((sum, item) => sum + item.quantity, 0)
          setCount(guestCount)
        }
      } catch (error) {
        isAuthenticated = false
        const guestCart = getGuestCart()
        const guestCount = guestCart.reduce((sum, item) => sum + item.quantity, 0)
        setCount(guestCount)
      }
    }

    fetchCount()

    const interval = setInterval(() => {
      if (isAuthenticated) {
        fetchCount()
      } else {
        const guestCart = getGuestCart()
        const guestCount = guestCart.reduce((sum, item) => sum + item.quantity, 0)
        setCount(guestCount)
      }
    }, 2000)

    const handleCartUpdate = () => {
      fetchCount()
    }
    window.addEventListener("cartUpdated", handleCartUpdate)

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
