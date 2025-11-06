import { type NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"

// This is using Replit's AI Integrations service, which provides OpenAI-compatible API access without requiring your own OpenAI API key.
const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { productName, language = "en" } = body

    if (!productName || productName.trim() === "") {
      return NextResponse.json(
        { error: "Product name is required" },
        { status: 400 },
      )
    }

    console.log("[v0] Generating description for product:", productName, "in language:", language)

    // Generate description using OpenAI
    const prompt = language === "es" 
      ? `Genera una descripción atractiva y profesional de 2-3 oraciones para un producto llamado "${productName}". La descripción debe destacar las características principales, beneficios y por qué alguien querría comprarlo. Escribe en español y no uses emojis.`
      : `Generate an attractive and professional 2-3 sentence description for a product called "${productName}". The description should highlight key features, benefits, and why someone would want to buy it. Write in English and don't use emojis.`

    const response = await openai.chat.completions.create({
      model: "gpt-4o", // Using GPT-4o model (OpenAI's multimodal model available via Replit AI Integrations)
      messages: [{ role: "user", content: prompt }],
      max_completion_tokens: 300,
      temperature: 1,
    })

    const description = response.choices[0]?.message?.content || ""

    console.log("[v0] Generated description:", description)

    return NextResponse.json({ description })
  } catch (error) {
    console.error("[v0] Error generating description:", error)
    return NextResponse.json(
      { error: "Failed to generate description" },
      { status: 500 },
    )
  }
}
