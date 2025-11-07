# YesmartUSA - E-commerce Marketplace Platform

## Overview
YesmartUSA is a comprehensive e-commerce marketplace built with Next.js 14, enabling users to buy and sell products. The platform integrates Stripe for payments, Supabase for authentication, and Shippo for shipping label generation. Its primary purpose is to provide a robust, user-friendly environment for online commerce, featuring real-time earnings panels for sellers, streamlined product management, and efficient order processing including tracking and cancellation. The business vision focuses on a seamless experience for both buyers and sellers, fostering a dynamic marketplace.

## User Preferences
- Preferred communication language: Spanish (Español)
- Preferred communication style: Simple, everyday language
- UI Language: English for main components (product pages, cart, user menu)

## System Architecture

### Frontend Architecture
- **Framework**: React 18+ with TypeScript, Vite, and Wouter for routing.
- **UI**: shadcn/ui components (Radix UI, New York style), Tailwind CSS for styling with custom design tokens, responsive mobile-first design. Typography uses Inter and JetBrains Mono.
- **State Management**: TanStack Query for server state, React Hook Form with Zod for validation, and Context API for theme.
- **Design System**: Consistent spacing, custom HSL color system, layered elevation, and border variants.

### Backend Architecture
- **Server**: Express.js with TypeScript for REST API endpoints and middleware.
- **Data Layer**: Interface-based in-memory storage (MemStorage) with Drizzle ORM configured for PostgreSQL.
- **Database Schema**: PostgreSQL with `subscribers` table and Zod schemas.

### UI/UX Decisions
- **Open Marketplace**: Any authenticated user can sell products. No role restrictions - the platform is designed as an open marketplace where everyone can be both a buyer and seller.
- **Seller Verification System**: Automatic seller verification via Stripe Connect webhooks. Unverified sellers see a welcome screen with setup instructions and can only access payment configuration. Once Stripe approves their account (typically 5-15 minutes), the system automatically updates the database and sends an English welcome email via Resend. The full seller dashboard unlocks after verification. The system also handles account deactivation - if Stripe disables charges or payouts, sellers are automatically unverified and restricted again.
- **Seller Tools**: Dedicated earnings panel (Stripe stats, onboarding, payout history) and a simplified dashboard for product listings. Settings button moved to buyer profile page (`/compras`).
- **User Interface Elements**: Dynamic user banners, universal clickable product links, optimized cart with real-time updates. Consistent product card design across homepage and store pages with Amazon-style presentation (ratings, reviews, quantity controls, dual action buttons).
- **Order Management**: Tabbed interfaces for both sellers (`/seller/my-orders`) and buyers (`/compras`), categorizing orders by status (Paid, Shipped, Cancelled). Includes automated order cancellation with Stripe refunds and detailed order tracking with carrier-specific links. User menu redesigned to separate "Buyer Profile" and "Seller Profile" options.
- **Shipping Policy System**: Per-product shipping policies (Seller Pays, Buyer Pays, Shared 50/50) defined in `products` table, with dynamic calculation and display in cart and checkout.
- **Package Dimensions System**: Sellers input package dimensions (`package_length`, `package_width`, `package_height`, `package_weight`) for each product. The system automatically estimates shipping costs using Shippo API, pre-fills the `shipping_cost` field, and auto-populates dimensions for shipping label creation.
- **Shipping Cost Flow & Profit**: Buyer pays product price + estimated shipping. Seller pays actual shipping cost. Profit/loss on shipping is managed by the difference between estimated and actual costs, with Stripe Connect handling transfers. Estimated costs are rounded up to mitigate seller losses.
- **AI Product Description Generation**: Integration with OpenAI GPT-4o via Replit AI Integrations to generate product descriptions in Spanish based on the product name, with user editing capabilities.
- **Image Editing & Cropping**: `react-easy-crop` integration for client-side image cropping (1:1 aspect ratio, zoom 0.5x-3x, free repositioning) before uploading to Supabase Storage.
- **Product Details System**: Products include optional `brand` (text) and `condition` fields with 6 eBay-style options (new, like_new, used, refurbished, open_box, for_parts). Brand field features "No brand (Generic)" checkbox for auto-fill. Fully integrated with i18n translations for both English and Spanish.
- **Product Gallery**: Amazon-style product image gallery with large main image (500px), always-visible thumbnails in 5-column grid, hover effects, and clickable image switching. Uses object-contain to show full images.
- **Image Search**: Visual product search functionality using GPT-4o Vision API. Users can upload product images to find similar items in the marketplace. Features drag-and-drop modal interface, real-time image analysis, and keyword-based product matching.
- **Internationalization (i18n)**: Custom i18n system with English (default) and Spanish support, stored in `localStorage`. Provides full bilingual coverage for key platform areas including product forms, galleries, seller tools, image search, store pages, authentication pages, buyer/seller profiles, and navigation menus.

### Technical Implementations
- **Stripe Connect**: Complete Express account system with dedicated API endpoints:
  - `/api/stripe/create-connect-account` - Creates Stripe Express accounts for sellers
  - `/api/stripe/create-onboarding-link` - Generates onboarding links for account setup
  - `/api/stripe/login-link` - Creates login links to Stripe Express dashboard
  - `/api/stripe/webhook` - Webhook handler for Stripe Connect events (account.updated, account.application.deauthorized, capability.updated)
  - Environment-aware URL configuration automatically uses `https://yesmartusa.com` in production (`REPLIT_DEPLOYMENT=1`) and Replit dev URLs in development
  - Onboarding pages: `/onboarding/complete` (success), `/onboarding/refresh` (expired links)
- **Stripe Webhooks**: Two webhook endpoints - `/api/webhooks/stripe` for checkout completion and `/api/stripe/webhook` for Connect account verification. The Connect webhook listens for `account.updated` events to automatically verify/unverify sellers based on `charges_enabled` and `payouts_enabled` status.
- **Email Notifications**: Resend integration for automated two-stage seller emails (English):
  - **Stage 1 - Review Email**: Sent immediately after completing Stripe onboarding, informing seller their account is under review.
  - **Stage 2 - Welcome Email**: Sent via webhook when Stripe approves the account, confirming seller can now list products.
  - All emails are sanitized to prevent HTML injection and follow no-emoji guidelines.
- **Shipment Label Storage**: Dual storage using Shippo/ShipEngine links and PostgreSQL binary storage for backup, with a secure API for retrieval.

## External Dependencies

- **Authentication**: Supabase
- **Payments**: Stripe
- **Shipping Labels**: Shippo
- **Database**: Neon Serverless PostgreSQL, Drizzle ORM
- **UI/Styling**: Google Fonts (Inter, JetBrains Mono), Radix UI, class-variance-authority, Tailwind CSS
- **State/Forms**: TanStack Query, React Hook Form with Zod
- **AI Integration**: OpenAI (via Replit AI Integrations)
- **Image Processing**: `react-easy-crop`
- **Email Service**: Resend for transactional emails