import Link from "next/link";
import { Header, Footer } from "@/components/layout";
import { Hero } from "@/components/sections/Hero";

const quickLinks = [
  {
    href: "/about",
    label: "About the Summit",
    description: "Our vision, mission, and what makes the conference unique.",
  },
  {
    href: "/committees",
    label: "Committees",
    description: "Explore the councils, agendas, and institutional focus.",
  },
  {
    href: "/applications",
    label: "Applications",
    description: "Apply to join as a delegate, chair, or Secretariat member.",
  },
  {
    href: "/schedule",
    label: "Schedule",
    description: "See the timeline of sessions, events, and key moments.",
  },
  {
    href: "/secretariat",
    label: "Secretariat",
    description: "Meet the team shaping the conference experience.",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-bg-void text-text-stardust">
      <Header />
      <main className="flex-1">
        <Hero />

        <section className="section-shell relative border-t border-border-cosmic-blue/40">
          <div className="container-cosmic relative z-10">
            <div className="mx-auto mb-10 max-w-3xl text-center">
              <span className="mb-4 inline-block rounded-full border border-gold-primary/30 bg-gold-primary/10 px-4 py-2 text-sm font-medium text-gold-primary">
                Explore the Conference
              </span>
              <h2 className="mb-4 font-display text-4xl font-bold text-gold-primary md:text-5xl">
                One destination, deliberately split into pages
              </h2>
              <p className="text-lg text-text-stardust/80">
                Browse the summit the way people actually explore it: focused,
                clear, and easy to move through across all devices.
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {quickLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="card-cosmic group rounded-2xl p-6 transition-all duration-300 hover:border-gold-primary/50"
                >
                  <div className="mb-3 text-xs uppercase tracking-[0.2em] text-gold-primary">
                    Explore
                  </div>
                  <h3 className="mb-2 font-heading text-2xl text-text-stardust transition-colors group-hover:text-gold-primary">
                    {link.label}
                  </h3>
                  <p className="text-sm leading-relaxed text-text-stardust/70">
                    {link.description}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
