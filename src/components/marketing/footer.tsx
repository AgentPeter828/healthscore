import Link from "next/link";

const footerLinks = {
  product: {
    title: "Product",
    links: [
      { name: "Features", href: "/features" },
      { name: "Pricing", href: "/pricing" },
      { name: "Integrations", href: "/features#integrations" },
      { name: "Changelog", href: "/changelog" },
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
      { name: "About", href: "/about" },
      { name: "Blog", href: "/blog" },
      { name: "Contact", href: "/contact" },
    ],
  },
};

export function MarketingFooter() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8 lg:gap-12">
          {/* Brand column */}
          <div className="md:col-span-2">
            <Link href="/" className="inline-block">
              <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                HealthScore
              </span>
            </Link>
            <p className="mt-3 text-sm text-gray-400 max-w-xs leading-relaxed">
              Customer health scoring that actually works
            </p>
            <p className="mt-4 text-xs text-gray-500">
              Made in Melbourne, Australia 🇦🇺
            </p>
          </div>

          {/* Link columns */}
          {Object.values(footerLinks).map((section) => (
            <div key={section.title}>
              <h3 className="text-sm font-semibold text-white tracking-wider uppercase">
                {section.title}
              </h3>
              <ul className="mt-4 space-y-3">
                {section.links.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-sm text-gray-400 hover:text-white transition-colors"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 border-t border-gray-800 pt-8">
          <p className="text-sm text-gray-500 text-center">
            &copy; 2025 Project Firestorm Pty Ltd. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
