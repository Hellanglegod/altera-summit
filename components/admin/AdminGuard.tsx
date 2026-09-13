"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { AdminAuthProvider, useAdminAuth } from "@/components/admin/AuthProvider";
import { AdminLayout as AdminLayoutComponent } from "@/components/admin/AdminLayout";
import { Loader2 } from "lucide-react";

function AdminGuardContent({ children }: { children: React.ReactNode }) {
  const { session, role, isLoading } = useAdminAuth();
  const pathname = usePathname();
  const router = useRouter();

  const isLoginPage = pathname?.includes("/login");

  useEffect(() => {
    if (!isLoading && !isLoginPage) {
      if (!session || !role || !["super_admin", "director_registrations", "committee_director"].includes(role)) {
        router.push("/admin/login");
      }
    }
  }, [isLoading, session, role, isLoginPage, router]);

  // If on login page, don't wrap with AdminLayoutComponent
  if (isLoginPage) {
    return <>{children}</>;
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg-void flex items-center justify-center">
        <Loader2 size={40} className="animate-spin text-gold-primary" />
      </div>
    );
  }

  // Not authenticated
  if (!session || !role || !["super_admin", "director_registrations", "committee_director"].includes(role)) {
    return (
      <div className="min-h-screen bg-bg-void flex items-center justify-center">
        <Loader2 size={40} className="animate-spin text-gold-primary" />
      </div>
    );
  }

  // Authenticated admin
  return <AdminLayoutComponent>{children}</AdminLayoutComponent>;
}

export function AdminGuard({ children }: { children: React.ReactNode }) {
  return (
    <AdminAuthProvider>
      <AdminGuardContent>{children}</AdminGuardContent>
    </AdminAuthProvider>
  );
}
