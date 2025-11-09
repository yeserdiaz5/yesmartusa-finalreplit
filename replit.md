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
- **Amazon Product Import**: One-click import from Amazon using Rainforest API. Sellers can paste an Amazon product URL or ASIN to automatically populate product title, description, price, and images (up to 5). Supports multiple Amazon URL formats including /dp/, /gp/product/, and query parameters. Fully bilingual with English and Spanish translations.
- **Image Editing & Cropping**: `react-easy-crop` integration for client-side image cropping (1:1 aspect ratio, zoom 0.5x-3x, free repositioning) before uploading to Supabase Storage.
- **Product Details System**: Products include optional `brand` (text) and `condition` fields with 6 eBay-style options (new, like_new, used, refurbished, open_box, for_parts). Brand field features "No brand (Generic)" checkbox for auto-fill. Fully integrated with i18n translations for both English and Spanish.
- **Product Gallery**: Amazon-style product image gallery with large main image (500px), always-visible thumbnails in 5-column grid, hover effects, and clickable image switching. Uses object-contain to show full images.
- **Enhanced Search System**: 
  - **Amazon-Style Search Bar**: Redesigned main search bar with prominent yellow gradient styling, dedicated search icon, and integrated "Search by Image" button with blue gradient for high visibility
  - **Real-Time Camera Capture**: Google Lens-style camera interface for scanning products in real-time:
    - Full-screen camera view with live preview
    - Visual scanning frame (corner markers)
    - Front/rear camera switching with flip button
    - Instant photo capture with search integration
    - Robust permission handling and error recovery
    - Auto-cleanup of camera streams on close
  - **Dual Image Input Options**: Modal offers both camera capture (primary, dark UI) and file upload (secondary) with clear visual separation
  - **Drag-and-Drop Image Search**: Professional modal interface with real-time drag-and-drop support, large image preview (up to 384px), visual feedback for drag states, and "How it works" educational section
  - **Find Similar Products Feature**: Amazon-style "More Like This" functionality - each product card includes a blue-themed button that automatically converts the product image to base64 and searches for visually similar products
  - **Advanced Vector Image Search (Hugging Face CLIP + Pinecone)**: Free, scalable visual similarity search using CLIP embeddings:
    - **Architecture**: Uses Hugging Face CLIP model (openai/clip-vit-base-patch32) + Pinecone vector database instead of OpenAI
    - **Step 1**: Image uploaded by user (camera or file upload)
    - **Step 2**: Hugging Face CLIP generates 512-dimensional visual embedding directly from image pixels
    - **Step 3**: Pinecone vector database performs similarity search (≥60% threshold) across indexed products
    - **Step 4**: Returns top 20 visually similar products with similarity scores
    - **Model Loading**: Free tier models "sleep" when inactive - first request may take 5-30 seconds to warm up
    - **Retry Logic**: Automatic retry with exponential backoff (3 attempts: 5s, 10s, 15s) for model loading states
    - **Product Indexing**: Products automatically indexed to Pinecone on creation/update
    - **Batch Tools**: `scripts/sync-products-to-pinecone.ts` for bulk indexing, `/api/index-product-to-pinecone` for manual single-product indexing
    - **Cost**: 100% free using Hugging Face Inference API (free tier) + Pinecone (free starter plan)
    - **Accuracy**: Direct visual embeddings more accurate than text-based search for product images
  - **Visual Search Results**: Dedicated results banner with product count, clear visual distinction (blue theme) for image search mode, and one-click "Clear Search" to return to regular browsing
  - **Seamless Integration**: Image search results use the same grid layout and filtering as text search, with automatic scroll-to-top and toast notifications for user feedback
- **Internationalization (i18n)**: Custom i18n system with English (default) and Spanish support, stored in `localStorage`. Provides full bilingual coverage for key platform areas including product forms, galleries, seller tools, image search, store pages, authentication pages, buyer/seller profiles, and navigation menus.

### Technical Implementations
- **Stripe Connect**: Complete Express account system with dedicated API endpoints:
  - `/api/stripe/create-connect-account` - Creates Stripe Express accounts for sellers
  - `/api/stripe/create-onboarding-link` - Generates onboarding links for account setup
  - `/api/stripe/login-link` - Creates login links to Stripe Express dashboard
  - `/api/stripe/webhook` - Webhook handler for Stripe Connect events (account.updated, account.application.deauthorized, capability.updated)
  - Environment-aware URL configuration uses `APP_URL` environment variable (https://yesmartusa.com) in production and Replit dev URLs in development
  - Onboarding pages: `/onboarding/complete` (success), `/onboarding/refresh` (expired links)
  - All redirect URLs point to: https://yesmartusa.com/onboarding/complete and https://yesmartusa.com/onboarding/refresh
- **Stripe Webhooks**: Two webhook endpoints - `/api/webhooks/stripe` for checkout completion and `/api/stripe/webhook` for Connect account verification. The Connect webhook listens for `account.updated` events to automatically verify/unverify sellers based on `charges_enabled` and `payouts_enabled` status.
- **Email Notifications**: Resend integration for automated two-stage seller emails (English):
  - **Stage 1 - Review Email**: Sent immediately after completing Stripe onboarding, informing seller their account is under review.
  - **Stage 2 - Welcome Email**: Sent via webhook when Stripe approves the account, confirming seller can now list products.
  - All emails are sanitized to prevent HTML injection and follow no-emoji guidelines.
- **Shipment Label Storage**: Dual storage using Shippo/ShipEngine links and PostgreSQL binary storage for backup, with a secure API for retrieval.
- **Automated Shipping Payment System**: Dual-flow shipping payment automation using Stripe Connect Transfers and Shippo:
  - **Flow 1 - Buyer Pays Shipping** (`buyer_pays`):
    - Checkout: Comprador paga producto + 100% shipping → plataforma recibe todo
    - Label generation: Plataforma paga etiqueta a Shippo
    - Payout: Vendedor recibe precio completo del producto via Stripe Transfer
    - Result: Plataforma recupera el costo de shipping del dinero del comprador
  - **Flow 2 - Seller Pays Shipping** (`seller_pays`):
    - Checkout: Comprador paga solo el producto → plataforma recibe producto price
    - Label generation: Plataforma paga etiqueta a Shippo
    - Payout: Vendedor recibe (producto price - shipping cost) via Stripe Transfer
    - Result: Vendedor efectivamente pagó el shipping, plataforma neutral
  - **Flow 3 - Shared Shipping** (`shared`):
    - Checkout: Comprador paga producto + 50% shipping → plataforma recibe ambos
    - Label generation: Plataforma paga etiqueta completa a Shippo
    - Payout: Vendedor recibe (producto price - 50% shipping) via Stripe Transfer
    - Result: Costo de shipping dividido 50/50 entre comprador y vendedor
  - **Deficit Handling**: Cuando shipping excede producto price (e.g., producto $10, shipping $15):
    - Transfer al vendedor: $0 (no se transfiere nada)
    - Registro en `shipping_charges`: Solo el deficit real ($5) con status "pending"
    - Plataforma queda out-of-pocket por el deficit
    - Sistema registra auditable debt del vendedor para futura reconciliación
  - **Pre-Flight Verification**: Verifica que vendedor tenga Stripe Connect account verificada ANTES de generar etiqueta, previniendo desperdicio de labels si el payout fallaría
  - **Tracking Table**: `shipping_charges` tabla PostgreSQL rastrea todos los cargos de shipping:
    - `amount`: Monto que el vendedor debe (o deficit pendiente)
    - `status`: "deducted" (exitosamente deducido del transfer) o "pending" (deficit no pagado)
    - `deducted_at`: Timestamp de cuando se dedujo (null si pending)
    - Solo inserta registros cuando vendedor es responsable (seller_pays o shared)
  - **Implementation**: `/api/create-shipment-with-payment` endpoint maneja verificación, generación de etiqueta, transfer a vendedor, y registro de cargos en una transacción coordinada

## External Dependencies

- **Authentication**: Supabase
- **Payments**: Stripe
- **Shipping Labels**: Shippo
- **Database**: Neon Serverless PostgreSQL with pgvector extension, Drizzle ORM
- **UI/Styling**: Google Fonts (Inter, JetBrains Mono), Radix UI, class-variance-authority, Tailwind CSS
- **State/Forms**: TanStack Query, React Hook Form with Zod
- **AI Integration**: 
  - OpenAI GPT-4o for product description generation (via Replit AI Integrations)
  - **Hugging Face CLIP** (openai/clip-vit-base-patch32) for visual image embeddings (512 dimensions, free tier)
  - **Pinecone** vector database for similarity search (yesmart-images index, free starter plan)
- **Product Data Import**: Rainforest API for importing Amazon product data
- **Image Processing**: `react-easy-crop`
- **Email Service**: Resend for transactional emails