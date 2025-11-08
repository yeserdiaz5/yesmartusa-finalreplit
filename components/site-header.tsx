"use client"
import type React from "react"
import Link from "next/link"
import Image from "next/image"
import { useState, useEffect } from "react"
import { Search, MapPin, Mic, ChevronDown, ImageIcon } from "lucide-react"
import { UserMenu } from "@/components/user-menu"
import { CartIcon } from "@/components/cart-icon"
import { NotificationsBell } from "@/components/notifications-bell"
import { LanguageSelector } from "@/components/language-selector"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import type { User } from "@/lib/types/database"

interface SiteHeaderProps {
  user: User | null
  categories?: any[]
  searchQuery?: string
  onSearch?: (query: string) => void
  onImageSearch?: () => void
  onCategoryChange?: (category: string) => void
}

export function SiteHeader({ user, categories = [], searchQuery = "", onSearch, onImageSearch, onCategoryChange }: SiteHeaderProps) {
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery)
  const [selectedCategory, setSelectedCategory] = useState("All")

  const handleSearch = () => {
    if (onSearch) {
      onSearch(localSearchQuery)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch()
    }
  }

  // Sync local state with prop when it changes (e.g., when cleared)
  useEffect(() => {
    setLocalSearchQuery(searchQuery)
  }, [searchQuery])

  return (
    <header className="bg-[#131921] text-white sticky top-0 z-50 shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-2 h-16">
          {/* Logo */}
          <Link 
            href="/" 
            className="hover:opacity-80 transition-opacity flex-shrink-0 mr-2"
            data-testid="link-home-logo"
          >
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/A_digital_vector_graphic_logo_for_YesMart_USA_feat-9M493Frwsh7wxoWA81iBSW28bqMxOn.png"
              alt="YesMart USA"
              width={140}
              height={50}
              className="h-10 w-auto"
              priority
            />
          </Link>

          {/* Deliver to - Only on desktop */}
          <div className="hidden lg:flex flex-col items-start cursor-pointer hover:bg-[#1a2332] px-2 py-1 rounded transition-colors flex-shrink-0">
            <span className="text-xs text-gray-300">Deliver to</span>
            <div className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              <span className="text-sm font-bold">USA</span>
            </div>
          </div>

          {/* Amazon-Style Search Bar */}
          <div className="flex-1 max-w-4xl">
            <div className="flex items-center">
              {/* Category Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button 
                    className="bg-[#f3f3f3] text-gray-700 px-3 h-10 rounded-l-md hover:bg-[#e3e3e3] transition-colors flex items-center gap-1 border-r border-gray-300 whitespace-nowrap"
                    data-testid="button-category-selector"
                  >
                    <span className="text-xs sm:text-sm font-medium">{selectedCategory}</span>
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48">
                  <DropdownMenuItem 
                    onClick={() => {
                      setSelectedCategory("All")
                      if (onCategoryChange) onCategoryChange("")
                    }}
                    data-testid="menu-item-all-categories"
                  >
                    All Categories
                  </DropdownMenuItem>
                  {categories.map((category) => (
                    <DropdownMenuItem
                      key={category.id}
                      onClick={() => {
                        setSelectedCategory(category.name)
                        if (onCategoryChange) onCategoryChange(category.slug)
                      }}
                      data-testid={`menu-item-category-${category.slug}`}
                    >
                      {category.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Search Input */}
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Search products..."
                  className="w-full h-10 px-4 pr-12 text-sm text-gray-900 focus:outline-none"
                  value={localSearchQuery}
                  onChange={(e) => setLocalSearchQuery(e.target.value)}
                  onKeyPress={handleKeyPress}
                  data-testid="input-header-search"
                />
                {/* Microphone Icon inside input */}
                <button 
                  className="absolute right-3 top-1/2 -translate-y-1/2 hover:bg-gray-100 p-1 rounded transition-colors"
                  title="Search by voice"
                  data-testid="button-voice-search"
                >
                  <Mic className="w-4 h-4 text-gray-600" />
                </button>
              </div>

              {/* Search Button (Yellow like Amazon) */}
              <button
                className="bg-[#febd69] hover:bg-[#f3a847] text-gray-900 px-4 h-10 rounded-r-md transition-colors"
                onClick={handleSearch}
                data-testid="button-header-search"
              >
                <Search className="w-5 h-5" />
              </button>

              {/* Image Search Button - Next to search */}
              <button
                className="bg-[#146eb4] hover:bg-[#0f5899] text-white px-3 h-10 ml-1 rounded-md transition-colors hidden sm:flex items-center gap-1.5"
                onClick={onImageSearch}
                title="Search by image"
                data-testid="button-header-image-search"
              >
                <ImageIcon className="w-4 h-4" />
                <span className="text-xs font-medium hidden xl:inline">Image</span>
              </button>
            </div>
          </div>

          {/* Right side icons */}
          <div className="flex items-center gap-2 ml-2 flex-shrink-0">
            <LanguageSelector />
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
