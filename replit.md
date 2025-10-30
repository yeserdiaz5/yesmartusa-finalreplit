# Newsletter Subscription & Service Comparison Platform

## Overview

A modern web application for comparing service providers and pricing plans side-by-side. Users can filter, sort, and compare multiple services, and subscribe to a newsletter for updates. The platform emphasizes clarity and scannability with a clean, data-focused design that works seamlessly in both light and dark modes.

## User Preferences

Preferred communication style: Simple, everyday language.

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