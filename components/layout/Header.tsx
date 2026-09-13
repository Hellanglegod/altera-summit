"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";

const navLinks = [
  { href: "/about", label: "About" },
  { href: "/committees", label: "Committees" },
  { href: "/secretariat", label: "Secretariat" },
  { href: "/applications", label: "Applications" },
  { href: "/schedule", label: "Schedule" },
  { href: "mailto:contact@alterasummit.com", label: "Contact" },
];

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsSignedIn(Boolean(session));
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsSignedIn(Boolean(session));
    });

    return () => subscription.unsubscribe();
  }, []);

  async function handleSignOut() {
    await supabase.auth.signOut();
    setIsMobileMenuOpen(false);
  }

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        isScrolled ? "glass-dark py-3" : "py-5",
      )}
    >
      <div className="container-cosmic flex items-center justify-between gap-3 min-w-0">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group min-w-0">
          <div className="relative shrink-0">
            <div className="absolute inset-0 bg-gold-primary/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <span className="font-display text-lg sm:text-xl md:text-2xl font-bold text-gold-primary relative">
              ALTERA
            </span>
          </div>
          <span className="font-heading text-base sm:text-lg text-text-stardust/80 hidden sm:block">
            Summit
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="font-body text-sm text-text-stardust/80 hover:text-gold-primary transition-colors duration-300 relative group"
            >
              {link.label}
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gold-primary transition-all duration-300 group-hover:w-full" />
            </Link>
          ))}
        </nav>

        {/* CTA Buttons */}
        <div className="flex items-center gap-3 sm:gap-4">
          {isSignedIn ? (
            <button
              type="button"
              onClick={handleSignOut}
              className="hidden sm:inline-flex items-center justify-center rounded-md border border-gold-primary/40 bg-transparent px-3.5 py-2 text-xs font-medium uppercase tracking-[0.18em] text-gold-primary transition-colors hover:bg-gold-primary/10"
            >
              Sign Out
            </button>
          ) : (
            <Link
              href="/signin"
              className="hidden sm:inline-flex items-center justify-center rounded-md border border-gold-primary/40 bg-transparent px-3.5 py-2 text-xs font-medium uppercase tracking-[0.18em] text-gold-primary transition-colors hover:bg-gold-primary/10"
            >
              Sign In
            </Link>
          )}

          <Link
            href="/applications"
            className="hidden md:flex btn-primary text-sm animate-pulse-gold"
          >
            Apply Now
          </Link>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 text-text-stardust hover:text-gold-primary transition-colors"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="lg:hidden glass-dark mt-2 mx-4 rounded-lg overflow-hidden"
          >
            <nav className="flex flex-col py-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="px-6 py-3 font-body text-text-stardust/80 hover:text-gold-primary hover:bg-nebula-purple-1/50 transition-all duration-300"
                >
                  {link.label}
                </Link>
              ))}
              <div className="px-6 py-4 space-y-3">
                {isSignedIn ? (
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="border border-gold-primary/40 text-gold-primary bg-transparent text-sm w-full text-center block rounded-md px-4 py-2.5 font-medium"
                  >
                    Sign Out
                  </button>
                ) : (
                  <Link
                    href="/signin"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="border border-gold-primary/40 text-gold-primary bg-transparent text-sm w-full text-center block rounded-md px-4 py-2.5 font-medium"
                  >
                    Sign In
                  </Link>
                )}
                <Link
                  href="/applications"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="btn-primary text-sm w-full text-center block"
                >
                  Apply Now
                </Link>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
