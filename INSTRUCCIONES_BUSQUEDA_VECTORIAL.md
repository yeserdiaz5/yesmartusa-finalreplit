# Instrucciones para Implementar Búsqueda por Imágenes con Embeddings Vectoriales

## 🎯 Resumen
Se ha implementado un sistema de búsqueda por imágenes usando embeddings vectoriales de OpenAI, similar a Amazon y Alibaba. Este sistema usa PostgreSQL con la extensión pgvector para búsqueda semántica basada en similitud visual.

## 📋 Pasos de Configuración

### 1. Ejecutar Scripts SQL en Supabase

Debes ejecutar estos scripts **en orden** en el SQL Editor de Supabase:

#### Paso 1.1: Habilitar pgvector y agregar columna embedding
```sql
-- scripts/019_enable_pgvector_for_image_search.sql
```
Ve al archivo `scripts/019_enable_pgvector_for_image_search.sql`, copia todo el contenido y pégalo en el SQL Editor de Supabase. Ejecuta el script.

#### Paso 1.2: Crear función de búsqueda vectorial
```sql
-- scripts/020_create_vector_search_function.sql
```
Ve al archivo `scripts/020_create_vector_search_function.sql`, copia todo el contenido y pégalo en el SQL Editor de Supabase. Ejecuta el script.

### 2. Generar Embeddings para Productos Existentes

Tienes **dos opciones** para generar embeddings de tus productos existentes:

#### Opción A: Usar el endpoint API (Recomendado)
1. Ve a tu navegador
2. Abre las herramientas de desarrollo (F12)
3. Ve a la consola y ejecuta:
```javascript
fetch('/api/generate-embeddings', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ limit: 10 })
}).then(r => r.json()).then(console.log)
```
4. Repite este comando varias veces cambiando el `limit` hasta que todos los productos tengan embeddings

#### Opción B: Usar el script de Node.js
1. Abre una terminal en Replit
2. Ejecuta:
```bash
npx tsx scripts/generate-product-embeddings.ts
```

### 3. ✅ Verificación

Para verificar que todo funciona:

1. **Verifica que la columna embedding existe:**
   - Ve a Supabase > Table Editor > products
   - Verifica que existe la columna `embedding`

2. **Verifica que la función RPC existe:**
   - Ve a Supabase > SQL Editor
   - Ejecuta: `SELECT * FROM match_products_by_image(NULL, 0.70, 10);`
   - Debe retornar sin error (aunque esté vacío)

3. **Prueba la búsqueda por imagen:**
   - Ve a tu marketplace
   - Haz clic en "Search by Image"
   - Sube una imagen de un producto
   - Deberías ver productos similares

## 🔄 Funcionamiento Automático

Una vez configurado, el sistema funciona automáticamente:

1. ✅ **Al crear un producto**: Se genera el embedding automáticamente en segundo plano
2. ✅ **Al actualizar una imagen**: Se regenera el embedding automáticamente
3. ✅ **Al buscar por imagen**: Se usa búsqueda vectorial para encontrar productos similares

## 📊 Costos Estimados (OpenAI)

El sistema usa dos llamadas API por cada producto:

1. **GPT-4o Vision** (análisis de imagen): ~$0.003 por imagen
2. **text-embedding-3-small** (generación de embedding): ~$0.00002 por descripción

**Costos totales aproximados:**
- **Por producto nuevo**: ~$0.003 (una sola vez al crear/actualizar)
- **Para 1000 productos**: Aproximadamente $3.00-$3.50 (una sola vez)
- **Búsquedas**: ~$0.003 por búsqueda (GPT-4o Vision + embedding)

**Nota:** text-embedding-3-small es más económico y rápido que text-embedding-3-large, con calidad muy similar para este caso de uso.

## 🆚 Diferencias con el Sistema Anterior

### Sistema Anterior (GPT-4o Vision):
- ❌ Analiza la imagen con IA
- ❌ Extrae palabras clave
- ❌ Busca por texto en título/descripción
- ❌ Menos preciso para similitud visual

### Sistema Nuevo (Embeddings Vectoriales Híbridos):
- ✅ **Paso 1:** GPT-4o Vision genera una descripción detallada de la imagen
- ✅ **Paso 2:** text-embedding-3-small crea un vector semántico de la descripción (1536 dimensiones)
- ✅ Búsqueda por similitud matemática (coseno) en espacio vectorial
- ✅ Mucho más preciso para encontrar productos visualmente similares
- ✅ Captura tanto características visuales como semánticas
- ✅ Funciona de manera similar a Amazon y Alibaba

## 🔧 Archivos Creados/Modificados

### Nuevos Archivos:
- `scripts/019_enable_pgvector_for_image_search.sql` - Habilita pgvector
- `scripts/020_create_vector_search_function.sql` - Crea función RPC
- `scripts/generate-product-embeddings.ts` - Script para generar embeddings
- `app/api/search-by-image-vector/route.ts` - Endpoint de búsqueda vectorial
- `app/api/generate-embeddings/route.ts` - Endpoint para generar embeddings
- `app/api/products/[productId]/generate-embedding/route.ts` - Generar embedding de un producto
- `lib/embeddings.ts` - Utilidades para embeddings
- `INSTRUCCIONES_BUSQUEDA_VECTORIAL.md` - Este archivo

### Archivos Modificados:
- `app/actions/products.ts` - Agregada generación automática de embeddings
- `app/buyer-homepage-client.tsx` - Actualizado para usar búsqueda vectorial

## ❓ Solución de Problemas

### Error: "pgvector extension not found"
- Solución: Ejecuta el script `019_enable_pgvector_for_image_search.sql`

### Error: "function match_products_by_image does not exist"
- Solución: Ejecuta el script `020_create_vector_search_function.sql`

### No encuentra productos similares
- Solución: Ejecuta el endpoint `/api/generate-embeddings` para generar embeddings

### Error: "OPENAI_API_KEY not configured"
- Solución: Verifica que tu API key de OpenAI esté configurada en Secrets

## 📞 Soporte

Si tienes problemas, revisa los logs en:
- Consola del navegador (F12)
- Logs del servidor en Replit
- Logs de Supabase en el Dashboard
