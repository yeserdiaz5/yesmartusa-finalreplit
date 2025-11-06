"use client"

import ProductForm from "@/app/seller/products/product-form"
import type { Category, Tag } from "@/lib/types/database"
import { useLanguage } from "@/lib/i18n/LanguageContext"

interface NewProductClientProps {
  categories: Category[]
  tags: Tag[]
}

export default function NewProductClient({ categories, tags }: NewProductClientProps) {
  const { t } = useLanguage()

  return (
    <>
      {/* Secondary header for page title */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold">{t("addNewProduct")}</h1>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="max-w-3xl mx-auto">
          <ProductForm categories={categories} tags={tags} />
        </div>
      </div>
    </>
  )
}
