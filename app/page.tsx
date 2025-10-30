import { getCurrentUser } from "@/lib/auth/utils"
import BuyerHomepageClient from "./buyer-homepage-client"
import { getAllProducts, getCategories } from "./actions/products"

export const dynamic = "force-dynamic"

export default async function BuyerHomepage() {
  const user = await getCurrentUser()
  const { data: products } = await getAllProducts()
  const { data: categories } = await getCategories()

  return <BuyerHomepageClient user={user} products={products || []} categories={categories || []} />
}
