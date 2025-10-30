"use server"

import { createClient } from "@/lib/supabase/server"

export async function uploadImage(formData: FormData) {
  try {
    console.log("[v0] Starting image upload...")

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    console.log("[v0] User authenticated:", !!user)

    if (!user) {
      return { error: "No autenticado" }
    }

    const file = formData.get("file") as File
    if (!file) {
      console.log("[v0] No file provided")
      return { error: "No se proporcionó ningún archivo" }
    }

    console.log("[v0] File details:", { name: file.name, type: file.type, size: file.size })

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return { error: "El archivo debe ser una imagen" }
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return { error: "La imagen debe ser menor a 5MB" }
    }

    // Generate unique filename
    const fileExt = file.name.split(".").pop()
    const fileName = `${user.id}/${Date.now()}.${fileExt}`

    console.log("[v0] Uploading to Supabase Storage:", fileName)

    // Convert File to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = new Uint8Array(arrayBuffer)

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage.from("product-images").upload(fileName, buffer, {
      contentType: file.type,
      upsert: false,
    })

    if (error) {
      console.error("[v0] Supabase upload error:", error)
      return { error: `Error al subir: ${error.message}` }
    }

    console.log("[v0] Upload successful:", data)

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from("product-images").getPublicUrl(fileName)

    console.log("[v0] Public URL:", publicUrl)

    return { url: publicUrl }
  } catch (error) {
    console.error("[v0] Error uploading image:", error)
    return { error: "Error al subir la imagen" }
  }
}
