import { Header, Footer } from "@/components/layout";
import { Schedule } from "@/components/sections/Schedule";

export default function SchedulePage() {
  return (
    <div className="min-h-screen flex flex-col bg-bg-void text-text-stardust">
      <Header />
      <main className="flex-1 pt-20">
        <Schedule />
      </main>
      <Footer />
    </div>
  );
}
