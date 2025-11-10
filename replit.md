# YesmartUSA - E-commerce Marketplace Platform

## Overview
YesmartUSA is an e-commerce marketplace built with Next.js 14, designed for buying and selling products. It integrates Stripe for payments, Supabase for authentication, and Shippo for shipping labels. The platform aims to provide a robust, user-friendly online commerce experience with features like real-time earnings panels for sellers, streamlined product management, and efficient order processing including tracking and cancellation. The core business vision is to create a seamless experience for both buyers and sellers, fostering a dynamic and open marketplace.

## User Preferences
- Preferred communication language: Spanish (Español)
- Preferred communication style: Simple, everyday language
- UI Language: English for main components (product pages, cart, user menu)

## System Architecture

### UI/UX Decisions
- **Open Marketplace**: Any authenticated user can sell products without role restrictions.
- **Seller Verification**: Automated verification via Stripe Connect webhooks; unverified sellers have restricted access.
- **Seller Tools**: Dedicated earnings panel and simplified product listing dashboard.
- **User Interface Elements**: Dynamic banners, universal product links, optimized cart, and consistent product card design.
- **Order Management**: Tabbed interfaces for buyers and sellers, automated cancellation with Stripe refunds, and detailed tracking.
- **Shipping Policy System**: Per-product policies (Seller Pays, Buyer Pays, Shared 50/50) with dynamic calculation.
- **Package Dimensions System**: Sellers input dimensions; system estimates shipping costs via Shippo API and auto-populates for labels.
- **Shipping Cost Flow & Profit**: Buyer pays product + estimated shipping; seller pays actual shipping cost. Stripe Connect manages transfers, with estimated costs rounded up.
- **AI Product Description Generation**: OpenAI GPT-4o generates Spanish product descriptions based on product name.
- **Amazon Product Import**: One-click import from Amazon using Rainforest API to populate product details and images, supporting multiple URL formats and bilingual content.
- **Product Variants System**: 
  - **Architecture**: Independent products grouped by `variant_group_id` (no parent/child hierarchy). Each variant is a standalone product in seller inventory with unique price, stock, images, description, and attributes.
  - **Display Logic**: Variants show separately on main product listings; grouped only on product detail page (PDP) via variant-picker UI
  - **Variant-Picker UI**: Responsive grid (2-3 columns) of clickable variant cards showing image, title, price, and top attributes; enables seamless navigation between related variants
  - **Database**: `variant_group_id` column (nullable UUID) groups related products; partial unique index on ASIN (WHERE asin IS NOT NULL) ensures Amazon ASIN uniqueness while allowing multiple manual variants
  - **Dual Mode**: Supports both Amazon-imported variants and manual variant creation (mutually exclusive)
  - **Amazon Variants - Fully Editable**: 
    - Automated import with proper image extraction from Rainforest API objects/strings, with fallback to main product image
    - **Per-Variant Import**: Individual "Import Variant" button per variant to fetch complete ASIN-specific data (all images, description, price, attributes) via `/api/import/amazon/variant` endpoint
    - Complete editing capabilities: title, price, stock, images (up to 6), description, and attribute key-value pairs
    - Reset functionality: restore original Amazon data for edited variants
    - Detach functionality: convert Amazon variant to manual variant (clears ASIN)
    - Remove functionality: exclude individual variants from submission
    - Modification tracking: `modified` flag tracks changes, `originalData` preserves import state
    - All imported variants editable by default (no selection required)
    - Case-insensitive ASIN matching ensures correct variant data extraction
  - **Manual Variants**: Custom variant creation with individual pricing, stock, images (up to 6), description, and attribute key-value pairs
  - **Single-Variant Amazon Import**: "Importar Variante Individual" button allows importing specific Amazon products by ASIN without bulk import; imported variants integrate into manual variant workflow with preserved Amazon data (title, description, images, attributes) while inheriting logistics from parent product; includes ASIN deduplication, validation (trim/uppercase), and source tracking (`source: "amazon-single"`)
  - **Logistics Field Inheritance**: All variants inherit shipping_policy, shipping_cost, and package dimensions (length/width/height/weight) from parent form at creation time using nullish coalescing (??) to preserve valid zero values (e.g., free shipping, zero-weight items)
  - **Stock Input Fix**: Stock quantity inputs use valueAsNumber to prevent leading zero display issues (e.g., "05" displays correctly as "5")
  - **Clear Import**: One-click button to clear Amazon import state and switch to manual variant creation mode while preserving product form data
  - **Validation**: Shared validation for both Amazon and manual variants (title, price > 0, stock >= 0, images required)
  - **Atomic Operations**: All variants created in single transaction with shared variant_group_id; rollback mechanism ensures data integrity
  - **i18n Support**: Full bilingual interface for both Amazon and manual variant workflows
- **Image Editing & Cropping**: Client-side image cropping (1:1 aspect ratio) before Supabase upload.
- **Product Details System**: Optional brand and 6 eBay-style condition fields with i18n support.
- **Product Gallery**: Amazon-style image gallery with large main image, thumbnails, and hover effects.
- **Enhanced Search System**: Amazon-style search bar with "Search by Image" feature, including real-time camera capture, drag-and-drop image search, "Find Similar Products" functionality, and advanced vector image search using Hugging Face CLIP and Pinecone for visual similarity.
- **Internationalization (i18n)**: Custom i18n system with English (default) and Spanish support across the platform.

### Technical Implementations
- **Stripe Connect**: API endpoints for creating accounts, onboarding links, login links, and webhook handling for account status updates.
- **Stripe Webhooks**: Consolidated webhook endpoint (`/api/webhooks/stripe`) handles all Stripe events:
  - `checkout.session.completed`: Updates orders from "pending" to "paid" status with payment intent tracking
  - `account.updated`: Verifies seller Stripe Connect accounts when charges and payouts are enabled, triggers welcome email
  - `account.application.deauthorized`: De-verifies seller accounts when Connect authorization is revoked
  - `capability.updated`: Logs capability status changes for debugging
  - Detailed logging with ERROR/SUCCESS/WARNING/INFO prefixes for comprehensive diagnostics
- **Seller Verification System**: Enforces Stripe Connect verification before product listing:
  - Blocks unverified sellers from creating/publishing products
  - Two-tier validation: (1) Stripe Connect account setup required, (2) Account verification completed
  - Clear error messages directing sellers to "My Earnings" for setup
  - Admin users bypass verification requirements
  - Applied to both `createProduct` and `createProductWithVariants` actions
- **Email Notifications**: Resend integration for automated two-stage seller emails (review and welcome).
- **Shipment Label Storage**: Dual storage using Shippo/ShipEngine links and PostgreSQL binary storage.
- **Automated Shipping Payment System**: Dual-flow system using Stripe Connect Transfers and Shippo for buyer pays, seller pays, and shared shipping models, including deficit handling and pre-flight verification.
- **Domain Redirect & SSL Unification**: Middleware-level redirect from www.yesmartusa.com to https://yesmartusa.com with HTTP 301 (Moved Permanently) status code. Both domains serve identical SSL-secured content, but yesmartusa.com is the primary canonical domain. All Stripe webhooks and integrations should use the canonical domain (yesmartusa.com) to ensure consistent verification and avoid redirect overhead.

## External Dependencies

- **Authentication**: Supabase
- **Payments**: Stripe
- **Shipping Labels**: Shippo
- **Database**: Neon Serverless PostgreSQL with pgvector extension, Drizzle ORM
- **UI/Styling**: Google Fonts (Inter, JetBrains Mono), Radix UI, class-variance-authority, Tailwind CSS
- **State/Forms**: TanStack Query, React Hook Form with Zod
- **AI Integration**: OpenAI GPT-4o (via Replit AI Integrations), Hugging Face CLIP, Pinecone
- **Product Data Import**: Rainforest API
- **Image Processing**: `react-easy-crop`
- **Email Service**: Resend