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
- **Shipping Policy System**: Per-product shipping policies allow sellers to choose who pays shipping costs. Three policy options:
  - **Seller Pays**: Seller covers all shipping costs; buyer pays $0 for shipping
  - **Buyer Pays**: Buyer pays full shipping cost as specified by seller
  - **Shared (50/50)**: Shipping cost split equally between seller and buyer
  - **Database Fields**: `shipping_policy` (enum: 'seller_pays' | 'buyer_pays' | 'shared') and `shipping_cost` (decimal) in `products` table
  - **Implementation**: Product form (/seller/products/new), cart (cartplus), and checkout (checkoutplus) all display and calculate shipping based on policies
  - **Calculation Logic**: Cart and checkout dynamically calculate shipping totals by summing each product's shipping contribution based on its policy
  - **UI Display**: Package icon with shipping info shown in cart items and checkout items; complete cost breakdown (subtotal, shipping, tax, total) in order summary
  - **Bilingual Support**: Full EN/ES translations for all shipping policy labels and UI elements
- **Package Dimensions System**: Sellers can input package dimensions for each product to streamline shipping label creation:
  - **Database Fields**: `package_length`, `package_width`, `package_height` (in inches), and `package_weight` (in pounds per unit) in `products` table
  - **Product Form**: Dedicated "Package Dimensions" card appears BEFORE shipping policy section with REQUIRED input fields for all dimensions (marked with *)
  - **Required Fields**: Description, at least one image, and all package dimensions (length, width, height, weight) are mandatory
  - **Automatic Cost Estimation**: System automatically calls Shippo API to calculate shipping cost when all dimensions are filled:
    - Uses seller's actual address (if available) or default LA address
    - Destination to Chicago, IL (central US) for average estimation
    - Returns cheapest available rate, rounded up to nearest dollar
  - **Auto-Fill Workflow**: Fill dimensions → Cost automatically calculated and displayed → `shipping_cost` field auto-filled with rounded estimate
  - **Auto-Population**: When creating shipping labels (/create-shippo-label), package dimensions automatically pre-fill from the first product's saved dimensions
  - **Weight Calculation**: Total weight = (product.package_weight || 0.5) × order quantity, with 1 lb minimum
  - **Fallback Logic**: If product dimensions are missing, defaults to 12×10×8 inches; if product weight is missing, estimates 0.5 lb per item
  - **UI/UX**: Clean grid layout (2 columns) with labeled inputs and placeholder values; automatic estimation status shown below fields
  - **Bilingual Support**: Full EN/ES translations for dimension labels and status messages
  
- **Shipping Cost Flow & Profit Logic**:
  - **Step 1 - Product Creation**: Seller enters dimensions → shipping cost automatically calculated and auto-filled with rounded estimate
  - **Step 2 - Customer Purchase**: Buyer pays product price + estimated shipping cost (total goes to seller's Stripe Connect account)
  - **Step 3 - Label Purchase**: Seller creates shipping label and pays actual shipping cost
  - **Profit Scenarios**:
    - If actual cost < estimated cost → Seller keeps the difference (profit on shipping)
    - If actual cost > estimated cost → Seller pays the difference from product revenue (loss on shipping)
  - **No Manual Adjustments Needed**: Stripe Connect automatically handles all fund transfers; no refunds or complex accounting required
  - **Best Practice**: Estimated cost is rounded UP to minimize seller losses and account for packaging materials

- **AI Product Description Generation**: Automated content generation using OpenAI GPT-4o to help sellers create compelling product descriptions:
  - **Integration**: Uses Replit AI Integrations (OpenAI) - no API key needed, charges to user credits
  - **AI Model**: GPT-4o (OpenAI's multimodal model available via Replit AI Integrations)
  - **Default Language**: Generates descriptions in Spanish (aligning with user preference)
  - **User Workflow**: Seller enters product name → clicks "Generate with AI" button → description auto-fills → seller can edit if needed
  - **API Endpoint**: `/api/generate-description` accepts product name, returns AI-generated description
  - **UI Implementation**: Button with Sparkles icon next to description field in product form (/seller/products/new)
  - **Loading States**: Shows "Generating..." with spinner icon while AI processes request
  - **Error Handling**: Toast notifications for missing product name or API failures
  - **Bilingual Support**: Full EN/ES translations for all AI generation UI elements and messages
  - **Validation**: Product name is required before generating description; description field is marked as required with asterisk (*)

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
  - `LanguageContext` (lib/i18n/LanguageContext.tsx): Provider and translation helper with 180+ translation keys
  - `LanguageSelector` (components/language-selector.tsx): Globe icon dropdown with EN/ES text labels (no emoji flags) in site header
- **Translation Coverage**: Full bilingual support for buyer homepage, product pages, user menu, seller dashboard, payments, and shipping label creation
- **Usage Pattern**: `const { t } = useLanguage()` then `t("translationKey")`
- **Functionality**: ✅ **Language selector fully functional** - Click globe icon to switch between English/Spanish; changes apply instantly

### Known Limitation
- **SSR Flash**: Server-side rendering cannot access localStorage, so pages initially render in English before client-side hydration applies the correct language. This causes a brief "flash" of English content on first load or after authentication redirects.
- **Future Enhancement**: Implement cookie-based language persistence to enable SSR with correct language from first paint.

### Bilingual Pages (EN/ES)

All pages below now support **dynamic language switching** via the language selector:

**Fully Translated Components**:
- ✅ **Buyer Homepage** (/): Product cards, search bar, filters, buttons ("Add to Cart"/"Agregar al Carrito", "Buy Now"/"Comprar Ahora")
- ✅ **Product Detail Pages** (/productdes/[id]): Product descriptions, quantity selector, stock status, cart actions
- ✅ **Product Detail Test Page** (/product/[id]): Trust score badges (Excellent/Excelente, Very Good/Muy Bueno, Good/Bueno, Poor/Pobre), shipping rates testing section, product info (reviews/reseñas, in stock/en stock, out of stock/agotado), seller info (sold by/vendido por), description/descripción, navigation (back to home/volver a inicio), all toast messages
- ✅ **Purchases Page** (/compras): Order cards, status labels (Paid/Pagado, Shipped/Enviado, etc.), tabs, empty states, shipping information, tracking details, cancellation messages, banner notifications with proper pluralization
- ✅ **My Orders Page - Seller** (/my-orders): Order cards, status labels, tabs (Paid/Pagados, Shipped/Enviados, Cancelled/Cancelados), shipping information, tracking details, label printing buttons, empty states, banner notifications with proper pluralization
- ✅ **Cancel Order Dialog**: Button labels, dialog title, descriptions (seller/buyer specific), form fields, warnings, confirmation messages, error notifications
- ✅ **User Menu**: Sign In/Iniciar Sesión, My Purchases/Mis Compras, My Orders/Mis Pedidos, My Store/Mi Tienda, Admin Panel/Panel de Admin, Sign Out/Cerrar Sesión
- ✅ **Seller Dashboard** (/seller): All headings, buttons, filters, product labels, empty states
- ✅ **Payments Panel** (/seller/pagos): Statistics cards, alerts, Stripe onboarding flow, payout history, error messages
- ✅ **New Product Page** (/seller/products/new): Page title, form labels (product name, description, price, stock, images, categories, tags), buttons (create/update product, cancel, back), placeholders, error messages
- ✅ **Create Shippo Label Page** (/create-shippo-label): Page title, order items display, sender/recipient sections, package information form fields (length/width/height/weight), shipping rate selection, carrier selection, action buttons, status messages, error messages, success confirmations with proper day/days pluralization
- ✅ **Search & Filters**: "Search products..."/"Buscar productos...", "Search results for..."/"Resultados de búsqueda para:", "Clear search"/"Limpiar búsqueda"
- ✅ **Toast Notifications**: "Product added"/"Producto agregado", error messages, success confirmations

## External Dependencies

- **Authentication**: Supabase
- **Payments**: Stripe (for payments and automatic refunds)
- **Shipping Labels**: Shippo (for label generation)
- **Database**: Neon Serverless PostgreSQL, Drizzle ORM
- **UI/Styling**: Google Fonts (Inter, JetBrains Mono), Radix UI, class-variance-authority, Tailwind CSS
- **State/Forms**: TanStack Query, React Hook Form with Zod
- **Development Tools**: Replit-specific plugins, ESBuild, TypeScript
- **Internationalization**: Custom i18n system with localStorage persistence