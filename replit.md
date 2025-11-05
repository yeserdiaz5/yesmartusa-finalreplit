# YesmartUSA - E-commerce Marketplace Platform

## Overview

YesmartUSA es un marketplace completo de Next.js 14 donde los usuarios pueden comprar y vender productos. La plataforma soporta tanto usuarios autenticados como compradores invitados, con integración completa de pagos vía Stripe, autenticación mediante Supabase, y generación de etiquetas de envío con Shippo.

## User Preferences

- Preferred communication language: Spanish (Español)
- Preferred communication style: Simple, everyday language

## Recent Changes (November 2025)

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