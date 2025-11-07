"use client"

import { User, LogOut, Settings, Store, ShoppingBag } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { logout } from "@/app/actions/auth"
import Link from "next/link"
import type { User as UserType } from "@/lib/types/database"
import { useLanguage } from "@/lib/i18n/LanguageContext"

interface UserMenuProps {
  user: UserType | null
}

export function UserMenu({ user }: UserMenuProps) {
  const { t } = useLanguage()
  
  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" className="text-white" asChild>
          <Link href="/auth/login">{t("signIn")}</Link>
        </Button>
        <Button size="sm" className="bg-yellow-400 hover:bg-yellow-500 text-black" asChild>
          <Link href="/auth/sign-up">{t("signUp")}</Link>
        </Button>
      </div>
    )
  }

  const displayName = user.store_name || user.full_name || (user.email ? user.email.split('@')[0] : 'User')

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="text-white">
          <User className="w-5 h-5" />
          <span className="ml-1 hidden sm:inline">{displayName}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col">
            <span className="font-medium">{displayName}</span>
            <span className="text-xs text-muted-foreground">{user.email}</span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/compras" className="cursor-pointer">
            <ShoppingBag className="w-4 h-4 mr-2" />
            {t("myPurchases")}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/seller" className="cursor-pointer">
            <Store className="w-4 h-4 mr-2" />
            {t("myStore")}
          </Link>
        </DropdownMenuItem>
        {user.role === "admin" && (
          <DropdownMenuItem asChild>
            <Link href="/admin" className="cursor-pointer">
              <Settings className="w-4 h-4 mr-2" />
              {t("adminPanel")}
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="cursor-pointer text-red-600"
          onClick={async () => {
            await logout()
          }}
        >
          <LogOut className="w-4 h-4 mr-2" />
          {t("signOut")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
