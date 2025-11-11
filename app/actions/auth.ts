"use server"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function loginWithPassword(email: string, password: string) {
  const supabase = await createClient()

  console.log("[v0] loginWithPassword - Attempting login for:", email)

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    console.error("[v0] loginWithPassword - Error:", error)
    return {
      success: false,
      error: error.message,
    }
  }

  console.log("[v0] loginWithPassword - Success, user:", data.user?.email)

  revalidatePath("/", "layout")
  redirect("/")
}

export async function logout() {
  const supabase = await createClient()

  await supabase.auth.signOut()

  revalidatePath("/", "layout")
  redirect("/")
}

export async function createTestUser() {
  const adminClient = createAdminClient()

  const testEmail = "test@yesmartusa.com"
  const testPassword = "TestUser123!"
  const testName = "Usuario de Prueba"

  console.log("[v0] Creating test user with admin API:", testEmail)

  // Check if user already exists in auth
  const { data: existingAuthUser } = await adminClient.auth.admin.listUsers()
  const userExists = existingAuthUser?.users?.some((u) => u.email === testEmail)

  if (userExists) {
    console.log("[v0] Test user already exists in auth")
    return {
      success: true,
      message: "Usuario de prueba ya existe. Puedes iniciar sesión ahora.",
      credentials: {
        email: testEmail,
        password: testPassword,
        name: testName,
      },
    }
  }

  const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
    email: testEmail,
    password: testPassword,
    email_confirm: true, // Skip email confirmation
    user_metadata: {
      full_name: testName,
    },
  })

  if (authError) {
    console.error("[v0] Error creating test user:", authError)
    return {
      success: false,
      error: authError.message,
    }
  }

  console.log("[v0] Test user created successfully with ID:", authData.user.id)

  const supabase = await createClient()
  const { error: userRecordError } = await supabase.from("users").insert({
    id: authData.user.id,
    email: testEmail,
    full_name: testName,
    role: "admin", // Admin role for test user
  })

  if (userRecordError) {
    console.error("[v0] Error creating user record:", userRecordError)
    // Don't fail if user record creation fails, auth user is created
  }

  console.log("[v0] Test user setup complete")

  return {
    success: true,
    message: "Usuario de prueba creado exitosamente. Puedes iniciar sesión ahora.",
    credentials: {
      email: testEmail,
      password: testPassword,
      name: testName,
    },
  }
}
