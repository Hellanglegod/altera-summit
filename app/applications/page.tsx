import { Header, Footer } from "@/components/layout";
import { Applications } from "@/components/sections/Applications";

export default function ApplicationsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-bg-void text-text-stardust">
      <Header />
      <main className="flex-1 pt-20">
        <Applications />
      </main>
      <Footer />
    </div>
  );
}
