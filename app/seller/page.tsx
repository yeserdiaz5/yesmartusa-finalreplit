import { Progress } from "@/components/ui/progress"
import { requireAuth } from "@/lib/auth/utils"
import { redirect } from "next/navigation"
import SellerDashboardClient from "./seller-dashboard-client"
import { getSellerProducts } from "../actions/products"
import { getSellerOrders } from "../actions/orders"

// Mock seller data
const sellerData = {
  name: "TechGear Pro",
  trustScore: 92,
  totalSales: 15420,
  rating: 4.7,
  totalListings: 45,
  activeListings: 38,
  monthlyRevenue: 12450,
  totalReviews: 3240,
}

const listings = [
  {
    id: 1,
    name: "Wireless Bluetooth Headphones",
    price: 79.99,
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=100&h=100&fit=crop",
    status: "active",
    views: 1247,
    sales: 89,
    trustScore: 50,
    stock: 25,
  },
  {
    id: 2,
    name: "USB-C Fast Charger",
    price: 24.99,
    image: "https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=100&h=100&fit=crop",
    status: "active",
    views: 856,
    sales: 156,
    trustScore: 91,
    stock: 50,
  },
  {
    id: 3,
    name: "Wireless Mouse",
    price: 34.99,
    image: "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=100&h=100&fit=crop",
    status: "inactive",
    views: 432,
    sales: 23,
    trustScore: 85,
    stock: 0,
  },
  {
    id: 4,
    name: "Bluetooth Speaker",
    price: 59.99,
    image: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=100&h=100&fit=crop",
    status: "pending",
    views: 0,
    sales: 0,
    trustScore: 76,
    stock: 15,
  },
]

const recentActivity = [
  { type: "sale", item: "Wireless Bluetooth Headphones", amount: 79.99, time: "2 hours ago" },
  { type: "review", item: "USB-C Fast Charger", rating: 5, time: "4 hours ago" },
  { type: "sale", item: "Wireless Mouse", amount: 34.99, time: "6 hours ago" },
  { type: "listing", item: "New product submitted for review", time: "1 day ago" },
]

function TrustScoreDisplay({ score }: { score: number }) {
  const getScoreData = (score: number) => {
    if (score >= 90)
      return {
        color: "text-emerald-600",
        bgColor: "bg-emerald-50",
        icon: "🛡️",
      }
    if (score >= 80)
      return {
        color: "text-blue-600",
        bgColor: "bg-blue-50",
        icon: "✅",
      }
    if (score >= 70)
      return {
        color: "text-amber-600",
        bgColor: "bg-amber-50",
        icon: "⚠️",
      }
    return {
      color: "text-red-600",
      bgColor: "bg-red-50",
      icon: "❌",
    }
  }

  const scoreData = getScoreData(score)

  return (
    <div className={`text-center p-4 rounded-xl ${scoreData.bgColor}`}>
      <div className="text-2xl mb-2">{scoreData.icon}</div>
      <div className={`text-4xl font-bold ${scoreData.color} mb-1`}>{score}</div>
      <div className="text-sm text-gray-600 mb-3">Trust Score</div>
      <Progress value={score} className="h-2" />
    </div>
  )
}

export const dynamic = "force-dynamic"

export default async function SellerPage() {
  try {
    const user = await requireAuth()

    const { data: products } = await getSellerProducts()
    const { data: orders } = await getSellerOrders()

    return <SellerDashboardClient user={user} products={products || []} orders={orders || []} />
  } catch (error) {
    redirect("/")
  }
}
