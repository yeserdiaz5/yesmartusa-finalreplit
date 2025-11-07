# Configuración de Stripe Connect en Modo LIVE

## 🚨 Problema Común

Al cambiar de claves TEST a claves LIVE, las cuentas de Stripe Connect creadas anteriormente **no existen en el entorno LIVE**. Esto causa el error:

```
You requested an account link for an account that is not connected to your platform or does not exist.
```

## ✅ Solución

### Paso 1: Habilitar Stripe Connect en Modo LIVE

1. Ve a: https://dashboard.stripe.com/settings/connect
2. **Asegúrate de estar en modo LIVE** (toggle arriba a la derecha debe decir "Viewing live data")
3. Si no has habilitado Connect en LIVE, haz clic en **"Get started"**
4. Completa el formulario de aplicación de plataforma:
   - **Platform name**: YesmartUSA
   - **Platform website**: https://yesmartusa.com
   - **Support email**: tu-email@yesmartusa.com
   - **Description**: E-commerce marketplace platform

### Paso 2: Configurar Redirect URIs (Modo LIVE)

1. Asegúrate de estar en modo LIVE
2. En la sección **"Redirect URIs"**, añade:
   ```
   https://yesmartusa.com/onboarding/complete
   https://yesmartusa.com/onboarding/refresh
   ```

### Paso 3: Configurar Branding

1. Ve a: https://dashboard.stripe.com/settings/connect/onboarding-interface
2. Asegúrate de estar en modo LIVE
3. Configura:
   - **Platform icon**: Logo de YesmartUSA
   - **Brand color**: #f97316 (naranja)
   - **Business name**: YesmartUSA

### Paso 4: Limpiar Cuentas TEST de la Base de Datos

Las cuentas creadas con claves TEST no funcionan con claves LIVE. Necesitas limpiarlas.

**Opción A: Limpiar desde el panel de debug**
1. Ve a: `tu-app/debug/clear-stripe-accounts`
2. Haz clic en "Limpiar Cuentas de Stripe TEST"

**Opción B: Limpiar manualmente desde Supabase**
1. Ve a tu Supabase Dashboard
2. Abre la tabla `users`
3. Ejecuta esta query SQL:
   ```sql
   UPDATE users 
   SET stripe_connect_account_id = NULL, 
       stripe_account_verified = false 
   WHERE stripe_connect_account_id IS NOT NULL;
   ```

### Paso 5: Probar el Flujo Completo

1. Cierra sesión y vuelve a iniciar sesión en tu app
2. Ve a `/seller`
3. Haz clic en "Verificar con Stripe para vender"
4. Ahora se creará una nueva cuenta en el entorno LIVE de Stripe

## ⚠️ Diferencias Entre TEST y LIVE

| Característica | TEST Mode | LIVE Mode |
|----------------|-----------|-----------|
| Cuentas Connect | Separadas | Separadas |
| Verificación | 5-15 minutos | 24-48 horas |
| Pagos | Ficticios | Reales |
| Webhooks | Requieren túnel | URL pública |

## 🔐 Verificación de Claves

Para verificar que estás usando claves LIVE:

1. Ve a: `/debug/test-stripe-connection`
2. Debe decir: **"✅ MODO PRODUCCIÓN (LIVE)"**
3. Las claves deben empezar con:
   - `sk_live_...`
   - `pk_live_...`

## ❓ Preguntas Frecuentes

**P: ¿Por qué no funcionan las cuentas que creé en TEST?**
R: TEST y LIVE son entornos completamente separados en Stripe. Las cuentas creadas en uno no existen en el otro.

**P: ¿Perderé las cuentas al limpiar la base de datos?**
R: Solo limpiarás las referencias a cuentas TEST que ya no existen. Los usuarios crearán nuevas cuentas LIVE.

**P: ¿Cuánto tarda la verificación en LIVE?**
R: En modo LIVE, Stripe puede tardar 24-48 horas en verificar una cuenta. En TEST tarda 5-15 minutos.

**P: ¿Necesito webhooks diferentes para LIVE?**
R: Sí, debes crear webhooks separados en modo LIVE y copiar el signing secret LIVE a `STRIPE_WEBHOOK_SECRET`.

## 📞 Soporte

Si tienes problemas:
1. Verifica los logs de Stripe: https://dashboard.stripe.com/logs
2. Verifica que Connect esté habilitado en LIVE
3. Verifica que las Redirect URIs estén configuradas en LIVE
4. Contacta a Stripe Support: https://support.stripe.com
