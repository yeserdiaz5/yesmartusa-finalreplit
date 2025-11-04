import { Octokit } from '@octokit/rest'

let connectionSettings;

async function getAccessToken() {
  if (connectionSettings && connectionSettings.settings.expires_at && new Date(connectionSettings.settings.expires_at).getTime() > Date.now()) {
    return connectionSettings.settings.access_token;
  }
  
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=github',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  const accessToken = connectionSettings?.settings?.access_token || connectionSettings.settings?.oauth?.credentials?.access_token;

  if (!connectionSettings || !accessToken) {
    throw new Error('GitHub not connected');
  }
  return accessToken;
}

async function getGitHubClient() {
  const accessToken = await getAccessToken();
  return new Octokit({ auth: accessToken });
}

async function createPullRequest() {
  try {
    const octokit = await getGitHubClient();
    
    const owner = 'yeserdiaz5';
    const repo = 'YesmartUSA';
    const branchName = 'stripe-checkout-simplified';
    const baseBranch = 'main';
    
    console.log('🔍 Getting base branch reference...');
    const { data: baseRef } = await octokit.git.getRef({
      owner,
      repo,
      ref: `heads/${baseBranch}`,
    });
    
    console.log('✅ Base branch SHA:', baseRef.object.sha);
    
    console.log('🌿 Creating new branch...');
    try {
      await octokit.git.createRef({
        owner,
        repo,
        ref: `refs/heads/${branchName}`,
        sha: baseRef.object.sha,
      });
      console.log('✅ Branch created:', branchName);
    } catch (error) {
      if (error.status === 422) {
        console.log('⚠️ Branch already exists, using existing branch');
      } else {
        throw error;
      }
    }
    
    console.log('📝 Creating Pull Request...');
    const { data: pr } = await octokit.pulls.create({
      owner,
      repo,
      title: 'feat: Simplify checkout - Stripe collects all user information',
      head: branchName,
      base: baseBranch,
      body: `## 🎯 Objetivo
Simplificar el flujo de checkout delegando toda la recolección de información del usuario (pago + dirección de envío) a Stripe Checkout.

## ✨ Cambios Principales

### 1. **Checkout Simplificado** (\`app/checkoutplus/checkout-client.tsx\`)
- ❌ Eliminado formulario largo de datos de envío
- ✅ Ahora solo muestra resumen del carrito y botón de pago
- ✅ Stripe maneja toda la información del usuario

### 2. **Stripe Session Mejorado** (\`app/actions/stripe.ts\`)
- ✅ Agregado \`shipping_address_collection\` con 14 países soportados
- ✅ Nueva función \`updateOrderWithShippingAddress()\` que guarda la dirección de Stripe
- ✅ Dirección de envío se actualiza automáticamente después del pago exitoso

### 3. **Descripciones de Productos Mejoradas**
- ✅ Endpoint \`/api/update-product-descriptions\` para actualizar descripciones automáticamente
- ✅ Endpoint \`/api/list-products\` para listar productos
- ✅ Descripciones profesionales específicas para cada tipo de producto
- ✅ UI mejorada en página de detalles con sección destacada

### 4. **Success Page Actualizada** (\`app/checkoutplus/success/page.tsx\`)
- ✅ Guarda automáticamente la dirección de envío desde Stripe session
- ✅ Actualiza el estado de la orden a "paid"

## 🌍 Países Soportados para Envío
US, CA, MX, GB, AU, ES, FR, DE, IT, BR, AR, CL, CO, PE

## 🔧 Archivos Modificados
- \`app/actions/stripe.ts\` - Lógica de Stripe y dirección de envío
- \`app/checkoutplus/checkout-client.tsx\` - UI de checkout simplificada
- \`app/checkoutplus/success/page.tsx\` - Guardar dirección después del pago
- \`app/productdes/[id]/product-detail-client.tsx\` - Mejorada sección de descripción
- \`app/api/update-product-descriptions/route.ts\` - Nuevo endpoint
- \`app/api/list-products/route.ts\` - Nuevo endpoint

## ✅ Beneficios
1. **Experiencia de usuario mejorada** - Menos campos para llenar
2. **Mayor seguridad** - Stripe maneja toda la información sensible
3. **Internacionalización** - Soporte para 14 países
4. **Checkout más rápido** - Un clic para ir a pago
5. **Descripciones profesionales** - Productos mejor presentados

## 🧪 Testing
- [x] Flujo de pago como invitado
- [x] Flujo de pago como usuario registrado
- [x] Guardado de dirección de envío
- [x] Actualización de estado de orden
- [x] Descripciones de productos

## 📝 Notas para Deployment
- Las claves de Stripe ya están configuradas en variables de entorno
- No se requieren cambios en la base de datos
- Listo para hacer merge y deployment`,
    });
    
    console.log('✅ Pull Request created successfully!');
    console.log('🔗 PR URL:', pr.html_url);
    console.log('📊 PR Number:', pr.number);
    
    return pr;
  } catch (error) {
    console.error('❌ Error creating PR:', error.message);
    if (error.status) {
      console.error('Status:', error.status);
    }
    if (error.response?.data) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
    throw error;
  }
}

createPullRequest();
