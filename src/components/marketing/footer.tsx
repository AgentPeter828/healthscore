import Link from "next/link";

const footerLinks = {
  product: {
    title: "Product",
    links: [
      { name: "Features", href: "/features" },
      { name: "Pricing", href: "/pricing" },
      { name: "Integrations", href: "/features#integrations" },
      { name: "Sign Up Free", href: "/signup" },
    ],
  },
  alternatives: {
    title: "Alternatives",
    links: [
      { name: "vs Custify", href: "/alternative-to-custify" },
      { name: "vs ChurnZero", href: "/alternative-to-churnzero" },
      { name: "vs Gainsight", href: "/alternative-to-gainsight" },
    ],
  },
  legal: {
    title: "Legal",
    links: [
      { name: "Terms", href: "/terms" },
      { name: "Privacy", href: "/privacy" },
      { name: "Refund Policy", href: "/refund" },
    ],
  },
  company: {
    title: "Company",
    links: [
      { name: "Contact", href: "mailto:hello@projectfirestorm.com" },
    ],
  },
};

export function MarketingFooter() {
  return (
    <footer className="bg-gray-50 text-gray-600 border-t border-gray-200">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8 lg:gap-12">
          {/* Brand column */}
          <div className="md:col-span-2">
            <Link href="/" className="inline-block">
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                HealthScore
              </span>
            </Link>
            <p className="mt-3 text-sm text-gray-500 max-w-xs leading-relaxed">
              Customer health scoring that actually works
            </p>
            <p className="mt-4 text-xs text-gray-400">
              Made in Melbourne, Australia 🇦🇺
            </p>
          </div>

          {/* Link columns */}
          {Object.values(footerLinks).map((section) => (
            <div key={section.title}>
              <h3 className="text-sm font-semibold text-gray-900 tracking-wider uppercase">
                {section.title}
              </h3>
              <ul className="mt-4 space-y-3">
                {section.links.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 border-t border-gray-200 pt-8">
          <p className="text-sm text-gray-400 text-center">
            &copy; {new Date().getFullYear()} Project Firestorm Pty Ltd. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
