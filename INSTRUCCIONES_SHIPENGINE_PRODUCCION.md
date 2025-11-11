# 🚀 Instrucciones para Activar Compra de Etiquetas en Producción

## El Problema
Tu marketplace muestra los transportistas y precios correctamente en producción, pero **NO compra etiquetas**. Esto es porque estás usando una **TEST API Key** de ShipEngine en producción.

## La Solución

### ✅ Paso 1: Obtener tu API Key de PRODUCCIÓN de ShipEngine

1. Ve a tu cuenta de ShipEngine: https://app.shipengine.com/
2. Navega a **Settings → API Keys**
3. Busca tu **PRODUCTION API Key** (NO la "Test" API Key)
4. Copia esa API Key

### ✅ Paso 2: Agregar la API Key de Producción en Vercel

1. Ve a tu proyecto en Vercel: https://vercel.com
2. Entra a tu proyecto **YesmartUSA**
3. Ve a **Settings → Environment Variables**
4. Agrega una NUEVA variable:
   - **Nombre**: `SHIPENGINE_PRODUCTION_API_KEY`
   - **Valor**: Pega la API Key de PRODUCCIÓN que copiaste
   - **Environments**: Marca **Production** (y opcionalmente Preview si quieres)
5. Click en **Save**

### ✅ Paso 3: Re-desplegar tu Aplicación

Después de agregar la variable de entorno, tienes que re-desplegar:

1. Ve a la pestaña **Deployments** en Vercel
2. Encuentra el último deployment
3. Click en los 3 puntos **"..."** → **Redeploy**
4. Confirma el redespliegue

**O** simplemente haz un `git push` para que se redespliegue automáticamente.

---

## 🔍 Cómo Funciona Ahora

El código ha sido actualizado para:

1. **Priorizar** la variable `SHIPENGINE_PRODUCTION_API_KEY` en producción
2. **Detectar automáticamente** si estás usando una TEST key e indicarlo
3. **Mostrar mensajes claros** si intentas comprar etiquetas con una TEST key

### Variables de Entorno

\`\`\`
SHIPENGINE_PRODUCTION_API_KEY  ← USAR EN PRODUCCIÓN (permite comprar etiquetas reales)
SHIPENGINE_API_KEY            ← USAR EN DESARROLLO (puede ser TEST key)
\`\`\`

---

## ✅ Verificar que Funciona

Después de redesplegar:

1. Ve a tu sitio en producción
2. Intenta comprar una etiqueta
3. Ahora debería funcionar correctamente
4. Si falla, revisa los logs de Vercel para ver el mensaje de error

---

## 🆘 Si Aún No Funciona

Verifica en los logs de Vercel:

- Busca el mensaje: `[ShipEngine] Using PRODUCTION API key`
  - ✅ Si lo ves → Bien, está usando la key correcta
  - ❌ Si ves "Using DEVELOPMENT API key" → La variable no está configurada

---

## 📝 Notas Importantes

- **TEST API Keys**: Solo sirven para ver transportistas y precios, pero NO compran etiquetas
- **PRODUCTION API Keys**: Son las únicas que pueden comprar etiquetas reales
- ShipEngine cobra por cada etiqueta comprada con la PRODUCTION key
- Asegúrate de tener fondos en tu cuenta de ShipEngine

---

## 🎯 Resumen Rápido

\`\`\`bash
# En Vercel Environment Variables:
SHIPENGINE_PRODUCTION_API_KEY = "tu-api-key-de-produccion-aqui"

# Luego redespliega tu app
\`\`\`

¡Eso es todo! Ahora tu marketplace podrá comprar etiquetas en producción. 🎉
