import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// Helper function to generate good product descriptions
function generateDescription(title: string, category: string | null): string {
  const lowerTitle = title.toLowerCase()
  
  // Automotive/Car Accessories
  if (lowerTitle.includes('valve') || lowerTitle.includes('cap') || lowerTitle.includes('flag')) {
    return `Tapas de válvula decorativas con bandera de Estados Unidos. Set de 4 piezas fabricadas en metal de alta calidad y resistente a la corrosión. Fáciles de instalar, agregan un toque patriótico a tu vehículo. Compatible con la mayoría de válvulas estándar. Perfectas para personalizar tu auto, moto o bicicleta.`
  }
  
  // Clothing - Caps/Hats
  if (lowerTitle.includes('gorra') || lowerTitle.includes('cap') || lowerTitle.includes('hat')) {
    return `Gorra de excelente calidad y estilo casual. Diseño ajustable con cierre trasero para adaptarse a cualquier tamaño de cabeza. Tela transpirable y resistente, perfecta para protegerte del sol. Ideal para uso diario, deportes al aire libre o actividades recreativas. Un accesorio versátil que combina con cualquier outfit.`
  }
  
  // Women's Leggings/Pants
  if (lowerTitle.includes('licra') || lowerTitle.includes('legging') || lowerTitle.includes('acampana')) {
    return `Licras de mujer con diseño acampanado y elegante. Fabricadas en tela elástica de alta calidad que se adapta perfectamente a tu cuerpo. Cintura alta para mayor comodidad y soporte. Color negro versátil que combina con todo tu guardarropa. Ideales para yoga, gym, running o uso casual. Resistentes al desgaste y mantienen su forma después de múltiples lavados.`
  }
  
  // Intimate/Personal Care Products
  if (lowerTitle.includes('pezonera') || lowerTitle.includes('nipple')) {
    return `Pezoneras de silicona médica hipoalergénica, diseñadas para máxima comodidad y discreción. Suaves al tacto, reutilizables y fáciles de limpiar. Se adhieren perfectamente sin causar irritación. Ideales para usar bajo cualquier tipo de ropa. Incluyen estuche de almacenamiento higiénico. Perfectas para uso diario o eventos especiales donde necesites mayor confianza y comodidad.`
  }
  
  // Electronics
  if (lowerTitle.includes('laptop') || lowerTitle.includes('computador')) {
    return `${title} de alto rendimiento. Perfecto para trabajo, estudio y entretenimiento. Procesador potente, diseño elegante y larga duración de batería. Incluye garantía del fabricante.`
  }
  if (lowerTitle.includes('phone') || lowerTitle.includes('teléfono') || lowerTitle.includes('celular')) {
    return `${title} con tecnología de última generación. Cámara de alta resolución, pantalla vibrante y batería de larga duración. Perfecto para mantenerte conectado todo el día.`
  }
  
  // Clothing - General
  if (lowerTitle.includes('shirt') || lowerTitle.includes('camisa') || lowerTitle.includes('playera')) {
    return `${title} de alta calidad y comodidad. Tela suave y duradera, corte moderno. Perfecta para uso diario o ocasiones especiales.`
  }
  if (lowerTitle.includes('pant') || lowerTitle.includes('pantalón') || lowerTitle.includes('jean')) {
    return `${title} con estilo y comodidad. Ajuste perfecto, tela resistente. Ideal para cualquier ocasión.`
  }
  
  // Home & Kitchen
  if (lowerTitle.includes('coffee') || lowerTitle.includes('café')) {
    return `${title} para preparar el café perfecto en casa. Fácil de usar, resultados profesionales. Disfruta de tu bebida favorita cada mañana.`
  }
  if (lowerTitle.includes('blender') || lowerTitle.includes('licuadora')) {
    return `${title} potente y versátil. Motor de alto rendimiento, múltiples velocidades. Ideal para smoothies, salsas y más.`
  }
  if (lowerTitle.includes('chair') || lowerTitle.includes('silla')) {
    return `${title} ergonómica y cómoda. Diseño moderno, materiales de calidad. Perfecta para tu hogar u oficina.`
  }
  if (lowerTitle.includes('table') || lowerTitle.includes('mesa')) {
    return `${title} resistente y elegante. Acabado de calidad, fácil de limpiar. Perfecta para comedor, cocina u oficina.`
  }
  
  // Sports & Fitness
  if (lowerTitle.includes('bike') || lowerTitle.includes('bicicleta')) {
    return `${title} de alta calidad. Estructura resistente, componentes duraderos. Perfecta para ejercicio, transporte o recreación.`
  }
  if (lowerTitle.includes('yoga') || lowerTitle.includes('fitness')) {
    return `${title} para tu rutina de ejercicio. Material de calidad, fácil de usar. Alcanza tus metas de fitness.`
  }
  
  // Toys & Games
  if (lowerTitle.includes('toy') || lowerTitle.includes('juguete') || lowerTitle.includes('game') || lowerTitle.includes('juego')) {
    return `${title} divertido y entretenido. Estimula la creatividad y el aprendizaje. Perfecto para niños y toda la familia.`
  }
  
  // Books
  if (lowerTitle.includes('book') || lowerTitle.includes('libro')) {
    return `${title}. Una lectura fascinante que te atrapará desde la primera página. Perfecto para amantes de la literatura.`
  }
  
  // Beauty & Personal Care
  if (lowerTitle.includes('cream') || lowerTitle.includes('crema') || lowerTitle.includes('lotion')) {
    return `${title} de calidad premium. Fórmula suave y efectiva, ingredientes naturales. Cuida tu piel con lo mejor.`
  }
  if (lowerTitle.includes('perfume') || lowerTitle.includes('fragrance')) {
    return `${title} con aroma cautivador. Fragancia duradera y elegante. Perfecto para uso diario o ocasiones especiales.`
  }
  
  // Default for any other product
  return `${title} de excelente calidad. Producto confiable y duradero, diseñado para satisfacer tus necesidades. Garantía de satisfacción incluida. ¡Adquiérelo ahora y disfruta de la mejor experiencia!`
}

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get all products
    const { data: products, error: fetchError } = await supabase
      .from("products")
      .select("id, title, description, category")
      .order("created_at", { ascending: false })
    
    if (fetchError) {
      return NextResponse.json(
        { success: false, error: fetchError.message },
        { status: 500 }
      )
    }
    
    if (!products || products.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No hay productos en la base de datos",
        updated: 0,
      })
    }
    
    // Find products without description OR with very short descriptions (less than 50 characters)
    const productsNeedingDescription = products.filter(
      (p) => !p.description || p.description.trim() === "" || p.description.trim().length < 50
    )
    
    console.log(`[UPDATE DESCRIPTIONS] Total products: ${products.length}`)
    console.log(`[UPDATE DESCRIPTIONS] Products needing description: ${productsNeedingDescription.length}`)
    
    // Update each product without description
    let updated = 0
    const updates = []
    
    for (const product of productsNeedingDescription) {
      const newDescription = generateDescription(product.title, product.category)
      
      updates.push({
        id: product.id,
        title: product.title,
        oldDescription: product.description,
        newDescription: newDescription,
      })
      
      const { error: updateError } = await supabase
        .from("products")
        .update({ 
          description: newDescription,
          updated_at: new Date().toISOString()
        })
        .eq("id", product.id)
      
      if (updateError) {
        console.error(`[UPDATE DESCRIPTIONS] Error updating ${product.title}:`, updateError)
      } else {
        updated++
        console.log(`[UPDATE DESCRIPTIONS] ✓ Updated: ${product.title}`)
      }
    }
    
    return NextResponse.json({
      success: true,
      message: `Actualizados ${updated} productos de ${productsNeedingDescription.length} que necesitaban descripción`,
      totalProducts: products.length,
      productsWithoutDescription: productsNeedingDescription.length,
      updated: updated,
      updates: updates,
    })
    
  } catch (error) {
    console.error("[UPDATE DESCRIPTIONS] Error:", error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Error desconocido" 
      },
      { status: 500 }
    )
  }
}
