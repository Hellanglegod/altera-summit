"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Header, Footer } from "@/components/layout";
import { supabase } from "@/lib/supabase";
import { DEFAULT_ROLE_PERMISSIONS } from "@/components/admin/AuthProvider";

async function hasAdminPermissions(userId: string, metadataRole?: string) {
  const { data: assignment } = await supabase
    .from("admin_role_assignments")
    .select("role:admin_roles(name, permissions)")
    .eq("user_id", userId)
    .maybeSingle();
  const assignedRole = assignment?.role as {
    name?: string;
    permissions?: string[];
  } | null;

  if (
    assignedRole?.permissions?.includes("*") ||
    (assignedRole?.permissions?.length || 0) > 0
  ) {
    return true;
  }

  if (!metadataRole) return false;
  const { data: metadataRoleDefinition } = await supabase
    .from("admin_roles")
    .select("permissions")
    .eq("name", metadataRole)
    .maybeSingle();
  const permissions = metadataRoleDefinition?.permissions as string[] | null;
  const resolvedPermissions =
    permissions || DEFAULT_ROLE_PERMISSIONS[metadataRole] || [];
  return Boolean(
    resolvedPermissions.includes("*") || resolvedPermissions.length,
  );
}

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function redirectExistingSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;

      const metadataRole =
        session.user.app_metadata?.role || session.user.user_metadata?.role;
      router.replace(
        (await hasAdminPermissions(session.user.id, metadataRole))
          ? "/admin/dashboard"
          : "/apply",
      );
    }

    void redirectExistingSession();
  }, [router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsLoading(true);

    const { data, error: signInError } = await supabase.auth.signInWithPassword(
      {
        email: email.trim(),
        password,
      },
    );

    if (signInError) {
      setError(signInError.message);
      setIsLoading(false);
      return;
    }

    const metadataRole =
      data.user?.app_metadata?.role || data.user?.user_metadata?.role;
    router.push(
      data.user && (await hasAdminPermissions(data.user.id, metadataRole))
        ? "/admin/dashboard"
        : "/apply",
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-bg-void text-text-stardust">
      <Header />
      <main className="flex-1 pt-20">
        <section className="section-shell">
          <div className="mx-auto max-w-md">
            <div className="mb-8 text-center">
              <span className="mb-4 inline-block rounded-full border border-gold-primary/30 bg-gold-primary/10 px-4 py-2 text-sm font-medium text-gold-primary">
                Application Access
              </span>
              <h1 className="font-display text-4xl font-bold text-gold-primary">
                Sign in
              </h1>
              <p className="mt-3 text-text-stardust/70">
                Sign in to continue to your application.
              </p>
            </div>

            <form
              onSubmit={handleSubmit}
              className="card-cosmic space-y-5 rounded-2xl p-6"
            >
              <label className="block text-sm text-text-stardust/80">
                Email
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  autoComplete="email"
                  className="input-cosmic mt-2 w-full"
                />
              </label>
              <label className="block text-sm text-text-stardust/80">
                Password
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  autoComplete="current-password"
                  className="input-cosmic mt-2 w-full"
                />
              </label>
              {error && <p className="text-sm text-red-300">{error}</p>}
              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoading ? "Signing in..." : "Sign In"}
              </button>
              <p className="text-center text-sm text-text-stardust/70">
                New applicant? Choose an application path to create an account.
                <Link
                  href="/applications"
                  className="ml-1 text-gold-primary hover:underline"
                >
                  Continue to applications
                </Link>
              </p>
            </form>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
