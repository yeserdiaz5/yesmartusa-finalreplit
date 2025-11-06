# YesmartUSA - E-commerce Marketplace Platform

## Overview
YesmartUSA is a comprehensive Next.js 14 marketplace where users can buy and sell products. The platform supports both authenticated users and guest shoppers, with full payment integration via Stripe, authentication via Supabase, and shipping label generation with Shippo. The business vision is to provide a robust and user-friendly platform for e-commerce, offering a seamless experience for both buyers and sellers with advanced features like real-time earnings panels, simplified seller management, and efficient order tracking and cancellation systems.

## User Preferences
- Preferred communication language: Spanish (Español)
- Preferred communication style: Simple, everyday language
- UI Language: English for main components (product pages, cart, user menu)

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

## Internationalization (i18n)

### Implementation
- **System**: Custom i18n with LanguageContext and translation dictionaries
- **Supported Languages**: English (default), Spanish (es)
- **Storage**: localStorage for language preference persistence
- **Components**:
  - `LanguageContext` (lib/i18n/LanguageContext.tsx): Provider and translation helper
  - `LanguageSelector` (components/language-selector.tsx): Globe icon dropdown with EN/ES text labels (no emoji flags)
- **Translation Coverage**: 95+ keys covering seller dashboard, payments, navigation, and core UI
- **Usage Pattern**: `const { t } = useLanguage()` then `t("translationKey")`

### Known Limitation
- **SSR Flash**: Server-side rendering cannot access localStorage, so pages initially render in English before client-side hydration applies the correct language. This causes a brief "flash" of English content on first load or after authentication redirects.
- **Future Enhancement**: Implement cookie-based language persistence to enable SSR with correct language from first paint.

### Translated Pages

**Spanish (Español):**
- Seller Dashboard (/seller): All headings, buttons, filters, product labels, empty states
- Payments Panel (/seller/pagos): Statistics cards, alerts, Stripe onboarding flow, payout history, error messages
- Site Header: Language selector

**English:**
- Buyer Homepage (/): Product listings, search bar, filters, "Add to Cart" and "Buy Now" buttons
- Product Detail Pages (/productdes/[id]): Product descriptions, stock status, cart actions
- User Menu: Sign In, Sign Up, My Purchases, My Orders, My Store, Admin Panel, Sign Out
- Shopping Cart: All cart-related text and actions
- Search functionality: "Search products...", "Search results for...", "Clear search"

## External Dependencies

- **Authentication**: Supabase
- **Payments**: Stripe (for payments and automatic refunds)
- **Shipping Labels**: Shippo (for label generation)
- **Database**: Neon Serverless PostgreSQL, Drizzle ORM
- **UI/Styling**: Google Fonts (Inter, JetBrains Mono), Radix UI, class-variance-authority, Tailwind CSS
- **State/Forms**: TanStack Query, React Hook Form with Zod
- **Development Tools**: Replit-specific plugins, ESBuild, TypeScript
- **Internationalization**: Custom i18n system with localStorage persistence