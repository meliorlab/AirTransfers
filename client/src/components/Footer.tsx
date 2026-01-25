import { Facebook, Twitter, Instagram, Youtube, Mail } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-muted text-foreground">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-3 gap-8 lg:gap-12 mb-8">
          <div>
            <h3 className="text-lg font-heading font-semibold mb-4">Logo</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Reliable airport transfer/taxi service to your destination safely and comfortably
            </p>
            <div className="flex gap-3">
              <a
                href="#"
                data-testid="link-facebook"
                className="w-9 h-9 rounded-md bg-background hover-elevate active-elevate-2 flex items-center justify-center"
                aria-label="Facebook"
              >
                <Facebook className="w-4 h-4" />
              </a>
              <a
                href="#"
                data-testid="link-twitter"
                className="w-9 h-9 rounded-md bg-background hover-elevate active-elevate-2 flex items-center justify-center"
                aria-label="Twitter"
              >
                <Twitter className="w-4 h-4" />
              </a>
              <a
                href="#"
                data-testid="link-instagram"
                className="w-9 h-9 rounded-md bg-background hover-elevate active-elevate-2 flex items-center justify-center"
                aria-label="Instagram"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href="#"
                data-testid="link-youtube"
                className="w-9 h-9 rounded-md bg-background hover-elevate active-elevate-2 flex items-center justify-center"
                aria-label="YouTube"
              >
                <Youtube className="w-4 h-4" />
              </a>
              <a
                href="#"
                data-testid="link-email"
                className="w-9 h-9 rounded-md bg-background hover-elevate active-elevate-2 flex items-center justify-center"
                aria-label="Email"
              >
                <Mail className="w-4 h-4" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="text-base font-heading font-semibold mb-4">Support</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#" data-testid="link-contact" className="text-muted-foreground hover:text-foreground transition-colors">
                  Contact Us
                </a>
              </li>
              <li>
                <a href="#" data-testid="link-faq" className="text-muted-foreground hover:text-foreground transition-colors">
                  FAQs
                </a>
              </li>
              <li>
                <a href="#" data-testid="link-terms" className="text-muted-foreground hover:text-foreground transition-colors">
                  Terms & Policy
                </a>
              </li>
              <li>
                <a href="#" data-testid="link-privacy" className="text-muted-foreground hover:text-foreground transition-colors">
                  Privacy Policy
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-base font-heading font-semibold mb-4">Contact</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li data-testid="text-phone">+1 (234) 123-4567</li>
              <li data-testid="text-email">contact@airtransfer.com</li>
              <li data-testid="text-support">24/7 Support</li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-border text-center text-sm text-muted-foreground">
          <p data-testid="text-copyright">© 2025 Island Port Transfers. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
