import Link from "next/link";
import { Header, Footer } from "@/components/layout";
import { Users, Award, Crown } from "lucide-react";

const tracks = [
  {
    type: "delegate",
    title: "Delegate Application",
    description:
      "Join the summit as a delegate and represent a nation on the global stage.",
    icon: Users,
  },
  {
    type: "chair",
    title: "Chair Application",
    description:
      "Lead a committee and guide diplomatic discussion with confidence and clarity.",
    icon: Award,
  },
  {
    type: "secretariat",
    title: "Secretariat Application",
    description:
      "Support the summit behind the scenes and help shape the conference experience.",
    icon: Crown,
  },
] as const;

export default function ApplyLandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-bg-void text-text-stardust">
      <Header />
      <main className="flex-1 pt-20">
        <section className="section-shell relative overflow-hidden border-t border-border-cosmic-blue/40">
          <div className="container-cosmic relative z-10">
            <div className="mx-auto mb-10 max-w-3xl text-center">
              <span className="mb-4 inline-block rounded-full border border-gold-primary/30 bg-gold-primary/10 px-4 py-2 text-sm font-medium text-gold-primary">
                Application Access
              </span>
              <h1 className="mb-4 font-display text-4xl font-bold text-gold-primary md:text-5xl">
                Choose your application path
              </h1>
              <p className="text-lg text-text-stardust/80">
                Before you can begin the form, you must create an account or
                sign in to continue.
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {tracks.map(({ type, title, description, icon: Icon }) => (
                <Link
                  key={type}
                  href={`/apply/${type}`}
                  className="card-cosmic group rounded-2xl p-6 transition-all duration-300 hover:border-gold-primary/60"
                >
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl border border-gold-primary/25 bg-gold-primary/10 text-gold-primary">
                    <Icon size={28} />
                  </div>
                  <div className="mb-2 text-xs uppercase tracking-[0.2em] text-gold-primary/80">
                    {type}
                  </div>
                  <h2 className="mb-3 font-heading text-3xl text-text-stardust group-hover:text-gold-primary">
                    {title}
                  </h2>
                  <p className="text-sm leading-relaxed text-text-stardust/70">
                    {description}
                  </p>
                  <div className="mt-5 inline-flex items-center text-sm font-medium text-gold-primary">
                    Continue to sign up
                  </div>
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
