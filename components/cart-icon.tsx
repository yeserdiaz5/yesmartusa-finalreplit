"use client"

import { ShoppingCart } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { getCartCount } from "@/app/actions/cart"

export function CartIcon() {
  const [count, setCount] = useState(0)

  useEffect(() => {
    const fetchCount = async () => {
      const result = await getCartCount()
      if (result.success && result.count !== undefined) {
        setCount(result.count)
      }
    }

    fetchCount()

    // Refresh count every 5 seconds
    const interval = setInterval(fetchCount, 5000)
    return () => clearInterval(interval)
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
