"use client"
import Link from "next/link"
import Image from "next/image"
import { UserMenu } from "@/components/user-menu"
import { CartIcon } from "@/components/cart-icon"
import { NotificationsBell } from "@/components/notifications-bell"
import type { User } from "@/lib/types/database"

interface SiteHeaderProps {
  user: User | null
}

export function SiteHeader({ user }: SiteHeaderProps) {
  return (
    <header className="bg-blue-600 text-white sticky top-0 z-50 shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="hover:opacity-80 transition-opacity">
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/A_digital_vector_graphic_logo_for_YesMart_USA_feat-9M493Frwsh7wxoWA81iBSW28bqMxOn.png"
              alt="YesMart USA"
              width={180}
              height={60}
              className="h-12 w-auto"
              priority
            />
          </Link>

          <div className="flex items-center gap-4">
            <CartIcon />
            {user && <NotificationsBell />}
            <UserMenu user={user} />
          </div>
        </div>
      </div>
    </header>
  )
}

export default SiteHeader
