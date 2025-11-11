# Configuración de Stripe Dashboard para YesmartUSA

## 📋 URL de Producción
**Dominio principal:** `https://yesmartusa.com`

---

## 🔧 Configuración de Stripe Connect

### 1. Habilitar Stripe Connect
1. Ve a: https://dashboard.stripe.com/settings/connect
2. Haz clic en **"Get started"** si no lo has hecho
3. Completa tu información de plataforma

### 2. Configurar Redirect URLs
1. Ve a: https://dashboard.stripe.com/settings/connect
2. En la sección **"Redirect URIs"**, añade estas URLs:
   - `https://yesmartusa.com/onboarding/complete`
   - `https://yesmartusa.com/onboarding/refresh`

### 3. Configurar Branding (Obligatorio)
1. Ve a: https://dashboard.stripe.com/settings/connect/onboarding-interface
2. Completa:
   - **Platform icon**: Sube el logo de YesmartUSA
   - **Brand color**: Elige un color (#f97316 para naranja)
   - **Business name**: YesmartUSA

---

## 🔔 Configuración de Webhooks

### Webhook para Stripe Connect (Verificación de vendedores)
1. Ve a: https://dashboard.stripe.com/webhooks
2. Haz clic en **"Add endpoint"**
3. Configuración:
   - **URL**: `https://yesmartusa.com/api/stripe/webhook`
   - **Description**: Stripe Connect Events
   - **Events to send**:
     - `account.updated`
     - `account.application.deauthorized`
     - `capability.updated`
4. Copia el **Signing secret** (empieza con `whsec_...`)
5. Guárdalo en Replit Secrets como `STRIPE_WEBHOOK_SECRET`

### Webhook para Pagos (Checkout)
1. Ve a: https://dashboard.stripe.com/webhooks
2. Haz clic en **"Add endpoint"**
3. Configuración:
   - **URL**: `https://yesmartusa.com/api/webhooks/stripe`
   - **Description**: Checkout Events
   - **Events to send**:
     - `checkout.session.completed`
     - `payment_intent.succeeded`
     - `payment_intent.payment_failed`

---

## 🔑 Variables de Entorno Requeridas

En tu Replit, configura estos **Secrets**:

### Producción (Live Mode)
\`\`\`
APP_URL=https://yesmartusa.com
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
\`\`\`

### Modo Test (para desarrollo)
\`\`\`
APP_URL=https://yesmartusa.com
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
\`\`\`

---

## ✅ Checklist de Configuración

- [ ] Stripe Connect habilitado
- [ ] Redirect URIs añadidas (complete y refresh)
- [ ] Branding configurado (logo, color, nombre)
- [ ] Webhook de Connect creado y signing secret guardado
- [ ] Webhook de Checkout creado
- [ ] Variables de entorno configuradas en Replit
- [ ] Claves de producción (live) actualizadas
- [ ] Dominio `yesmartusa.com` configurado en DNS

---

## 🧪 Probar la Configuración

### 1. Verificar que APP_URL esté configurado
\`\`\`bash
# En Replit Shell
echo $APP_URL
# Debería mostrar: https://yesmartusa.com
\`\`\`

### 2. Probar el flujo de onboarding
1. Ve a: https://yesmartusa.com/seller
2. Haz clic en "Verificar con Stripe para vender"
3. Completa el formulario de Stripe
4. Deberías ser redirigido a: https://yesmartusa.com/onboarding/complete

### 3. Verificar webhooks
1. Ve a: https://dashboard.stripe.com/webhooks
2. Haz clic en tu webhook
3. En la pestaña **"Testing"**, haz clic en **"Send test webhook"**
4. Selecciona `account.updated` y envía
5. Verifica que llegue a tu aplicación (revisa logs)

---

## 🚨 Troubleshooting

### Error: "Redirect URI not registered"
- Verifica que las URLs en Stripe Dashboard sean exactamente:
  - `https://yesmartusa.com/onboarding/complete`
  - `https://yesmartusa.com/onboarding/refresh`
- **NO incluyas** `www.` ni trailing slashes

### Error: "Webhook signature verification failed"
- Verifica que `STRIPE_WEBHOOK_SECRET` esté configurado correctamente
- Asegúrate de usar el secret del webhook correcto (Connect vs Checkout)

### Error: "Connection refused"
- Verifica que tu app esté publicada en producción
- Stripe Connect requiere URLs HTTPS públicas (no funciona con localhost)

---

## 📞 Soporte

Si tienes problemas:
1. Revisa los logs de Stripe: https://dashboard.stripe.com/logs
2. Revisa los logs de webhooks: https://dashboard.stripe.com/webhooks
3. Contacta a Stripe Support: https://support.stripe.com
