import { requireAuth } from "@/lib/auth/utils"
import { redirect } from "next/navigation"
import AdminDashboardClient from "./admin-dashboard-client"

export const dynamic = "force-dynamic"

export default async function AdminPage() {
  try {
    const user = await requireAuth(["admin"])
    return <AdminDashboardClient user={user} />
  } catch (error) {
    redirect("/")
  }
}
