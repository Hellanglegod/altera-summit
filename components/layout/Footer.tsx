"use client";

import Link from "next/link";
import { Mail, MapPin, Globe, Phone } from "lucide-react";

const contactLinks = [
  {
    icon: Mail,
    href: "mailto:contact@alterasummit.com",
    label: "contact@alterasummit.com",
  },
  { icon: Globe, href: "#", label: "www.alterasummit.com" },
  { icon: MapPin, href: "#", label: "TBD" },
  { icon: Phone, href: "#", label: "+1 (555) 000-0000" },
];

const quickLinks = [
  { href: "#about", label: "About" },
  { href: "#committees", label: "Committees" },
  { href: "#applications", label: "Apply" },
  { href: "#schedule", label: "Schedule" },
];

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative bg-nebula-purple-1 border-t border-border-cosmic-blue">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-bg-void to-transparent opacity-50" />

      <div className="relative container-cosmic py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8">
          {/* Brand Section */}
          <div className="space-y-4">
            <Link href="/" className="inline-block">
              <span className="font-display text-2xl font-bold text-gold-primary">
                ALTERA
              </span>
              <span className="font-heading text-lg text-text-stardust/80 ml-2">
                Summit
              </span>
            </Link>
            <p className="text-sm text-text-stardust/60 leading-relaxed">
              Forging Destiny Among the Stars. An elite Model United Nations
              conference blending cosmology with classical antiquity.
            </p>
            <div className="flex items-center gap-2 text-sm text-text-stardust/60">
              <MapPin size={16} className="text-gold-primary" />
              <span>TBD</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-heading text-lg text-text-stardust mb-4">
              Quick Links
            </h3>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-text-stardust/60 hover:text-gold-primary transition-colors duration-300"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact & Social */}
          <div>
            <h3 className="font-heading text-lg text-text-stardust mb-4">
              Contact Us
            </h3>
            <div className="space-y-3">
              {contactLinks.map((contact, idx) => (
                <a
                  key={idx}
                  href={contact.href}
                  className="flex items-center gap-3 text-sm text-text-stardust/60 hover:text-gold-primary transition-colors duration-300 group"
                >
                  <div className="p-2 rounded-lg bg-nebula-purple-2 group-hover:bg-nebula-purple-1 transition-colors duration-300">
                    <contact.icon size={18} />
                  </div>
                  <span>{contact.label}</span>
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="divider-cosmic my-8" />

        {/* Copyright */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-text-stardust/40">
          <p>© {currentYear} Altera Summit. All rights reserved.</p>
          <p>CC: Jihan Kothari</p>
          <p>
            Powered by <span className="text-gold-primary">Altera</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
