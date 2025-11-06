# YesmartUSA - E-commerce Marketplace Platform

## Overview
YesmartUSA is a comprehensive Next.js 14 marketplace where users can buy and sell products. The platform supports both authenticated users and guest shoppers, with full payment integration via Stripe, authentication via Supabase, and shipping label generation with Shippo. The business vision is to provide a robust and user-friendly platform for e-commerce, offering a seamless experience for both buyers and sellers with advanced features like real-time earnings panels, simplified seller management, and efficient order tracking and cancellation systems.

## User Preferences
- Preferred communication language: Spanish (Español)
- Preferred communication style: Simple, everyday language

## System Architecture

### Frontend Architecture
- **Framework & Build System**: React 18+ with TypeScript, Vite for fast development, and Wouter for lightweight client-side routing.
- **UI Component Library**: shadcn/ui components built on Radix UI primitives (New York style), Tailwind CSS for styling with custom design tokens, and a responsive mobile-first design. Typography uses Inter and JetBrains Mono.
- **State Management**: TanStack Query for server state, React Hook Form with Zod for validation, and Context API for theme management.
- **Design System**: Consistent spacing, custom HSL color system, elevation system with layered background overlays, and border variants for buttons.

### Backend Architecture
- **Server Framework**: Express.js with TypeScript for REST API endpoints, including custom middleware for logging and JSON parsing.
- **API Endpoints**: Includes endpoints for newsletter subscription (`POST /api/subscribe`) and service retrieval (`GET /api/services`).
- **Data Layer**: Currently uses in-memory storage (MemStorage) with an interface-based abstraction (IStorage) for future database integration. Drizzle ORM is configured for PostgreSQL.
- **Database Schema**: Prepared for PostgreSQL with `subscribers` table and Zod schemas for validation.

### UI/UX Decisions
- **Seller Earnings Panel**: Dedicated page for Stripe statistics, onboarding, and payout history.
- **Simplified Seller Dashboard**: Streamlined interface focusing on product listings, removing test functionalities and unnecessary tabs.
- **User Banner**: Displays store name, full name, or email in the header based on availability.
- **Product Links**: Universal clickable links to product description pages across various platform sections.
- **Cart Optimization**: Real-time updates for authenticated users, efficient polling for guests.
- **Order Management**: Advanced tabbed interfaces for both seller (`/my-orders`) and buyer (`/compras`) order views, categorizing orders by status (Paid, Shipped, Cancelled, Other). Includes clear banners, badges, and status messages.
- **Order Cancellation**: Automated system with Stripe refund integration for sellers, authenticated buyers, and guest buyers via a public link. Strict validation based on user roles and order status.
- **Order Tracking**: Detailed shipping information for "shipped" or "delivered" orders, with clickable tracking numbers and automatic carrier-specific links (USPS, UPS, FedEx, DHL, Google search for others).

### Technical Implementations
- **Stripe Connect Integration**: Onboarding flow, automatic account creation, and storage in `seller_stripe_accounts`.
- **Stripe Functions**: `getStripeBalance()`, `getPayoutHistory()`, `getPayoutSchedule()`, `getSellerPayoutStats()`, `getOrCreateStripeAccount()`, `createStripeAccountLink()`, `markAccountOnboardingComplete()`.
- **Shipment Label Storage**: Dual architecture with Shippo/ShipEngine links as primary and PostgreSQL binary storage (`shipment_labels` table) as permanent backup. Automated PDF download and storage upon label purchase. API endpoint `/api/shipment-labels/[id]` for secure label retrieval.

## External Dependencies

- **Authentication**: Supabase
- **Payments**: Stripe (for payments and automatic refunds)
- **Shipping Labels**: Shippo (for label generation)
- **Database**: Neon Serverless PostgreSQL, Drizzle ORM
- **UI/Styling**: Google Fonts (Inter, JetBrains Mono), Radix UI, class-variance-authority, Tailwind CSS
- **State/Forms**: TanStack Query, React Hook Form with Zod
- **Development Tools**: Replit-specific plugins, ESBuild, TypeScript