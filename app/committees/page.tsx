import { Header, Footer } from "@/components/layout";
import { Committees } from "@/components/sections/Committees";

export default function CommitteesPage() {
  return (
    <div className="min-h-screen flex flex-col bg-bg-void text-text-stardust">
      <Header />
      <main className="flex-1 pt-20">
        <Committees />
      </main>
      <Footer />
    </div>
  );
}
