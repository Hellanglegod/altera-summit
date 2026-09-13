"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, AlertCircle, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { StarfieldCanvas } from "@/components/ui/StarfieldCanvas";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message);
        setIsLoading(false);
        return;
      }

      // Check if user has admin role (checks both app_metadata and user_metadata)
      const role =
        (data.user?.app_metadata?.role as string) ||
        (data.user?.user_metadata?.role as string);

      if (
        !role ||
        !["super_admin", "director_registrations", "committee_director"].includes(
          role
        )
      ) {
        await supabase.auth.signOut();
        setError("Access denied. You do not have admin privileges. Ensure your user role is set to 'super_admin' in Supabase.");
        setIsLoading(false);
        return;
      }

      // Redirect to dashboard
      router.push("/admin/dashboard");
      router.refresh();
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-bg-void">
      {/* Background starfield */}
      <div className="absolute inset-0">
        <StarfieldCanvas starCount={100} showConstellations={false} />
      </div>

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-md mx-4">
        <div className="glass-dark rounded-2xl p-8 border border-gold-primary/20">
          {/* Header */}
          <div className="text-center mb-8">
            <Link href="/" className="inline-block mb-4">
              <span className="font-display text-3xl font-bold text-gold-primary">
                ALTERA
              </span>
              <span className="font-heading text-xl text-text-stardust/80 ml-2">
                Summit
              </span>
            </Link>
            <h1 className="text-2xl font-heading text-text-stardust mb-2">
              Secretariat Portal
            </h1>
            <p className="text-sm text-text-stardust/60">
              Sign in to access the admin dashboard
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/50 flex items-start gap-3">
              <AlertCircle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-text-stardust/80 mb-2"
              >
                Email Address
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-stardust/40">
                  <Mail size={20} />
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="input-cosmic pl-11"
                  placeholder="admin@alterasummit.com"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-text-stardust/80 mb-2"
              >
                Password
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-stardust/40">
                  <Lock size={20} />
                </div>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="input-cosmic pl-11"
                  placeholder="••••••••"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center">
            <Link
              href="/"
              className="text-sm text-text-stardust/60 hover:text-gold-primary transition-colors"
            >
              ← Back to main site
            </Link>
          </div>
        </div>

        {/* Security Notice */}
        <div className="mt-4 text-center">
          <p className="text-xs text-text-stardust/40">
            This portal is for authorized Altera Summit secretariat members only.
          </p>
        </div>
      </div>
    </div>
  );
}