"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import type { AdminRole } from "@/app/admin-auth.config";

interface AdminAuthContextType {
  session: Session | null;
  user: User | null;
  role: AdminRole | null;
  portalId: string | null;
  committeeId: string | null;
  permissions: string[];
  isLoading: boolean;
  hasPermission: (permission: string) => boolean;
  signIn: (email: string, password: string) => Promise<{ error: any | null }>;
  signOut: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(
  undefined,
);

export const DEFAULT_ROLE_PERMISSIONS: Record<string, string[]> = {
  super_admin: ["*"],
  director_registrations: [
    "applications.read",
    "applications.manage",
    "applications.review",
    "applications.export",
    "applications.delegate.accept",
    "applications.chair.accept",
    "applications.secretariat.accept",
    "portals.manage",
  ],
  committee_director: [
    "applications.read",
    "applications.review",
    "applications.delegate.accept",
    "applications.chair.accept",
    "committees.read",
    "committees.manage",
  ],
};

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<AdminRole | null>(null);
  const [portalId, setPortalId] = useState<string | null>(null);
  const [committeeId, setCommitteeId] = useState<string | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadSession(session: Session | null) {
      setSession(session);
      setUser(session?.user ?? null);
      const metadataRole =
        (session?.user?.app_metadata?.role as AdminRole) ||
        (session?.user?.user_metadata?.role as AdminRole) ||
        null;
      let userRole = metadataRole;
      let userPermissions: string[] = [];

      if (session?.user) {
        const { data } = await supabase
          .from("admin_role_assignments")
          .select(
            "portal_id, committee_id, role:admin_roles(name, permissions)",
          )
          .eq("user_id", session.user.id)
          .maybeSingle();
        setPortalId(
          data?.portal_id ||
            session.user.id.replaceAll("-", "").slice(0, 8).toUpperCase(),
        );
        setCommitteeId(data?.committee_id || null);
        const assignedRole = data?.role as {
          name?: string;
          permissions?: string[];
        } | null;
        userRole = assignedRole?.name || userRole;
        userPermissions = assignedRole?.permissions || [];
      }

      if (!session?.user) setPortalId(null);
      if (!session?.user) setCommitteeId(null);

      setRole(userRole);
      setPermissions(
        userPermissions.length > 0
          ? userPermissions
          : DEFAULT_ROLE_PERMISSIONS[userRole || ""] || [],
      );
      setIsLoading(false);
    }

    // Get initial session
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => loadSession(session));

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      void loadSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { error };
    } catch (error) {
      return { error };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const hasPermission = (permission: string) =>
    permissions.includes("*") || permissions.includes(permission);

  return (
    <AdminAuthContext.Provider
      value={{
        session,
        user,
        role,
        portalId,
        committeeId,
        permissions,
        isLoading,
        hasPermission,
        signIn,
        signOut,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error("useAdminAuth must be used within an AdminAuthProvider");
  }
  return context;
}
