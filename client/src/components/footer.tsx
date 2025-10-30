import { Github, Twitter, Linkedin } from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t bg-muted/20">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <h3 className="font-bold text-lg mb-4" data-testid="text-footer-product-heading">
              Product
            </h3>
            <ul className="space-y-3">
              <li>
                <a
                  href="#"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  data-testid="link-footer-features"
                >
                  Features
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  data-testid="link-footer-pricing"
                >
                  Pricing
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  data-testid="link-footer-compare"
                >
                  Compare
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-lg mb-4" data-testid="text-footer-resources-heading">
              Resources
            </h3>
            <ul className="space-y-3">
              <li>
                <a
                  href="#"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  data-testid="link-footer-blog"
                >
                  Blog
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  data-testid="link-footer-guides"
                >
                  Guides
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  data-testid="link-footer-help"
                >
                  Help Center
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-lg mb-4" data-testid="text-footer-company-heading">
              Company
            </h3>
            <ul className="space-y-3">
              <li>
                <a
                  href="#"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  data-testid="link-footer-about"
                >
                  About
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  data-testid="link-footer-careers"
                >
                  Careers
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  data-testid="link-footer-contact"
                >
                  Contact
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-lg mb-4" data-testid="text-footer-legal-heading">
              Legal
            </h3>
            <ul className="space-y-3">
              <li>
                <a
                  href="#"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  data-testid="link-footer-privacy"
                >
                  Privacy
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  data-testid="link-footer-terms"
                >
                  Terms
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  data-testid="link-footer-cookies"
                >
                  Cookie Policy
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground" data-testid="text-footer-copyright">
            © {currentYear} ServiceCompare. All rights reserved.
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
