import { Github, Twitter, Linkedin } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export function Footer() {
  const { t } = useLanguage();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t bg-muted/20">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <h3 className="font-bold text-lg mb-4" data-testid="text-footer-product-heading">
              {t("footer.product")}
            </h3>
            <ul className="space-y-3">
              <li>
                <a
                  href="#"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  data-testid="link-footer-features"
                >
                  {t("footer.features")}
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  data-testid="link-footer-pricing"
                >
                  {t("footer.pricing")}
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  data-testid="link-footer-compare"
                >
                  {t("footer.compare")}
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-lg mb-4" data-testid="text-footer-resources-heading">
              {t("footer.resources")}
            </h3>
            <ul className="space-y-3">
              <li>
                <a
                  href="#"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  data-testid="link-footer-blog"
                >
                  {t("footer.blog")}
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  data-testid="link-footer-guides"
                >
                  {t("footer.guides")}
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  data-testid="link-footer-help"
                >
                  {t("footer.helpCenter")}
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-lg mb-4" data-testid="text-footer-company-heading">
              {t("footer.company")}
            </h3>
            <ul className="space-y-3">
              <li>
                <a
                  href="#"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  data-testid="link-footer-about"
                >
                  {t("footer.about")}
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  data-testid="link-footer-careers"
                >
                  {t("footer.careers")}
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  data-testid="link-footer-contact"
                >
                  {t("footer.contact")}
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-lg mb-4" data-testid="text-footer-legal-heading">
              {t("footer.legal")}
            </h3>
            <ul className="space-y-3">
              <li>
                <a
                  href="#"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  data-testid="link-footer-privacy"
                >
                  {t("footer.privacy")}
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  data-testid="link-footer-terms"
                >
                  {t("footer.terms")}
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  data-testid="link-footer-cookies"
                >
                  {t("footer.cookies")}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground" data-testid="text-footer-copyright">
            {t("footer.copyright").replace("{year}", currentYear.toString())}
          </p>

          <div className="flex items-center gap-4">
            <a
              href="#"
              aria-label="Twitter"
              className="text-muted-foreground hover:text-foreground transition-colors"
              data-testid="link-social-twitter"
            >
              <Twitter className="h-5 w-5" />
            </a>
            <a
              href="#"
              aria-label="GitHub"
              className="text-muted-foreground hover:text-foreground transition-colors"
              data-testid="link-social-github"
            >
              <Github className="h-5 w-5" />
            </a>
            <a
              href="#"
              aria-label="LinkedIn"
              className="text-muted-foreground hover:text-foreground transition-colors"
              data-testid="link-social-linkedin"
            >
              <Linkedin className="h-5 w-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
