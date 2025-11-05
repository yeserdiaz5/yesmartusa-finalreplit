# YesmartUSA - E-commerce Marketplace Platform

## Overview

YesmartUSA es un marketplace completo de Next.js 14 donde los usuarios pueden comprar y vender productos. La plataforma soporta tanto usuarios autenticados como compradores invitados, con integración completa de pagos vía Stripe, autenticación mediante Supabase, y generación de etiquetas de envío con Shippo.

## User Preferences

- Preferred communication language: Spanish (Español)
- Preferred communication style: Simple, everyday language

## Recent Changes (November 2025)

### Enlaces de Productos a Páginas de Descripción
- **Implementación Universal**: Todas las imágenes y nombres de productos ahora incluyen enlaces clickeables a la página de descripción (`/productdes/${productId}`)
- **Páginas Actualizadas**:
  - `/` - Homepage del comprador (buyer-homepage-client.tsx)
  - `/tienda/[sellerId]` - Página de tienda del vendedor (tienda-client.tsx)
  - `/cartplus` - Carrito de compras (cart-page-client.tsx)
  - `/compras` - Vista de compras del comprador (compras-client.tsx)
  - `/mis-compras` - Vista alternativa de compras (mis-compras-client.tsx)
  - `/my-orders` - Vista de pedidos del vendedor (my-orders-client.tsx)
  - `/orders` - Vista de gestión de pedidos (orders-page-client.tsx)
- **Efectos Visuales**:
  - Hover en imágenes: Reducción de opacidad (opacity-80)
  - Hover en títulos: Cambio a color azul (text-blue-600)
  - Transiciones suaves para mejor UX
- **Beneficios**: Navegación más intuitiva, usuarios pueden ver detalles de productos desde cualquier página

### Optimización del Contador del Carrito
- Implementado sistema de eventos 'cartUpdated' para actualizaciones en tiempo real
- CartIcon ahora detecta automáticamente usuarios autenticados vs invitados
- Eliminado polling innecesario al servidor para usuarios invitados
- Mejora de rendimiento: solo usuarios autenticados consultan el servidor

### Filtrado de Pedidos Pendientes
- Los pedidos con estado "pending" ahora están ocultos en:
  - `/my-orders` - Vista de pedidos del vendedor
  - `/compras` - Vista de compras del comprador
  - `/mis-compras` - Vista alternativa de compras
- Filtrado implementado en el servidor para mejor rendimiento

### Sistema de Cancelación de Pedidos con Reembolso Automático
- **Vendedores**: Pueden cancelar pedidos no enviados (solo pedidos de un único vendedor)
  - Botón de cancelar en `/my-orders` para pedidos con status "paid"
  - Razones específicas: Producto agotado, Error en precio, No puedo cumplir, Pedido duplicado
  - Validación: Solo puede cancelar si es el vendedor de TODOS los items del pedido
- **Compradores Autenticados**: Pueden cancelar sus compras no enviadas
  - Botón de cancelar en `/mis-compras` y `/compras` para pedidos con status "paid"
  - Razones: Cambié de opinión, Mejor precio, Error, Tiempo largo, Otra razón
- **Compradores Invitados**: Pueden cancelar via link público
  - Página pública en `/cancel-order/[orderId]`
  - Requiere email usado en la compra para validación
  - Mismas razones que compradores autenticados
- **Reembolso Automático**: Integración con Stripe
  - Procesa reembolso automático cuando el pedido fue pagado
  - Excluye payment_intents de testing (test_*, guest_test_*)
  - Guarda refund_id en la base de datos
  - Tiempo de procesamiento: 5-10 días hábiles
- **Seguridad**:
  - Validación estricta de autenticación
  - Vendedores solo pueden cancelar pedidos de un único vendedor
  - Compradores solo pueden cancelar sus propios pedidos
  - Invitados deben proporcionar el email correcto

### Rastreo de Pedidos
- **Vista de Compras** (`/compras`): 
  - Muestra información de envío para pedidos en estado "shipped" o "delivered"
  - Número de rastreo clickeable que abre el tracking en nueva pestaña
  - Links automáticos según el transportista:
    - USPS: Enlace directo a USPS Tracking
    - UPS: Enlace directo a UPS Tracking
    - FedEx: Enlace directo a FedEx Tracking
    - DHL: Enlace directo a DHL Tracking
    - Otros: Búsqueda en Google del número de tracking
  - Muestra transportista y fecha estimada de entrega
  - Información obtenida de la tabla `shipments` relacionada con cada orden

### Sistema de Almacenamiento Permanente de Etiquetas de Envío
- **Arquitectura Dual de Almacenamiento**:
  - **Fuente Primaria**: Enlaces de Shippo/ShipEngine (pueden expirar)
  - **Fuente de Respaldo**: Base de datos PostgreSQL (permanente)
- **Tabla `shipment_labels`**:
  - Almacena PDFs en formato bytea (binario)
  - Campos: shipment_id, file_bytes, file_size, tracking_number, shippo_label_url, source
  - Relación con `shipments` mediante `label_backup_id`
- **Flujo Automático**:
  1. Al comprar etiqueta, el sistema descarga automáticamente el PDF desde Shippo
  2. Guarda el PDF en `shipment_labels` en formato binario
  3. Actualiza `shipments.label_backup_id` para vincular el respaldo
- **API Endpoint**: `/api/shipment-labels/[id]`
  - Autentica y autoriza al usuario (comprador o vendedor)
  - Sirve el PDF con headers correctos (application/pdf)
  - Decodifica bytea desde base64 correctamente
- **Beneficios**:
  - Vendedores pueden reimprimir etiquetas indefinidamente
  - No dependen de la disponibilidad de enlaces de Shippo
  - Respaldo permanente de todas las etiquetas compradas

### Gestión de Pedidos del Vendedor (My Orders)
- **Vista de Pedidos** (`/my-orders`):
  - **Interfaz con Tabs Profesional**: Navegación superior con 3 pestañas para filtrar por estado
  - **Diseño UX Optimizado**: Sin scroll largo - cada tab muestra solo las órdenes de su categoría
  - **Tabs Disponibles**:
    1. **"Pagados"** - Tab con badge verde
       - Pedidos que necesitan etiqueta de envío
       - Banner informativo: "📦 Tienes X pedidos que necesitan etiqueta de envío"
       - **Para pedidos SIN etiqueta**: Botón "Comprar Envío" y opción de cancelar
       - **Para pedidos CON etiqueta comprada**: Botón "Imprimir Etiqueta" y opción de cancelar
         - Permite reimprimir etiquetas de pedidos que aún no se han marcado como enviados
         - Solo visible si existe `label_url` en el shipment asociado
    2. **"Enviados"** - Tab con badge azul
       - Pedidos en tránsito o entregados
       - Banner informativo: "🚚 X pedidos enviados"
       - Muestra información de tracking (número, transportista, enlace)
       - **Sistema Dual de Impresión de Etiquetas**:
         - **Botón "Imprimir desde Shippo"**: Descarga PDF directamente de Shippo
           - Fuente primaria mientras el enlace esté disponible
         - **Botón "Imprimir copia de respaldo"**: Descarga PDF desde base de datos
           - Siempre disponible, respaldo permanente
           - Solo visible si existe `label_backup_id` en el shipment
    3. **"Cancelados"** - Tab con badge rojo
       - Historial de pedidos cancelados
       - Banner informativo: "❌ X pedidos cancelados"
       - Muestra razón de cancelación
  - **Badges con Contadores**: Cada tab muestra el número de órdenes en ese estado
  - **Estados Vacíos**: Mensaje amigable cuando no hay órdenes en una categoría
  - **Ventajas**: Vendedores con muchos pedidos (100+) pueden navegar fácilmente sin scroll largo

### Gestión de Compras del Usuario (Compras)
- **Vista de Compras** (`/compras`):
  - **Interfaz con Tabs Profesional**: Sistema de navegación idéntico a /my-orders
  - **Diseño UX Optimizado**: Organización clara por estados
  - **Tabs Disponibles**:
    1. **"Pagados"** - Tab con badge verde
       - Compras pagadas esperando envío
       - Botón de cancelar para compras no enviadas
       - Banner informativo con contador
    2. **"Enviados"** - Tab con badge azul
       - Compras en tránsito o entregadas
       - Información completa de tracking con enlaces automáticos
       - Muestra transportista y fecha estimada de entrega
    3. **"Cancelados"** - Tab con badge rojo
       - Historial de compras canceladas
       - Muestra razón de cancelación
    4. **"Otros"** - Tab condicional con badge amarillo
       - Solo aparece si hay compras con estados no reconocidos
       - Banner de advertencia explicando la situación
       - Manejo robusto de estados futuros o inesperados
  - **Badges con Contadores**: Cada tab muestra el número de compras
  - **Estados Vacíos**: Mensajes específicos por categoría
  - **Agrupación Robusta**: Sistema de 4 columnas dinámicas (3 si no hay "Otros")
  - **Testing**: Todas las cards de órdenes incluyen data-testid único

## System Architecture

### Frontend Architecture

**Framework & Build System**
- React 18+ with TypeScript for type-safe component development
- Vite as the build tool and development server for fast hot module replacement
- Wouter for lightweight client-side routing
- Custom CSS variables system for comprehensive theming support

**UI Component Library**
- shadcn/ui components built on Radix UI primitives (New York style variant)
- Tailwind CSS for utility-first styling with custom design tokens
- Typography stack: Inter for UI/data, JetBrains Mono for numerical displays
- Responsive design with mobile-first breakpoints

**State Management**
- TanStack Query (React Query) for server state management and caching
- React Hook Form with Zod for form validation
- Context API for theme management (light/dark mode)

**Design System**
- Consistent spacing using Tailwind units (4, 6, 8, 12, 16)
- Custom color system with HSL values supporting alpha channels
- Elevation system using layered background overlays (elevate-1, elevate-2)
- Border variants with automatic computation for primary/destructive buttons

### Backend Architecture

**Server Framework**
- Express.js with TypeScript for REST API endpoints
- Custom middleware for request logging and JSON parsing
- Raw body capture for potential webhook integrations

**API Endpoints**
- `POST /api/subscribe` - Newsletter subscription with email validation
- `GET /api/services` - Retrieve all available services for comparison

**Data Layer**
- In-memory storage implementation (MemStorage class) as current data source
- Interface-based storage abstraction (IStorage) for future database integration
- Drizzle ORM configured for PostgreSQL with schema defined for future migration

**Database Schema (Prepared for PostgreSQL)**
- `subscribers` table with UUID primary keys, email (unique), and timestamp
- Zod schemas for runtime validation matching database structure
- Service data currently stored in memory, designed for eventual persistence

### External Dependencies

**Database**
- Neon Serverless PostgreSQL driver configured
- Drizzle ORM for type-safe database operations
- connect-pg-simple ready for session storage (not currently active)
- Migration tooling via drizzle-kit

**UI & Styling**
- Google Fonts: Inter (300-900 weights), JetBrains Mono (400-700 weights)
- Radix UI primitives for 20+ accessible component patterns
- class-variance-authority for component variant management
- Tailwind CSS with PostCSS and Autoprefixer

**State & Forms**
- TanStack Query for data fetching, caching, and synchronization
- React Hook Form with Zod resolver for type-safe form validation
- Custom toast notification system via Radix UI Toast

**Development Tools**
- Replit-specific plugins for error overlays, cartographer, and dev banner
- ESBuild for production server bundling
- TypeScript strict mode with path aliases for clean imports

**Assets**
- Static images stored in attached_assets directory
- Hero image for landing section