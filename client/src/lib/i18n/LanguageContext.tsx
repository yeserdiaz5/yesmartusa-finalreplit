import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

type Language = "en" | "es";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("language") as Language;
        if (saved === "en" || saved === "es") {
          return saved;
        }
      } catch (e) {
        console.error("Failed to read language from localStorage:", e);
      }
    }
    return "en";
  });

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const saved = localStorage.getItem("language") as Language;
      if (saved && (saved === "en" || saved === "es") && saved !== language) {
        setLanguageState(saved);
      }
    } catch (e) {
      console.error("Failed to read language from localStorage:", e);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem("language", lang);
    } catch (e) {
      console.error("Failed to save language to localStorage:", e);
    }
  };

  const t = (key: string) => {
    const translations = language === "en" ? translationsEN : translationsES;
    return translations[key] || key;
  };

  if (!mounted) {
    return (
      <LanguageContext.Provider value={{ language: "en", setLanguage: () => {}, t: (key: string) => translationsEN[key] || key }}>
        {children}
      </LanguageContext.Provider>
    );
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    return {
      language: "en" as Language,
      setLanguage: () => {},
      t: (key: string) => key,
    };
  }
  return context;
}

const translationsEN: Record<string, string> = {
  // Navigation
  "nav.compare": "Compare",
  "nav.pricing": "Pricing",
  "nav.subscribe": "Subscribe",
  
  // Hero Section
  "hero.title": "Compare Services,",
  "hero.titleHighlight": "Make Smart Choices",
  "hero.description": "Cut through the noise and find the perfect plan for your needs. Compare pricing, features, and benefits side-by-side with our intuitive comparison tools.",
  "hero.ctaCompare": "Start Comparing",
  "hero.ctaUpdates": "Get Updates",
  
  // Comparison Section
  "comparison.heading": "Compare Plans & Pricing",
  "comparison.description": "Find the perfect plan for your needs. All plans include our core features with varying levels of access and support.",
  "comparison.viewCards": "Cards",
  "comparison.viewTable": "Table",
  "comparison.noServices": "No services found for this category.",
  
  // Filter Sort Bar
  "filter.label": "Filter:",
  "filter.allServices": "All Services",
  "sort.label": "Sort:",
  "sort.popular": "Most Popular",
  "sort.priceLow": "Price: Low to High",
  "sort.priceHigh": "Price: High to Low",
  "sort.name": "Name A-Z",
  
  // Newsletter Section
  "newsletter.heading": "Stay Updated with Exclusive Insights",
  "newsletter.description": "Get the latest service comparisons, pricing updates, and exclusive deals delivered straight to your inbox. Join over 10,000 subscribers.",
  "newsletter.emailLabel": "Email Address",
  "newsletter.emailPlaceholder": "you@example.com",
  "newsletter.ctaSubscribe": "Subscribe Now",
  "newsletter.ctaSubscribing": "Subscribing...",
  "newsletter.privacy": "We respect your privacy. Unsubscribe at any time.",
  "newsletter.successHeading": "You're all set!",
  "newsletter.successDescription": "Welcome to our community. Check your email for confirmation.",
  "newsletter.toastSuccessTitle": "Successfully subscribed!",
  "newsletter.toastSuccessDescription": "Check your inbox for a confirmation email.",
  "newsletter.toastErrorTitle": "Subscription failed",
  "newsletter.toastErrorDescription": "Please try again later.",
  
  // Footer
  "footer.product": "Product",
  "footer.features": "Features",
  "footer.pricing": "Pricing",
  "footer.compare": "Compare",
  "footer.resources": "Resources",
  "footer.blog": "Blog",
  "footer.guides": "Guides",
  "footer.helpCenter": "Help Center",
  "footer.company": "Company",
  "footer.about": "About",
  "footer.careers": "Careers",
  "footer.contact": "Contact",
  "footer.legal": "Legal",
  "footer.privacy": "Privacy",
  "footer.terms": "Terms",
  "footer.cookies": "Cookie Policy",
  "footer.copyright": "© {year} ServiceCompare. All rights reserved.",
  
  // Loading
  "loading.services": "Loading services...",
};

const translationsES: Record<string, string> = {
  // Navigation
  "nav.compare": "Comparar",
  "nav.pricing": "Precios",
  "nav.subscribe": "Suscribirse",
  
  // Hero Section
  "hero.title": "Compara Servicios,",
  "hero.titleHighlight": "Toma Decisiones Inteligentes",
  "hero.description": "Corta el ruido y encuentra el plan perfecto para tus necesidades. Compara precios, características y beneficios lado a lado con nuestras herramientas intuitivas de comparación.",
  "hero.ctaCompare": "Comenzar a Comparar",
  "hero.ctaUpdates": "Recibir Actualizaciones",
  
  // Comparison Section
  "comparison.heading": "Compara Planes y Precios",
  "comparison.description": "Encuentra el plan perfecto para tus necesidades. Todos los planes incluyen nuestras características principales con diferentes niveles de acceso y soporte.",
  "comparison.viewCards": "Tarjetas",
  "comparison.viewTable": "Tabla",
  "comparison.noServices": "No se encontraron servicios para esta categoría.",
  
  // Filter Sort Bar
  "filter.label": "Filtrar:",
  "filter.allServices": "Todos los Servicios",
  "sort.label": "Ordenar:",
  "sort.popular": "Más Popular",
  "sort.priceLow": "Precio: Menor a Mayor",
  "sort.priceHigh": "Precio: Mayor a Menor",
  "sort.name": "Nombre A-Z",
  
  // Newsletter Section
  "newsletter.heading": "Mantente Actualizado con Información Exclusiva",
  "newsletter.description": "Recibe las últimas comparaciones de servicios, actualizaciones de precios y ofertas exclusivas directamente en tu bandeja de entrada. Únete a más de 10,000 suscriptores.",
  "newsletter.emailLabel": "Correo Electrónico",
  "newsletter.emailPlaceholder": "tu@ejemplo.com",
  "newsletter.ctaSubscribe": "Suscribirse Ahora",
  "newsletter.ctaSubscribing": "Suscribiendo...",
  "newsletter.privacy": "Respetamos tu privacidad. Cancela en cualquier momento.",
  "newsletter.successHeading": "¡Todo listo!",
  "newsletter.successDescription": "Bienvenido a nuestra comunidad. Revisa tu correo para confirmación.",
  "newsletter.toastSuccessTitle": "¡Suscripción exitosa!",
  "newsletter.toastSuccessDescription": "Revisa tu bandeja de entrada para un correo de confirmación.",
  "newsletter.toastErrorTitle": "Suscripción fallida",
  "newsletter.toastErrorDescription": "Por favor intenta de nuevo más tarde.",
  
  // Footer
  "footer.product": "Producto",
  "footer.features": "Características",
  "footer.pricing": "Precios",
  "footer.compare": "Comparar",
  "footer.resources": "Recursos",
  "footer.blog": "Blog",
  "footer.guides": "Guías",
  "footer.helpCenter": "Centro de Ayuda",
  "footer.company": "Empresa",
  "footer.about": "Acerca de",
  "footer.careers": "Carreras",
  "footer.contact": "Contacto",
  "footer.legal": "Legal",
  "footer.privacy": "Privacidad",
  "footer.terms": "Términos",
  "footer.cookies": "Política de Cookies",
  "footer.copyright": "© {year} ServiceCompare. Todos los derechos reservados.",
  
  // Loading
  "loading.services": "Cargando servicios...",
};
