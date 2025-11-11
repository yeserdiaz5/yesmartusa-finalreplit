# Solución: Problema de Rate Limit en Supabase Auth

## Problema Identificado

El cierre de sesión NO es causado por una mala configuración de cookies, sino por **exceder el límite de peticiones (rate limit)** de la API de autenticación de Supabase.

### Evidencia de los Logs

\`\`\`
[AuthApiError: Request rate limit reached] {
  __isAuthError: true,
  name: 'AuthApiError',
  status: 429,
  code: 'over_request_rate_limit'
}

[Middleware] Path: /
[Middleware] User: Not found  ← Después del rate limit, no encuentra al usuario
[Middleware] Cookies: sb-smvnarugddcdvhkfrffg-auth-token.0, sb-smvnarugddcdvhkfrffg-auth-token.1
\`\`\`

## Causa Raíz

1. La aplicación hace **muchas peticiones rápidas** (polling, revalidaciones automáticas, etc.)
2. Cada petición pasa por el middleware
3. El middleware llama a `supabase.auth.getUser()` en cada petición
4. Supabase tiene límites estrictos de rate limit en su tier gratuito
5. Al alcanzar el límite, `getUser()` falla y retorna `{ user: null }`
6. El middleware interpreta esto como "no autenticado" y redirige al login

## Límites de Supabase (Tier Gratuito)

- **Auth API**: ~60 requests por minuto por IP
- Cuando se excede: Status 429 "Request rate limit reached"
- Duración del bloqueo: ~1-5 minutos

## Soluciones

### Solución Inmediata (Temporal)

**Esperar 1-5 minutos** antes de volver a intentar. El rate limit se resetea automáticamente.

### Solución Permanente 1: Reducir Polling en el Frontend

Busca en el código del frontend cualquier:
- `useQuery` con `refetchInterval` muy corto
- Polling automático
- Revalidaciones frecuentes

\`\`\`typescript
// MALO - Hace demasiadas peticiones
useQuery({
  queryKey: ['/api/orders'],
  refetchInterval: 1000  // ¡Cada segundo!
})

// BUENO - Solo cuando es necesario
useQuery({
  queryKey: ['/api/orders'],
  refetchInterval: 30000,  // Cada 30 segundos
  refetchOnWindowFocus: false
})
\`\`\`

### Solución Permanente 2: Upgrade a Plan de Pago

El plan Pro de Supabase tiene límites mucho más altos:
- **Pro**: ~1000 requests por minuto
- Costo: ~$25/mes

### Solución Permanente 3: Caché en el Middleware

Implementar un caché simple para evitar llamadas repetidas a `getUser()`:

\`\`\`typescript
// lib/supabase/middleware.ts
const userCache = new Map<string, { user: any; expiry: number }>();

export async function updateSession(request: NextRequest) {
  // ... código existente ...

  // Intentar obtener del caché primero
  const cacheKey = request.cookies.get('sb-smvnarugddcdvhkfrffg-auth-token.0')?.value || 'anonymous';
  const cached = userCache.get(cacheKey);
  
  if (cached && Date.now() < cached.expiry) {
    // Usar usuario del caché (válido por 10 segundos)
    const user = cached.user;
  } else {
    // Llamar a la API solo si no hay caché
    const { data: { user } } = await supabase.auth.getUser();
    
    // Guardar en caché por 10 segundos
    userCache.set(cacheKey, {
      user,
      expiry: Date.now() + 10000
    });
  }
  
  // ... resto del código ...
}
\`\`\`

**NOTA**: Esta solución de caché puede tener efectos secundarios y debe probarse cuidadosamente.

## Recomendación Inmediata

1. **Para Desarrollo/Testing en Replit:**
   - Reducir el polling en el frontend
   - Aumentar `refetchInterval` en useQuery a 30+ segundos
   - Deshabilitar `refetchOnWindowFocus` donde no sea necesario

2. **Para Producción:**
   - Considerar upgrade a Supabase Pro ($25/mes)
   - O implementar caché en el middleware con cuidado
   - O usar Next.js App Router con Server Components (menos requests del cliente)

## Archivos a Revisar

Busca en estos archivos por `useQuery`, `refetchInterval`, y polling:

\`\`\`bash
grep -r "refetchInterval" client/
grep -r "useQuery" client/
grep -r "setInterval" client/
\`\`\`

---

**Fecha**: 30 de Octubre, 2025  
**Estado**: ✅ Problema identificado - Pendiente implementación de solución
