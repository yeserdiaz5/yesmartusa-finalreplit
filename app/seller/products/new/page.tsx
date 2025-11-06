import { requireAuth } from "@/lib/auth/utils"
import { redirect } from "next/navigation"
import { getCategories, getTags } from "@/app/actions/products"
import { SiteHeader } from "@/components/site-header"
import NewProductClient from "./new-product-client"

export const dynamic = "force-dynamic"

export default async function NewProductPage() {
  try {
    const user = await requireAuth() // Removed role restriction - all authenticated users can create products
    const categoriesResult = await getCategories()
    const tagsResult = await getTags()

    return (
      <div className="min-h-screen bg-gray-50">
        <SiteHeader user={user} showSearch={false} />
        <NewProductClient categories={categoriesResult.data || []} tags={tagsResult.data || []} />
      </div>
    )
  } catch (error) {
    redirect("/")
  }
}
