"use client"

import { User, LogOut, Settings, Package, Store } from "lucide-react"
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

interface UserMenuProps {
  user: UserType | null
}

export function UserMenu({ user }: UserMenuProps) {
  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" className="text-white" asChild>
          <Link href="/auth/login">Iniciar Sesión</Link>
        </Button>
        <Button size="sm" className="bg-yellow-400 hover:bg-yellow-500 text-black" asChild>
          <Link href="/auth/sign-up">Registrarse</Link>
        </Button>
      </div>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="text-white">
          <User className="w-5 h-5" />
          <span className="ml-1 hidden sm:inline">{user.full_name || user.email}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col">
            <span className="font-medium">{user.full_name}</span>
            <span className="text-xs text-muted-foreground">{user.email}</span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/my-orders" className="cursor-pointer">
            <Package className="w-4 h-4 mr-2" />
            Mis Pedidos
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/seller" className="cursor-pointer">
            <Store className="w-4 h-4 mr-2" />
            Panel de Vendedor
          </Link>
        </DropdownMenuItem>
        {user.role === "admin" && (
          <DropdownMenuItem asChild>
            <Link href="/admin" className="cursor-pointer">
              <Settings className="w-4 h-4 mr-2" />
              Panel de Admin
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
          Cerrar Sesión
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
