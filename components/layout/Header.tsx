"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Check, Copy, Menu, X } from "lucide-react";
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
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [profile, setProfile] = useState<{
    name: string;
    email: string;
    role: string;
    avatarUrl: string;
    referenceCode: string;
  } | null>(null);
  const [isReferenceCopied, setIsReferenceCopied] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    function updateProfile(
      session: Awaited<
        ReturnType<typeof supabase.auth.getSession>
      >["data"]["session"],
    ) {
      setIsSignedIn(Boolean(session));
      if (!session) {
        setProfile(null);
        return;
      }

      supabase
        .from("admin_role_assignments")
        .select("portal_id")
        .eq("user_id", session.user.id)
        .maybeSingle()
        .then(({ data }) => {
          setProfile({
            name:
              session.user.user_metadata?.full_name ||
              session.user.email?.split("@")[0] ||
              "Applicant",
            email: session.user.email || "",
            role:
              session.user.app_metadata?.role ||
              session.user.user_metadata?.role ||
              "Applicant",
            avatarUrl: session.user.user_metadata?.avatar_url || "",
            referenceCode:
              data?.portal_id ||
              session.user.id.replaceAll("-", "").slice(0, 8).toUpperCase(),
          });
        });
    }

    supabase.auth
      .getSession()
      .then(({ data: { session } }) => updateProfile(session));

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      updateProfile(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function handleSignOut() {
    await supabase.auth.signOut();
    setIsMobileMenuOpen(false);
    setIsProfileOpen(false);
    setIsReferenceCopied(false);
  }

  async function copyReferenceCode() {
    if (!profile?.referenceCode) return;
    await navigator.clipboard.writeText(profile.referenceCode);
    setIsReferenceCopied(true);
    window.setTimeout(() => setIsReferenceCopied(false), 1600);
  }

  async function handleAvatarChange(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0];
    if (!file || !profile || file.size > 1024 * 1024) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const avatarUrl = String(reader.result);
      const { error } = await supabase.auth.updateUser({
        data: { avatar_url: avatarUrl },
      });
      if (!error) setProfile({ ...profile, avatarUrl });
    };
    reader.readAsDataURL(file);
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
          {isSignedIn && profile ? (
            <div className="relative hidden sm:block">
              <button
                type="button"
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="inline-flex items-center gap-2 rounded-md border border-gold-primary/40 px-3 py-2 text-left transition-colors hover:bg-gold-primary/10"
                aria-expanded={isProfileOpen}
              >
                {profile.avatarUrl ? (
                  <img
                    src={profile.avatarUrl}
                    alt=""
                    className="h-7 w-7 rounded-full object-cover"
                  />
                ) : (
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gold-primary text-xs font-bold text-bg-void">
                    {profile.name.charAt(0).toUpperCase()}
                  </span>
                )}
                <span className="max-w-28 truncate text-xs font-medium text-gold-primary">
                  {profile.name}
                </span>
              </button>

              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-72 rounded-xl border border-gold-primary/25 bg-bg-void/95 p-4 shadow-2xl backdrop-blur-xl">
                  <div className="flex items-center gap-3 border-b border-border-cosmic-blue pb-3">
                    {profile.avatarUrl ? (
                      <img
                        src={profile.avatarUrl}
                        alt=""
                        className="h-12 w-12 rounded-full object-cover"
                      />
                    ) : (
                      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gold-primary text-lg font-bold text-bg-void">
                        {profile.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                    <div className="min-w-0">
                      <p className="truncate font-medium text-text-stardust">
                        {profile.name}
                      </p>
                      <p className="truncate text-xs text-text-stardust/60">
                        {profile.email}
                      </p>
                      <p className="text-xs capitalize text-gold-primary">
                        {profile.role.replaceAll("_", " ")}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between rounded-lg border border-gold-primary/20 bg-gold-primary/5 px-3 py-2">
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-text-stardust/50">
                        Reference code
                      </p>
                      <p className="font-mono text-sm font-semibold tracking-wider text-gold-primary">
                        {profile.referenceCode}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => void copyReferenceCode()}
                      className="rounded-md p-2 text-text-stardust/60 hover:bg-gold-primary/10 hover:text-gold-primary"
                      title="Copy reference code"
                      aria-label="Copy reference code"
                    >
                      {isReferenceCopied ? (
                        <Check size={16} />
                      ) : (
                        <Copy size={16} />
                      )}
                    </button>
                  </div>
                  <label className="mt-3 flex cursor-pointer items-center gap-2 text-xs text-text-stardust/70 hover:text-gold-primary">
                    <Camera size={15} /> Set profile photo
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="sr-only"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="mt-3 w-full rounded-md border border-red-400/30 px-3 py-2 text-left text-xs text-red-300 hover:bg-red-400/10"
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
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
                {isSignedIn && profile ? (
                  <div className="rounded-lg border border-gold-primary/25 p-3">
                    <div className="flex items-center gap-3">
                      {profile.avatarUrl ? (
                        <img
                          src={profile.avatarUrl}
                          alt=""
                          className="h-10 w-10 rounded-full object-cover"
                        />
                      ) : (
                        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gold-primary font-bold text-bg-void">
                          {profile.name.charAt(0).toUpperCase()}
                        </span>
                      )}
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {profile.name}
                        </p>
                        <p className="truncate text-xs text-text-stardust/60">
                          {profile.email}
                        </p>
                        <p className="text-xs capitalize text-gold-primary">
                          {profile.role.replaceAll("_", " ")}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between rounded-lg border border-gold-primary/20 bg-gold-primary/5 px-3 py-2">
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-text-stardust/50">
                          Reference code
                        </p>
                        <p className="font-mono text-sm font-semibold tracking-wider text-gold-primary">
                          {profile.referenceCode}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => void copyReferenceCode()}
                        className="rounded-md p-2 text-text-stardust/60 hover:bg-gold-primary/10 hover:text-gold-primary"
                        title="Copy reference code"
                        aria-label="Copy reference code"
                      >
                        {isReferenceCopied ? (
                          <Check size={16} />
                        ) : (
                          <Copy size={16} />
                        )}
                      </button>
                    </div>
                    <label className="mt-3 flex cursor-pointer items-center gap-2 text-xs text-text-stardust/70">
                      <Camera size={15} /> Set profile photo
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarChange}
                        className="sr-only"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={handleSignOut}
                      className="mt-3 w-full rounded-md border border-red-400/30 px-3 py-2 text-left text-xs text-red-300"
                    >
                      Sign out
                    </button>
                  </div>
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
