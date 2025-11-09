/**
 * Script to sync all existing products with images to Pinecone
 * 
 * This script:
 * 1. Fetches all products with images from Supabase
 * 2. Generates CLIP embeddings for each product image using Hugging Face
 * 3. Upserts embeddings to Pinecone index (yesmart-images)
 * 
 * Run with: npx tsx scripts/sync-products-to-pinecone.ts
 */

import { createClient } from "@supabase/supabase-js"
import { generateImageEmbeddingFromUrl } from "../lib/huggingface"
import { batchUpsertProductEmbeddings } from "../lib/pinecone"

async function syncProductsToPinecone() {
  try {
    // Initialize Supabase admin client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Supabase credentials not configured")
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    console.log("[Sync] Fetching products from Supabase...")

    // Fetch all products with images
    const { data: products, error } = await supabase
      .from("products")
      .select("id, title, image_url, images")
      .not("image_url", "is", null)

    if (error) {
      throw error
    }

    console.log(`[Sync] Found ${products?.length || 0} products with images`)

    if (!products || products.length === 0) {
      console.log("[Sync] No products to sync")
      return
    }

    // Process products in batches to avoid rate limits
    const batchSize = 5
    const totalProducts = products.length
    let processedCount = 0
    let successCount = 0
    let failedCount = 0

    for (let i = 0; i < totalProducts; i += batchSize) {
      const batch = products.slice(i, i + batchSize)
      console.log(`\n[Sync] Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(totalProducts / batchSize)}`)

      const embeddingsToUpsert: Array<{ id: string; embedding: number[]; metadata: any }> = []

      for (const product of batch) {
        try {
          processedCount++
          console.log(`[${processedCount}/${totalProducts}] Processing: ${product.title}`)

          // Use the primary image URL
          const imageUrl = product.image_url
          
          if (!imageUrl) {
            console.log(`  ⚠️  Skipping (no image URL)`)
            failedCount++
            continue
          }

          // Generate embedding
          const embedding = await generateImageEmbeddingFromUrl(imageUrl)

          if (!embedding) {
            console.log(`  ❌ Failed to generate embedding`)
            failedCount++
            continue
          }

          embeddingsToUpsert.push({
            id: product.id,
            embedding,
            metadata: {
              title: product.title,
              image_url: imageUrl,
            },
          })

          console.log(`  ✅ Generated ${embedding.length}-dimensional embedding`)
          successCount++

          // Add delay to avoid rate limiting (Hugging Face free tier has limits)
          await new Promise(resolve => setTimeout(resolve, 1000))
        } catch (error) {
          console.error(`  ❌ Error processing ${product.title}:`, error)
          failedCount++
        }
      }

      // Batch upsert to Pinecone
      if (embeddingsToUpsert.length > 0) {
        console.log(`[Sync] Upserting ${embeddingsToUpsert.length} embeddings to Pinecone...`)
        const success = await batchUpsertProductEmbeddings(embeddingsToUpsert)
        
        if (success) {
          console.log(`✅ Successfully upserted batch to Pinecone`)
        } else {
          console.error(`❌ Failed to upsert batch to Pinecone`)
        }
      }

      // Add delay between batches
      if (i + batchSize < totalProducts) {
        console.log("Waiting 2 seconds before next batch...")
        await new Promise(resolve => setTimeout(resolve, 2000))
      }
    }

    console.log(`\n[Sync] Sync completed!`)
    console.log(`  Total products: ${totalProducts}`)
    console.log(`  Successfully synced: ${successCount}`)
    console.log(`  Failed: ${failedCount}`)
  } catch (error) {
    console.error("[Sync] Fatal error:", error)
    process.exit(1)
  }
}

// Run the sync
syncProductsToPinecone()
  .then(() => {
    console.log("\n✅ Sync process completed successfully")
    process.exit(0)
  })
  .catch((error) => {
    console.error("\n❌ Sync process failed:", error)
    process.exit(1)
  })
