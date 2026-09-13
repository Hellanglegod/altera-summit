import { Header, Footer } from "@/components/layout";
import { Hero } from "@/components/sections/Hero";
import { About } from "@/components/sections/About";
import { Committees } from "@/components/sections/Committees";
import { Applications } from "@/components/sections/Applications";
import { Secretariat } from "@/components/sections/Secretariat";
import { Schedule } from "@/components/sections/Schedule";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-bg-void text-text-stardust">
      <Header />
      <main className="flex-1">
        <Hero />

        <About />

        <Committees />

        <Applications />

        <Secretariat />

        <Schedule />
      </main>
      <Footer />
    </div>
  );
}