"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"

type Language = "en" | "es"

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    // Initialize with localStorage value if available (client-side only)
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("language") as Language
        if (saved === "en" || saved === "es") {
          return saved
        }
      } catch (e) {
        // localStorage might not be available
        console.error("Failed to read language from localStorage:", e)
      }
    }
    return "en" // Default to English
  })

  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Double-check localStorage after mount
    try {
      const saved = localStorage.getItem("language") as Language
      if (saved && (saved === "en" || saved === "es") && saved !== language) {
        setLanguageState(saved)
      }
    } catch (e) {
      console.error("Failed to read language from localStorage:", e)
    }
  }, [])

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    try {
      localStorage.setItem("language", lang)
    } catch (e) {
      console.error("Failed to save language to localStorage:", e)
    }
  }

  const t = (key: string) => {
    const translations = language === "en" ? translationsEN : translationsES
    return translations[key] || key
  }

  // Don't render until mounted on client to avoid hydration mismatch
  if (!mounted) {
    return (
      <LanguageContext.Provider value={{ language: "en", setLanguage: () => {}, t: (key: string) => translationsEN[key] || key }}>
        {children}
      </LanguageContext.Provider>
    )
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    // Return default values instead of throwing during SSR
    return {
      language: "en" as Language,
      setLanguage: () => {},
      t: (key: string) => key,
    }
  }
  return context
}

const translationsEN: Record<string, string> = {
  "home": "Home",
  "products": "Products",
  "cart": "Cart",
  "login": "Login",
  "signup": "Sign Up",
  "logout": "Logout",
  "myAccount": "My Account",
  "sellerDashboard": "Seller Dashboard",
  "myOrders": "My Orders",
  "myPurchases": "My Purchases",
  "settings": "Settings",
  "addProduct": "Add New Product",
  "myProductListings": "My Product Listings",
  "manageYourProducts": "Manage your products",
  "allStatus": "All Status",
  "active": "Active",
  "inactive": "Inactive",
  "price": "Price",
  "stock": "Stock",
  "status": "Status",
  "actions": "Actions",
  "edit": "Edit",
  "delete": "Delete",
  "viewDetails": "View Details",
  "trustScore": "Trust Score",
  "views": "Views",
  "sales": "Sales",
  "noProductsYet": "No products yet",
  "startSellingMessage": "Start selling by adding your first product",
  "addFirstProduct": "Add Your First Product",
  "addToCart": "Add to Cart",
  "buyNow": "Buy Now",
  
  // Buyer Homepage & Products
  "adding": "Adding...",
  "processing": "Processing...",
  "productAdded": "Product added",
  "productsAddedToCart": "product(s) added to cart",
  "couldNotAddToCart": "Could not add product to cart",
  "searchProducts": "Search products...",
  "searchResultsFor": "Search results for:",
  "clearSearch": "Clear search",
  "store": "Store",
  "inStock": "In stock",
  "outOfStock": "Out of stock",
  "available": "available",
  "backToProducts": "Back to products",
  "productDescription": "Product Description",
  "quantity": "Quantity:",
  "highQualityProduct": "High quality product.",
  
  // User Menu
  "signIn": "Sign In",
  "signUp": "Sign Up",
  "adminPanel": "Admin Panel",
  "signOut": "Sign Out",
  
  // Purchases Page (/compras)
  "myPurchasesTitle": "My Purchases",
  "myPurchasesSubtitle": "Here you can view all your purchases made on the marketplace",
  "noPurchases": "You have no purchases",
  "noPurchasesMessage": "When you make a purchase, it will appear here",
  "purchaseNumber": "Purchase #",
  "shippingAddress": "Shipping Address",
  "shippingInformation": "Shipping Information",
  "trackingNumber": "Tracking Number",
  "carrier": "Carrier",
  "estimatedDelivery": "Estimated delivery",
  "orderCancelled": "Order Cancelled",
  "orderItem": "Product",
  
  // Order Status
  "statusPending": "Pending",
  "statusPaid": "Paid",
  "statusShipped": "Shipped",
  "statusDelivered": "Delivered",
  "statusCancelled": "Cancelled",
  
  // Tabs
  "tabPaid": "Paid",
  "tabShipped": "Shipped",
  "tabCancelled": "Cancelled",
  "tabOther": "Other",
  
  // Empty states
  "noPaidOrders": "You have no paid orders",
  "noPaidOrdersMessage": "Purchases that have been paid but not yet shipped will appear here",
  "noShippedOrders": "You have no shipped orders",
  "noShippedOrdersMessage": "Purchases that have been shipped will appear here",
  "noCancelledOrders": "You have no cancelled orders",
  "noCancelledOrdersMessage": "Your cancelled purchase history will appear here",
  
  // Banners
  "paidOrdersBanner": "You have {count} {plural} waiting for shipment",
  "paidOrderSingular": "paid order",
  "paidOrderPlural": "paid orders",
  "shippedOrdersBanner": "{count} {plural}",
  "shippedOrderSingular": "order in transit or delivered",
  "shippedOrderPlural": "orders in transit or delivered",
  "cancelledOrdersBanner": "{count} {plural}",
  "cancelledOrderSingular": "cancelled order",
  "cancelledOrderPlural": "cancelled orders",
  "otherOrdersBanner": "{count} {plural} with unrecognized status",
  "otherOrderSingular": "order",
  "otherOrderPlural": "orders",
  "otherOrdersMessage": "These orders have a status that does not match the system's standard statuses.",
  
  // Cancel Order Dialog
  "cancelOrder": "Cancel Order",
  "cancelOrderTitle": "Cancel Order",
  "cancelOrderDescriptionSeller": "By canceling this order, an automatic refund will be processed to the buyer if the payment has already been processed.",
  "cancelOrderDescriptionBuyer": "By canceling this order, you will receive an automatic refund if the payment has already been processed.",
  "cancellationReason": "Cancellation reason",
  "selectReason": "Select a reason",
  "additionalNotes": "Additional notes (optional)",
  "additionalNotesPlaceholder": "Add additional details about the cancellation...",
  "importantLabel": "Important:",
  "cannotUndoAction": "This action cannot be undone.",
  "refundTimeBuyer": "The refund may take 5 to 10 business days to be reflected.",
  "back": "Back",
  "confirmCancellation": "Confirm Cancellation",
  "orderCancelledTitle": "Order Cancelled",
  "orderCancelledSuccess": "The order has been successfully cancelled",
  "pleaseSelectReason": "Please select a reason to cancel",
  "couldNotCancelOrder": "Could not cancel the order",
  "errorCancellingOrder": "An error occurred while canceling the order",
  
  "checkout": "Checkout",
  "total": "Total",
  "subtotal": "Subtotal",
  "shipping": "Shipping",
  "tax": "Tax",
  "payNow": "Pay Now",
  "orderPlaced": "Order Placed",
  "orderConfirmation": "Order Confirmation",
  "thankYou": "Thank you for your order!",
  "orderNumber": "Order Number",
  "orderDate": "Order Date",
  "estimatedDelivery": "Estimated Delivery",
  "trackOrder": "Track Order",
  "seller": "Seller",
  "buyer": "Buyer",
  "quantity": "Quantity",
  "description": "Description",
  "category": "Category",
  "productName": "Product Name",
  "productDescription": "Product Description",
  "productPrice": "Product Price",
  "productStock": "Product Stock",
  "productImage": "Product Image",
  "uploadImage": "Upload Image",
  "save": "Save",
  "cancel": "Cancel",
  "confirm": "Confirm",
  "yes": "Yes",
  "no": "No",
  "search": "Search",
  "filter": "Filter",
  "sort": "Sort",
  "newest": "Newest",
  "oldest": "Oldest",
  "lowToHigh": "Price: Low to High",
  "highToLow": "Price: High to Low",
  "storeName": "Store Name",
  "fullName": "Full Name",
  "email": "Email",
  "phone": "Phone",
  "address": "Address",
  "city": "City",
  "state": "State",
  "zipCode": "Zip Code",
  "country": "Country",
  "myEarnings": "My Earnings",
  "totalEarnings": "Total Earnings",
  "availableBalance": "Available Balance",
  "pendingBalance": "Pending Balance",
  "payoutSchedule": "Payout Schedule",
  "transferHistory": "Transfer History",
  "setupStripeAccount": "Setup Stripe Account",
  "paymentsAndEarnings": "Payments and Earnings",
  "backToPanel": "Back to Panel",
  "howPaymentsWork": "How Payments Work",
  "stripeConnectInfo": "Connect your bank account through Stripe Connect to receive payments directly from your sales.",
  "automaticPayouts": "Automatic Payouts",
  "automaticPayoutsInfo": "Stripe will automatically transfer your funds to your bank account according to your payout schedule.",
  "trackEarnings": "Track Earnings",
  "trackEarningsInfo": "View your sales, available balance, and complete transfer history in real-time.",
  "noTransfers": "No transfers yet",
  "noTransfersInfo": "Once you start receiving payments, your transfer history will appear here.",
  "paidOut": "Paid Out",
  "pending": "Pending",
  "inTransit": "In Transit",
  "failed": "Failed",
  "created": "Created",
  "arrivalDate": "Arrival Date",
  "amount": "Amount",
  "daily": "Daily",
  "weekly": "Weekly",
  "monthly": "Monthly",
  "manual": "Manual",
  "paid": "Paid",
  "shipped": "Shipped",
  "cancelled": "Cancelled",
  "orderStatus": "Order Status",
  "cancelOrder": "Cancel Order",
  "reasonForCancellation": "Reason for Cancellation",
  "cancelReason.outOfStock": "Product out of stock",
  "cancelReason.priceError": "Price error",
  "cancelReason.cannotFulfill": "Cannot fulfill order",
  "cancelReason.duplicate": "Duplicate order",
  "cancelReason.changedMind": "Changed my mind",
  "cancelReason.betterPrice": "Found better price",
  "cancelReason.tookTooLong": "Took too long",
  "cancelReason.mistake": "Made a mistake",
  "cancelReason.other": "Other reason",
  "orderCancelled": "Order Cancelled",
  "refundProcessing": "Refund is being processed",
  "refundInfo": "The refund will be returned to your original payment method within 5-10 business days.",
  "trackingNumber": "Tracking Number",
  "carrier": "Carrier",
  "shippingLabel": "Shipping Label",
  "downloadLabel": "Download Label",
  "createShippingLabel": "Create Shipping Label",
  "sellerStore": "Seller Store",
  "visitStore": "Visit Store",
  "allProducts": "All Products",
  "noProducts": "No products found",
  "loading": "Loading...",
  "error": "Error",
  "success": "Success",
  "warning": "Warning",
  "info": "Info",
  "notifications": "Notifications",
  "noNotifications": "No notifications",
  "markAsRead": "Mark as Read",
  "deleteNotification": "Delete Notification",
  "newOrder": "New Order",
  "orderUpdate": "Order Update",
  "productUpdate": "Product Update",
  "systemNotification": "System Notification",
  "backToDashboard": "Back to Dashboard",
  "managePaymentsDescription": "Manage your payments and view your Stripe earnings",
  "notConfigured": "Not configured",
  "scheduleDaily": "Daily (with {days} days delay)",
  "scheduleWeekly": "Weekly (every {day}, with {days} days delay)",
  "scheduleMonthly": "Monthly (day {day}, with {days} days delay)",
  "setupComplete": "Setup complete! Your Stripe account is ready to receive payments.",
  "needsOnboardingMessage": "To receive payments, you need to complete your Stripe account setup. Click the 'Setup Stripe Account' button to begin.",
  "completedSales": "From {count} completed sales",
  "readyToTransfer": "Ready to transfer",
  "nextPayoutIn": "Next payout in {days} days",
  "awaitingProcessing": "Awaiting processing",
  "connecting": "Connecting",
  "step1Title": "Customers pay with Stripe",
  "step1Description": "When a customer purchases your products, payment is securely processed through Stripe.",
  "step2Title": "Stripe holds funds temporarily",
  "step2Description": "Payments are held securely while the transaction is processed (typically {days} days).",
  "step3Title": "You receive payments automatically",
  "step3Description": "Stripe transfers your earnings directly to your bank account according to your configured schedule.",
  "transferHistoryDescription": "Stripe transfers to your bank account",
  "setupStripeAccountTitle": "Setup your Stripe account",
  "setupStripeAccountDescription": "Once your account is set up, your transfers will appear here",
  "stripeSetupError": "Error setting up Stripe",
  "unknownError": "Unknown error",
  "error": "Error"
}

const translationsES: Record<string, string> = {
  "home": "Inicio",
  "products": "Productos",
  "cart": "Carrito",
  "login": "Iniciar Sesión",
  "signup": "Registrarse",
  "logout": "Cerrar Sesión",
  "myAccount": "Mi Cuenta",
  "sellerDashboard": "Panel del Vendedor",
  "myOrders": "Mis Pedidos",
  "myPurchases": "Mis Compras",
  "settings": "Configuración",
  "addProduct": "Agregar Producto",
  "myProductListings": "Mis Productos Publicados",
  "manageYourProducts": "Administra tus productos",
  "allStatus": "Todos los Estados",
  "active": "Activo",
  "inactive": "Inactivo",
  "price": "Precio",
  "stock": "Stock",
  "status": "Estado",
  "actions": "Acciones",
  "edit": "Editar",
  "delete": "Eliminar",
  "viewDetails": "Ver Detalles",
  "trustScore": "Puntuación de Confianza",
  "views": "Vistas",
  "sales": "Ventas",
  "noProductsYet": "No hay productos todavía",
  "startSellingMessage": "Comienza a vender agregando tu primer producto",
  "addFirstProduct": "Agregar Tu Primer Producto",
  "addToCart": "Agregar al Carrito",
  "buyNow": "Comprar Ahora",
  
  // Buyer Homepage & Products
  "adding": "Agregando...",
  "processing": "Procesando...",
  "productAdded": "Producto agregado",
  "productsAddedToCart": "producto(s) agregado(s) al carrito",
  "couldNotAddToCart": "No se pudo agregar el producto al carrito",
  "searchProducts": "Buscar productos...",
  "searchResultsFor": "Resultados de búsqueda para:",
  "clearSearch": "Limpiar búsqueda",
  "store": "Tienda",
  "inStock": "En stock",
  "outOfStock": "Agotado",
  "available": "disponibles",
  "backToProducts": "Volver a productos",
  "productDescription": "Descripción del Producto",
  "quantity": "Cantidad:",
  "highQualityProduct": "Producto de alta calidad.",
  
  // User Menu
  "signIn": "Iniciar Sesión",
  "signUp": "Registrarse",
  "adminPanel": "Panel de Admin",
  "signOut": "Cerrar Sesión",
  
  // Purchases Page (/compras)
  "myPurchasesTitle": "Mis Compras",
  "myPurchasesSubtitle": "Aquí puedes ver todas tus compras realizadas en el marketplace",
  "noPurchases": "No tienes compras",
  "noPurchasesMessage": "Cuando realices una compra, aparecerá aquí",
  "purchaseNumber": "Compra #",
  "shippingAddress": "Dirección de Envío",
  "shippingInformation": "Información de Envío",
  "trackingNumber": "Número de Rastreo",
  "carrier": "Transportista",
  "estimatedDelivery": "Entrega estimada",
  "orderCancelled": "Compra Cancelada",
  "orderItem": "Producto",
  
  // Order Status
  "statusPending": "Pendiente",
  "statusPaid": "Pagado",
  "statusShipped": "Enviado",
  "statusDelivered": "Entregado",
  "statusCancelled": "Cancelado",
  
  // Tabs
  "tabPaid": "Pagados",
  "tabShipped": "Enviados",
  "tabCancelled": "Cancelados",
  "tabOther": "Otros",
  
  // Empty states
  "noPaidOrders": "No tienes compras pagadas",
  "noPaidOrdersMessage": "Las compras que hayas pagado pero aún no enviadas aparecerán aquí",
  "noShippedOrders": "No tienes compras enviadas",
  "noShippedOrdersMessage": "Las compras que hayan sido enviadas aparecerán aquí",
  "noCancelledOrders": "No tienes compras canceladas",
  "noCancelledOrdersMessage": "El historial de compras canceladas aparecerá aquí",
  
  // Banners
  "paidOrdersBanner": "Tienes {count} {plural} esperando envío",
  "paidOrderSingular": "compra pagada",
  "paidOrderPlural": "compras pagadas",
  "shippedOrdersBanner": "{count} {plural}",
  "shippedOrderSingular": "compra en tránsito o entregada",
  "shippedOrderPlural": "compras en tránsito o entregadas",
  "cancelledOrdersBanner": "{count} {plural}",
  "cancelledOrderSingular": "compra cancelada",
  "cancelledOrderPlural": "compras canceladas",
  "otherOrdersBanner": "{count} {plural} con estado no reconocido",
  "otherOrderSingular": "compra",
  "otherOrderPlural": "compras",
  "otherOrdersMessage": "Estas compras tienen un estado que no coincide con los estados estándar del sistema.",
  
  // Cancel Order Dialog
  "cancelOrder": "Cancelar Pedido",
  "cancelOrderTitle": "Cancelar Pedido",
  "cancelOrderDescriptionSeller": "Al cancelar este pedido, se procesará un reembolso automático al comprador si el pago ya fue procesado.",
  "cancelOrderDescriptionBuyer": "Al cancelar este pedido, recibirás un reembolso automático si el pago ya fue procesado.",
  "cancellationReason": "Razón de cancelación",
  "selectReason": "Selecciona una razón",
  "additionalNotes": "Notas adicionales (opcional)",
  "additionalNotesPlaceholder": "Agrega detalles adicionales sobre la cancelación...",
  "importantLabel": "Importante:",
  "cannotUndoAction": "Esta acción no se puede deshacer.",
  "refundTimeBuyer": "El reembolso puede tardar de 5 a 10 días hábiles en reflejarse.",
  "back": "Volver",
  "confirmCancellation": "Confirmar Cancelación",
  "orderCancelledTitle": "Pedido cancelado",
  "orderCancelledSuccess": "El pedido ha sido cancelado exitosamente",
  "pleaseSelectReason": "Por favor selecciona una razón para cancelar",
  "couldNotCancelOrder": "No se pudo cancelar el pedido",
  "errorCancellingOrder": "Ocurrió un error al cancelar el pedido",
  
  "checkout": "Pagar",
  "total": "Total",
  "subtotal": "Subtotal",
  "shipping": "Envío",
  "tax": "Impuesto",
  "payNow": "Pagar Ahora",
  "orderPlaced": "Pedido Realizado",
  "orderConfirmation": "Confirmación de Pedido",
  "thankYou": "¡Gracias por tu pedido!",
  "orderNumber": "Número de Pedido",
  "orderDate": "Fecha de Pedido",
  "estimatedDelivery": "Entrega Estimada",
  "trackOrder": "Rastrear Pedido",
  "seller": "Vendedor",
  "buyer": "Comprador",
  "quantity": "Cantidad",
  "description": "Descripción",
  "category": "Categoría",
  "productName": "Nombre del Producto",
  "productDescription": "Descripción del Producto",
  "productPrice": "Precio del Producto",
  "productStock": "Stock del Producto",
  "productImage": "Imagen del Producto",
  "uploadImage": "Subir Imagen",
  "save": "Guardar",
  "cancel": "Cancelar",
  "confirm": "Confirmar",
  "yes": "Sí",
  "no": "No",
  "search": "Buscar",
  "filter": "Filtrar",
  "sort": "Ordenar",
  "newest": "Más Nuevos",
  "oldest": "Más Antiguos",
  "lowToHigh": "Precio: Menor a Mayor",
  "highToLow": "Precio: Mayor a Menor",
  "storeName": "Nombre de la Tienda",
  "fullName": "Nombre Completo",
  "email": "Correo Electrónico",
  "phone": "Teléfono",
  "address": "Dirección",
  "city": "Ciudad",
  "state": "Estado",
  "zipCode": "Código Postal",
  "country": "País",
  "myEarnings": "Mis Ganancias",
  "totalEarnings": "Ganancias Totales",
  "availableBalance": "Saldo Disponible",
  "pendingBalance": "Saldo Pendiente",
  "payoutSchedule": "Calendario de Pagos",
  "transferHistory": "Historial de Transferencias",
  "setupStripeAccount": "Configurar Cuenta de Stripe",
  "paymentsAndEarnings": "Pagos y Ganancias",
  "backToPanel": "Volver al Panel",
  "howPaymentsWork": "Cómo Funcionan los Pagos",
  "stripeConnectInfo": "Conecta tu cuenta bancaria mediante Stripe Connect para recibir pagos directamente de tus ventas.",
  "automaticPayouts": "Pagos Automáticos",
  "automaticPayoutsInfo": "Stripe transferirá automáticamente tus fondos a tu cuenta bancaria según tu calendario de pagos.",
  "trackEarnings": "Seguimiento de Ganancias",
  "trackEarningsInfo": "Ve tus ventas, saldo disponible e historial completo de transferencias en tiempo real.",
  "noTransfers": "No hay transferencias aún",
  "noTransfersInfo": "Una vez que comiences a recibir pagos, tu historial de transferencias aparecerá aquí.",
  "paidOut": "Pagado",
  "pending": "Pendiente",
  "inTransit": "En Tránsito",
  "failed": "Fallido",
  "created": "Creado",
  "arrivalDate": "Fecha de Llegada",
  "amount": "Monto",
  "daily": "Diario",
  "weekly": "Semanal",
  "monthly": "Mensual",
  "manual": "Manual",
  "paid": "Pagado",
  "shipped": "Enviado",
  "cancelled": "Cancelado",
  "orderStatus": "Estado del Pedido",
  "cancelOrder": "Cancelar Pedido",
  "reasonForCancellation": "Razón de Cancelación",
  "cancelReason.outOfStock": "Producto agotado",
  "cancelReason.priceError": "Error en el precio",
  "cancelReason.cannotFulfill": "No puedo cumplir el pedido",
  "cancelReason.duplicate": "Pedido duplicado",
  "cancelReason.changedMind": "Cambié de opinión",
  "cancelReason.betterPrice": "Encontré mejor precio",
  "cancelReason.tookTooLong": "Tardó demasiado",
  "cancelReason.mistake": "Cometí un error",
  "cancelReason.other": "Otra razón",
  "orderCancelled": "Pedido Cancelado",
  "refundProcessing": "El reembolso está siendo procesado",
  "refundInfo": "El reembolso será devuelto a tu método de pago original en 5-10 días hábiles.",
  "trackingNumber": "Número de Rastreo",
  "carrier": "Transportista",
  "shippingLabel": "Etiqueta de Envío",
  "downloadLabel": "Descargar Etiqueta",
  "createShippingLabel": "Crear Etiqueta de Envío",
  "sellerStore": "Tienda del Vendedor",
  "visitStore": "Visitar Tienda",
  "allProducts": "Todos los Productos",
  "noProducts": "No se encontraron productos",
  "loading": "Cargando...",
  "error": "Error",
  "success": "Éxito",
  "warning": "Advertencia",
  "info": "Información",
  "notifications": "Notificaciones",
  "noNotifications": "No hay notificaciones",
  "markAsRead": "Marcar como Leído",
  "deleteNotification": "Eliminar Notificación",
  "newOrder": "Nuevo Pedido",
  "orderUpdate": "Actualización de Pedido",
  "productUpdate": "Actualización de Producto",
  "systemNotification": "Notificación del Sistema",
  "backToDashboard": "Volver al Panel",
  "managePaymentsDescription": "Administra tus pagos y visualiza tus ganancias de Stripe",
  "notConfigured": "No configurado",
  "scheduleDaily": "Diario (con {days} días de retraso)",
  "scheduleWeekly": "Semanal (cada {day}, con {days} días de retraso)",
  "scheduleMonthly": "Mensual (día {day}, con {days} días de retraso)",
  "setupComplete": "¡Configuración completada! Tu cuenta de Stripe está lista para recibir pagos.",
  "needsOnboardingMessage": "Para recibir pagos, necesitas completar la configuración de tu cuenta de Stripe. Haz clic en el botón 'Configurar Cuenta de Stripe' para comenzar.",
  "completedSales": "De {count} ventas completadas",
  "readyToTransfer": "Listo para transferir",
  "nextPayoutIn": "Próximo pago en {days} días",
  "awaitingProcessing": "Esperando procesamiento",
  "connecting": "Conectando",
  "step1Title": "Los clientes pagan con Stripe",
  "step1Description": "Cuando un cliente compra tus productos, el pago se procesa de forma segura a través de Stripe.",
  "step2Title": "Stripe retiene los fondos temporalmente",
  "step2Description": "Los pagos se mantienen seguros mientras se procesa la transacción (típicamente {days} días).",
  "step3Title": "Recibes tus pagos automáticamente",
  "step3Description": "Stripe transfiere tus ganancias directamente a tu cuenta bancaria según el calendario configurado.",
  "transferHistoryDescription": "Transferencias de Stripe a tu cuenta bancaria",
  "setupStripeAccountTitle": "Configura tu cuenta de Stripe",
  "setupStripeAccountDescription": "Una vez configurada tu cuenta, tus transferencias aparecerán aquí",
  "stripeSetupError": "Error al configurar Stripe",
  "unknownError": "Error desconocido",
  "error": "Error"
}
