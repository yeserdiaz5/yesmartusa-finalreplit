import { Navigation } from "@/components/navigation";
import { HeroSection } from "@/components/hero-section";
import { ComparisonSection } from "@/components/comparison-section";
import { NewsletterSection } from "@/components/newsletter-section";
import { Footer } from "@/components/footer";
import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import type { Service } from "@shared/schema";

export default function Home() {
  const { t } = useLanguage();
  const { data: services = [], isLoading } = useQuery<Service[]>({
    queryKey: ["/api/services"],
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground">{t("loading.services")}</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <main className="flex-1">
        <HeroSection />
        <ComparisonSection services={services} />
        <NewsletterSection />
      </main>
      <Footer />
    </div>
  );
}
