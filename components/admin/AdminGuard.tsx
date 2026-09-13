"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  AdminAuthProvider,
  useAdminAuth,
} from "@/components/admin/AuthProvider";
import { AdminLayout as AdminLayoutComponent } from "@/components/admin/AdminLayout";
import { Loader2 } from "lucide-react";

function AdminGuardContent({ children }: { children: React.ReactNode }) {
  const { session, role, isLoading, hasPermission } = useAdminAuth();
  const pathname = usePathname();
  const router = useRouter();

  const isLoginPage = pathname?.includes("/login");
  const requiredPermission = pathname?.startsWith("/admin/applications")
    ? "applications.read"
    : pathname?.startsWith("/admin/forms")
      ? "forms.manage"
      : pathname?.startsWith("/admin/committees")
        ? "committees.read"
        : pathname?.startsWith("/admin/secretariat")
          ? "secretariat.manage"
          : pathname?.startsWith("/admin/schedule")
            ? "schedule.manage"
            : pathname?.startsWith("/admin/settings")
              ? "settings.manage"
              : null;
  const isAccessPage = pathname?.startsWith("/admin/access");
  const canAccessPage =
    (!requiredPermission || hasPermission(requiredPermission)) &&
    (!isAccessPage || hasPermission("roles.manage"));

  useEffect(() => {
    if (!isLoading && !isLoginPage) {
      if (!session || !role) {
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
  if (!session || !role) {
    return (
      <div className="min-h-screen bg-bg-void flex items-center justify-center">
        <Loader2 size={40} className="animate-spin text-gold-primary" />
      </div>
    );
  }

  if (!canAccessPage) {
    return (
      <AdminLayoutComponent>
        <div className="card-cosmic mx-auto max-w-xl p-8 text-center">
          <h1 className="text-2xl font-display font-bold text-gold-primary">
            Access restricted
          </h1>
          <p className="mt-3 text-text-stardust/70">
            Your role does not have permission to view this area.
          </p>
        </div>
      </AdminLayoutComponent>
    );
  }

  // Authenticated admin with the required permission
  return <AdminLayoutComponent>{children}</AdminLayoutComponent>;
}

export function AdminGuard({ children }: { children: React.ReactNode }) {
  return (
    <AdminAuthProvider>
      <AdminGuardContent>{children}</AdminGuardContent>
    </AdminAuthProvider>
  );
}
