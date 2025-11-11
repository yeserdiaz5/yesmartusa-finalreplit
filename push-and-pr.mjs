import { Octokit } from '@octokit/rest'
import { execSync } from 'child_process'

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

async function pushAndCreatePR() {
  try {
    const accessToken = await getAccessToken();
    const octokit = new Octokit({ auth: accessToken });
    
    const owner = 'yeserdiaz5';
    const repo = 'YesmartUSA';
    const branchName = `fix/password-reset-flow`;
    const baseBranch = 'main';
    
    console.log('🔧 Configuring git remote...');
    try {
      execSync(`git remote remove github 2>/dev/null || true`);
      execSync(`git remote add github https://x-access-token:${accessToken}@github.com/${owner}/${repo}.git`);
    } catch (e) {
      console.log('Remote configuration done');
    }
    
    console.log('📤 Pushing to GitHub...');
    try {
      execSync(`git push github HEAD:${branchName} --force`, { stdio: 'inherit' });
      console.log('✅ Pushed successfully');
    } catch (error) {
      console.error('❌ Push failed:', error.message);
      throw error;
    }
    
    console.log('📝 Creating Pull Request...');
    const { data: pr } = await octokit.pulls.create({
      owner,
      repo,
      title: 'fix: Password reset flow - Handle recovery tokens in callback',
      head: branchName,
      base: baseBranch,
      body: `## 🐛 Problema Resuelto
El flujo de restablecimiento de contraseña estaba redirigiendo a la página principal en lugar de la página de actualización de contraseña.

## 🔧 Cambios Realizados

### 1. **Auth Callback Mejorado** (\`app/auth/callback/route.ts\`)
- ✅ Detecta tokens de recuperación de contraseña (\`token_hash\` + \`type=recovery\`)
- ✅ Maneja correctamente el flujo de password reset vs OAuth
- ✅ Redirecciona apropiadamente a \`/auth/update-password\` para resets
- ✅ Agregados logs para debugging del flujo

### 2. **Base URL Corregido** (\`lib/utils/get-base-url.ts\`)
- ✅ Siempre usa el dominio de producción (yesmartusa.com)
- ✅ Previene redirecciones a dominios de desarrollo

### 3. **Logs de Debug** (\`app/auth/confirm/route.ts\`)
- ✅ Agregados logs detallados para rastrear el flujo de confirmación
- ✅ Mejor manejo de errores

## 📋 Flujo Corregido
1. Usuario solicita reset en \`/auth/reset-password\`
2. Email se envía con link a \`/auth/callback\` (o \`/auth/confirm\`)
3. Callback detecta \`type=recovery\` y verifica el token
4. ✅ **AHORA**: Redirecciona a \`/auth/update-password\` 
5. Usuario ingresa nueva contraseña

## 🧪 Testing Requerido
- [ ] Solicitar reset de contraseña desde producción
- [ ] Verificar que el email contiene link correcto
- [ ] Hacer clic en link y verificar redirección a update-password
- [ ] Completar cambio de contraseña

## ⚙️ Configuración Requerida en Supabase
Asegurarse que en **Supabase Dashboard → Authentication → URL Configuration**:
- **Site URL**: \`https://yesmartusa.com\` (sin wildcard)
- **Redirect URLs**: 
  - \`https://yesmartusa.com/auth/callback\`
  - \`https://yesmartusa.com/auth/confirm\`
  - \`https://www.yesmartusa.com/**\`
  - \`https://yesmartusa.com/**\`

## 📁 Archivos Modificados
- \`app/auth/callback/route.ts\` - Manejo de recovery tokens
- \`app/auth/confirm/route.ts\` - Logs mejorados
- \`lib/utils/get-base-url.ts\` - URL de producción fija`,
    });
    
    console.log('✅ Pull Request created successfully!');
    console.log('🔗 PR URL:', pr.html_url);
    console.log('📊 PR Number:', pr.number);
    
    return pr;
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.status) {
      console.error('Status:', error.status);
    }
    if (error.response?.data) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
    throw error;
  }
}

pushAndCreatePR();
