"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export interface CreateCategoryInput {
  name: string
  description?: string
  parent_id?: string
  image_url?: string
}

export async function createCategory(input: CreateCategoryInput) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Unauthorized" }
  }

  // Verify user is admin
  const { data: userProfile } = await supabase.from("users").select("role").eq("id", user.id).single()

  if (!userProfile || userProfile.role !== "admin") {
    return { error: "Only admins can create categories" }
  }

  const slug = input.name.toLowerCase().replace(/\s+/g, "-")

  const { data: category, error } = await supabase
    .from("categories")
    .insert({
      name: input.name,
      slug,
      description: input.description,
      parent_id: input.parent_id,
      image_url: input.image_url,
      is_active: true,
    })
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/admin")
  return { data: category }
}

export async function updateCategory(id: string, input: Partial<CreateCategoryInput>) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Unauthorized" }
  }

  // Verify user is admin
  const { data: userProfile } = await supabase.from("users").select("role").eq("id", user.id).single()

  if (!userProfile || userProfile.role !== "admin") {
    return { error: "Only admins can update categories" }
  }

  const updateData: any = { ...input }
  if (input.name) {
    updateData.slug = input.name.toLowerCase().replace(/\s+/g, "-")
  }

  const { data: category, error } = await supabase.from("categories").update(updateData).eq("id", id).select().single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/admin")
  return { data: category }
}

export async function deleteCategory(id: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Unauthorized" }
  }

  // Verify user is admin
  const { data: userProfile } = await supabase.from("users").select("role").eq("id", user.id).single()

  if (!userProfile || userProfile.role !== "admin") {
    return { error: "Only admins can delete categories" }
  }

  const { error } = await supabase.from("categories").delete().eq("id", id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/admin")
  return { success: true }
}
