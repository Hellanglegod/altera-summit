import { Header, Footer } from "@/components/layout";
import { Hero } from "@/components/sections/Hero";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-bg-void text-text-stardust">
      <Header />
      <main className="flex-1">
        <Hero />
        {/* Placeholder sections - to be built */}
        <section id="about" className="section-padding bg-gradient-cosmic">
          <div className="container-cosmic">
            <h2 className="text-4xl font-display text-gold-primary">About</h2>
            <p className="mt-4 text-text-stardust/80">Coming soon...</p>
          </div>
        </section>

        <section id="committees" className="section-padding">
          <div className="container-cosmic">
            <h2 className="text-4xl font-display text-gold-primary">Committees</h2>
            <p className="mt-4 text-text-stardust/80">Coming soon...</p>
          </div>
        </section>

        <section id="applications" className="section-padding bg-gradient-cosmic">
          <div className="container-cosmic">
            <h2 className="text-4xl font-display text-gold-primary">Applications</h2>
            <p className="mt-4 text-text-stardust/80">Coming soon...</p>
          </div>
        </section>

        <section id="secretariat" className="section-padding">
          <div className="container-cosmic">
            <h2 className="text-4xl font-display text-gold-primary">Secretariat</h2>
            <p className="mt-4 text-text-stardust/80">Coming soon...</p>
          </div>
        </section>

        <section id="schedule" className="section-padding bg-gradient-cosmic">
          <div className="container-cosmic">
            <h2 className="text-4xl font-display text-gold-primary">Schedule</h2>
            <p className="mt-4 text-text-stardust/80">Coming soon...</p>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}