import { Header, Footer } from "@/components/layout";
import { Secretariat } from "@/components/sections/Secretariat";

export default function SecretariatPage() {
  return (
    <div className="min-h-screen flex flex-col bg-bg-void text-text-stardust">
      <Header />
      <main className="flex-1 pt-20">
        <Secretariat />
      </main>
      <Footer />
    </div>
  );
}
