import { Header, Footer } from "@/components/layout";
import { About } from "@/components/sections/About";

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col bg-bg-void text-text-stardust">
      <Header />
      <main className="flex-1 pt-20">
        <About />
      </main>
      <Footer />
    </div>
  );
}
