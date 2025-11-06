import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageSelector } from "@/components/language-selector";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useState } from "react";

export function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { t } = useLanguage();

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
      setMobileMenuOpen(false);
    }
  };

  return (
    <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b transition-colors">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <div className="font-bold text-xl tracking-tight" data-testid="text-brand-name">
              ServiceCompare
            </div>
          </div>

          <div className="hidden md:flex items-center gap-6">
            <button
              onClick={() => scrollToSection("compare")}
              className="text-sm font-medium text-foreground hover-elevate px-3 py-2 rounded-md transition-colors"
              data-testid="link-compare"
            >
              {t("nav.compare")}
            </button>
            <button
              onClick={() => scrollToSection("pricing")}
              className="text-sm font-medium text-foreground hover-elevate px-3 py-2 rounded-md transition-colors"
              data-testid="link-pricing"
            >
              {t("nav.pricing")}
            </button>
            <button
              onClick={() => scrollToSection("subscribe")}
              className="text-sm font-medium text-foreground hover-elevate px-3 py-2 rounded-md transition-colors"
              data-testid="link-subscribe"
            >
              {t("nav.subscribe")}
            </button>
            <LanguageSelector />
            <ThemeToggle />
          </div>

          <div className="md:hidden flex items-center gap-2">
            <LanguageSelector />
            <ThemeToggle />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              data-testid="button-mobile-menu"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden border-t bg-background">
          <div className="px-6 py-4 space-y-3">
            <button
              onClick={() => scrollToSection("compare")}
              className="block w-full text-left text-sm font-medium text-foreground hover-elevate px-3 py-2 rounded-md transition-colors"
              data-testid="link-compare-mobile"
            >
              {t("nav.compare")}
            </button>
            <button
              onClick={() => scrollToSection("pricing")}
              className="block w-full text-left text-sm font-medium text-foreground hover-elevate px-3 py-2 rounded-md transition-colors"
              data-testid="link-pricing-mobile"
            >
              {t("nav.pricing")}
            </button>
            <button
              onClick={() => scrollToSection("subscribe")}
              className="block w-full text-left text-sm font-medium text-foreground hover-elevate px-3 py-2 rounded-md transition-colors"
              data-testid="link-subscribe-mobile"
            >
              {t("nav.subscribe")}
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
