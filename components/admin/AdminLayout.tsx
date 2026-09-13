"use client";

import { useAdminAuth } from "./AuthProvider";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  FileText,
  Users,
  Calendar,
  Settings,
  LogOut,
  Menu,
  X,
  Landmark,
  UserCheck,
  FileEdit,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/applications", label: "Applications", icon: FileText },
  { href: "/admin/forms", label: "Form Builder", icon: FileEdit },
  { href: "/admin/committees", label: "Committees", icon: Landmark },
  { href: "/admin/secretariat", label: "Secretariat", icon: UserCheck },
  { href: "/admin/schedule", label: "Schedule", icon: Calendar },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, role, signOut } = useAdminAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    router.push("/admin/login");
  };

  return (
    <div className="min-h-screen bg-bg-void text-text-stardust">
      {/* Top Bar */}
      <header className="fixed top-0 left-0 right-0 z-50 glass-dark border-b border-border-cosmic-blue">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="lg:hidden p-2 hover:bg-nebula-purple-1 rounded-lg transition-colors"
            >
              {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <Link href="/admin/dashboard" className="flex items-center gap-2">
              <span className="font-display text-xl font-bold text-gold-primary">
                ALTERA
              </span>
              <span className="hidden sm:inline text-sm text-text-stardust/60">
                Admin Portal
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex flex-col items-end">
              <span className="text-sm font-medium">{user?.email}</span>
              <span className="text-xs text-text-stardust/60 capitalize">
                {role?.replace("_", " ")}
              </span>
            </div>
            <button
              onClick={handleSignOut}
              className="p-2 hover:bg-nebula-purple-1 rounded-lg transition-colors flex items-center gap-2 text-sm"
            >
              <LogOut size={18} />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-16 left-0 bottom-0 w-64 glass-dark border-r border-border-cosmic-blue transition-transform duration-300 z-40",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <nav className="p-4 space-y-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300",
                  isActive
                    ? "bg-gold-primary/20 text-gold-primary border border-gold-primary/30"
                    : "hover:bg-nebula-purple-1 text-text-stardust/80 hover:text-text-stardust"
                )}
              >
                <item.icon size={20} />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="pt-16 lg:pl-64 min-h-screen">
        <div className="p-6">{children}</div>
      </main>

      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
}