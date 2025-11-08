/**
 * Script to generate embeddings for existing products
 * This script processes products that don't have embeddings yet
 * and generates them using OpenAI's text-embedding-3-small model (1536 dimensions)
 * 
 * Usage: npx tsx scripts/generate-product-embeddings.ts
 */

import OpenAI from "openai"
import { createClient } from "@supabase/supabase-js"

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const OPENAI_API_KEY = process.env.OPENAI_API_KEY!

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("❌ Missing Supabase credentials")
  console.error("Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY")
  process.exit(1)
}

if (!OPENAI_API_KEY) {
  console.error("❌ Missing OPENAI_API_KEY")
  process.exit(1)
}

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
})

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

async function generateEmbeddings() {
  console.log("🚀 Starting embedding generation process...")

  // Fetch all products without embeddings
  const { data: products, error: fetchError } = await supabase
    .from("products")
    .select("id, title, image_url, images")
    .is("embedding", null)
    .eq("is_active", true)

  if (fetchError) {
    console.error("❌ Error fetching products:", fetchError)
    return
  }

  if (!products || products.length === 0) {
    console.log("✅ All active products already have embeddings!")
    return
  }

  console.log(`📦 Found ${products.length} products without embeddings`)

  let successCount = 0
  let errorCount = 0

  for (let i = 0; i < products.length; i++) {
    const product = products[i]
    console.log(`\n[${i + 1}/${products.length}] Processing: ${product.title}`)

    try {
      // Get the main image URL (prefer image_url, fallback to first image in images array)
      const imageUrl = product.image_url || product.images?.[0]

      if (!imageUrl) {
        console.log(`  ⚠️  No image found, skipping...`)
        errorCount++
        continue
      }

      console.log(`  📥 Fetching image from: ${imageUrl}`)

      // Fetch the image
      const imageResponse = await fetch(imageUrl)
      if (!imageResponse.ok) {
        console.log(`  ❌ Failed to fetch image: ${imageResponse.statusText}`)
        errorCount++
        continue
      }

      const arrayBuffer = await imageResponse.arrayBuffer()
      const base64Image = Buffer.from(arrayBuffer).toString("base64")
      const dataUrl = `data:image/jpeg;base64,${base64Image}`

      console.log(`  🔍 Analyzing image with GPT-4o Vision...`)

      // Step 1: Use GPT-4o Vision to generate detailed description
      const visionResponse = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Analyze this product image in detail. Provide a comprehensive description that captures:
1. Product type and category
2. Visual characteristics (color, shape, material, texture, design)
3. Brand or distinguishing marks if visible
4. Condition and quality indicators
5. Key features and details that make this product unique
6. Any text, logos, or patterns visible
7. Overall style and aesthetic

Generate a detailed, keyword-rich description that will help find visually similar products. Focus on objective visual features rather than subjective opinions.`,
              },
              {
                type: "image_url",
                image_url: { url: dataUrl },
              },
            ],
          },
        ],
        max_tokens: 500,
      })

      const imageDescription = visionResponse.choices[0]?.message?.content

      if (!imageDescription) {
        console.log(`  ❌ Failed to generate image description`)
        errorCount++
        continue
      }

      console.log(`  📝 Description: ${imageDescription.substring(0, 80)}...`)
      console.log(`  🧠 Generating embedding from description...`)

      // Step 2: Generate embedding from the textual description
      const embeddingResponse = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: imageDescription,
        encoding_format: "float",
      })

      const embedding = embeddingResponse.data[0].embedding

      if (!embedding || embedding.length !== 1536) {
        console.log(`  ❌ Invalid embedding generated`)
        errorCount++
        continue
      }

      console.log(`  💾 Saving embedding to database...`)

      // Update product with embedding
      const { error: updateError } = await supabase
        .from("products")
        .update({ embedding: embedding })
        .eq("id", product.id)

      if (updateError) {
        console.log(`  ❌ Error updating product: ${updateError.message}`)
        errorCount++
        continue
      }

      console.log(`  ✅ Embedding generated successfully!`)
      successCount++

      // Add a delay to avoid rate limits (longer delay due to two API calls per product)
      await new Promise((resolve) => setTimeout(resolve, 1000))
    } catch (error) {
      console.log(`  ❌ Error processing product: ${error instanceof Error ? error.message : "Unknown error"}`)
      errorCount++
    }
  }

  console.log("\n" + "=".repeat(50))
  console.log("📊 SUMMARY")
  console.log("=".repeat(50))
  console.log(`✅ Success: ${successCount}`)
  console.log(`❌ Errors: ${errorCount}`)
  console.log(`📦 Total: ${products.length}`)
  console.log("=".repeat(50))
}

// Run the script
generateEmbeddings()
  .then(() => {
    console.log("\n✨ Embedding generation complete!")
    process.exit(0)
  })
  .catch((error) => {
    console.error("\n💥 Fatal error:", error)
    process.exit(1)
  })
