"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { CustomForm, FormField } from "@/types";
import { StarfieldCanvas } from "@/components/ui/StarfieldCanvas";
import {
  Loader2,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  Send,
} from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

type ApplicationTrack = "delegate" | "chair" | "secretariat";

const applicationTracks: ApplicationTrack[] = [
  "delegate",
  "chair",
  "secretariat",
];

function isApplicationTrack(
  value: string | undefined,
): value is ApplicationTrack {
  return applicationTracks.includes(value as ApplicationTrack);
}

export default function ApplyPage() {
  const params = useParams();
  const router = useRouter();
  const trackParam = Array.isArray(params.track)
    ? params.track[0]
    : params.track;
  const track = isApplicationTrack(trackParam) ? trackParam : null;

  const [form, setForm] = useState<CustomForm | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [session, setSession] = useState<
    | null
    | Awaited<ReturnType<typeof supabase.auth.getSession>>["data"]["session"]
  >(null);
  const [authMode, setAuthMode] = useState<"signUp" | "signIn">("signUp");
  const [authName, setAuthName] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authConfirmPassword, setAuthConfirmPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authNotice, setAuthNotice] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitStatus, setSubmitStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [existingSubmission, setExistingSubmission] = useState<{
    id: string;
    portal_type: string;
    applicant_name: string;
    applicant_email: string;
    status: string;
    created_at: string;
  } | null>(null);
  const [isCheckingSubmission, setIsCheckingSubmission] = useState(true);

  useEffect(() => {
    fetchForm();
  }, [track]);

  useEffect(() => {
    let isMounted = true;

    async function initSession() {
      const {
        data: { session: currentSession },
      } = await supabase.auth.getSession();
      if (isMounted) {
        setSession(currentSession);
        if (currentSession?.user?.email) {
          await checkExistingSubmission(
            currentSession.user.email,
            currentSession.user.id,
          );
        } else {
          setIsCheckingSubmission(false);
        }
      }
    }

    void initSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, currentSession) => {
      if (isMounted) {
        setSession(currentSession);
        if (currentSession?.user?.email) {
          await checkExistingSubmission(
            currentSession.user.email,
            currentSession.user.id,
          );
        } else {
          setExistingSubmission(null);
          setIsCheckingSubmission(false);
        }
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  async function checkExistingSubmission(email: string, userId?: string) {
    setIsCheckingSubmission(true);
    try {
      // 1. Check form_submissions table
      const { data: subData } = await supabase
        .from("form_submissions")
        .select(
          "id, portal_type, applicant_name, applicant_email, status, created_at",
        )
        .ilike("applicant_email", email)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (subData) {
        setExistingSubmission(subData);
        return;
      }

      // 2. Check secretariat_members table (accepted secretariat members)
      const { data: secMember } = await supabase
        .from("secretariat_members")
        .select("id, name, designation, email, created_at")
        .ilike("email", email)
        .limit(1)
        .maybeSingle();

      if (secMember) {
        setExistingSubmission({
          id: secMember.id,
          portal_type: "secretariat",
          applicant_name: secMember.name,
          applicant_email: secMember.email || email,
          status: "Accepted",
          created_at: secMember.created_at || new Date().toISOString(),
        });
        return;
      }

      // 3. Check admin_role_assignments table (assigned admin/secretariat role)
      if (userId) {
        const { data: roleAssignment } = await supabase
          .from("admin_role_assignments")
          .select("id, email, created_at")
          .eq("user_id", userId)
          .limit(1)
          .maybeSingle();

        if (roleAssignment) {
          setExistingSubmission({
            id: roleAssignment.id,
            portal_type: "secretariat",
            applicant_name: roleAssignment.email || email,
            applicant_email: roleAssignment.email || email,
            status: "Accepted",
            created_at: roleAssignment.created_at || new Date().toISOString(),
          });
          return;
        }
      }

      setExistingSubmission(null);
    } catch (err) {
      console.error("Error checking existing submission:", err);
    } finally {
      setIsCheckingSubmission(false);
    }
  }

  // Pre-fill form data with user info when session and form are ready
  useEffect(() => {
    if (form && session?.user) {
      const updatedFormData = { ...formData };
      let updated = false;

      form.fields.forEach((field) => {
        const labelLower = field.label.toLowerCase();
        if (
          labelLower.includes("email") &&
          !updatedFormData[field.id] &&
          session.user.email
        ) {
          updatedFormData[field.id] = session.user.email;
          updated = true;
        }
        if (
          labelLower.includes("name") &&
          !updatedFormData[field.id] &&
          session.user.user_metadata?.full_name
        ) {
          updatedFormData[field.id] = session.user.user_metadata.full_name;
          updated = true;
        }
      });

      if (updated) {
        setFormData(updatedFormData);
      }
    }
  }, [form, session]);

  async function fetchForm() {
    setIsLoading(true);
    setForm(null);

    if (!track) {
      setIsLoading(false);
      return;
    }

    try {
      const { data: portal, error: portalError } = await supabase
        .from("portal_settings")
        .select("is_active, form_mode")
        .eq("portal_type", track)
        .maybeSingle();

      if (portalError) throw portalError;
      if (!portal?.is_active || portal.form_mode !== "custom_builder") {
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("custom_forms")
        .select("*")
        .eq("portal_type", track)
        .eq("is_active", true)
        .single();

      if (error) throw error;
      setForm(data);
    } catch (error) {
      console.error("Error fetching form:", error);
    } finally {
      setIsLoading(false);
    }
  }

  function validateForm(): boolean {
    const newErrors: Record<string, string> = {};

    form?.fields.forEach((field) => {
      const value = formData[field.id];

      if (field.required && field.type === "file") {
        newErrors[field.id] = "File uploads are not currently supported";
      } else if (field.required && isEmptyFieldValue(value)) {
        newErrors[field.id] = `${field.label} is required`;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function isEmptyFieldValue(value: unknown): boolean {
    if (Array.isArray(value)) return value.length === 0;
    if (typeof value === "string") return value.trim().length === 0;
    return value === undefined || value === null || value === false;
  }

  async function handleAuthSubmit(e: React.FormEvent) {
    e.preventDefault();
    setAuthError("");
    setAuthNotice("");

    const trimmedName = authName.trim();
    const trimmedEmail = authEmail.trim();
    if (authMode === "signUp" && !trimmedName) {
      setAuthError("Please enter your name.");
      return;
    }
    if (!trimmedEmail || !authPassword) {
      setAuthError("Please enter both your email and password.");
      return;
    }

    if (authMode === "signUp" && authPassword.length < 6) {
      setAuthError("Password must be at least 6 characters long.");
      return;
    }

    if (authMode === "signUp" && authPassword !== authConfirmPassword) {
      setAuthError("Passwords do not match.");
      return;
    }

    setAuthLoading(true);

    try {
      const request =
        authMode === "signUp"
          ? supabase.auth.signUp({
              email: trimmedEmail,
              password: authPassword,
              options: { data: { full_name: trimmedName } },
            })
          : supabase.auth.signInWithPassword({
              email: trimmedEmail,
              password: authPassword,
            });

      const { data, error } = await request;

      if (error) {
        setAuthError(error.message);
        return;
      }

      if (authMode === "signUp") {
        if (data.session) {
          setSession(data.session);
          setAuthNotice(
            "Account created successfully. You can continue with your application.",
          );
        } else {
          setAuthNotice(
            "Account created successfully. Please check your email to confirm your account before continuing.",
          );
        }
      } else if (data.session) {
        setSession(data.session);
        setAuthNotice("Welcome back. You can continue with your application.");
      }

      setAuthEmail("");
      setAuthName("");
      setAuthPassword("");
      setAuthConfirmPassword("");
    } catch (error) {
      setAuthError(
        "Something went wrong while creating your account. Please try again.",
      );
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validateForm() || !form || !track) return;

    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      // Extract core applicant details
      const nameField = form.fields.find(
        (f) => f.label.toLowerCase().includes("name") && f.type === "text",
      );
      const emailField = form.fields.find(
        (f) => f.label.toLowerCase().includes("email") && f.type === "text",
      );
      const phoneField = form.fields.find(
        (f) => f.label.toLowerCase().includes("phone") && f.type === "text",
      );

      const applicantName = nameField && formData[nameField.id];
      const applicantEmail = emailField && formData[emailField.id];
      const emailIsValid =
        typeof applicantEmail === "string" &&
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(applicantEmail.trim());

      if (!nameField || isEmptyFieldValue(applicantName)) {
        setSubmitStatus({
          type: "error",
          message: "Please provide your name before submitting.",
        });
        return;
      }

      if (!emailField || !emailIsValid) {
        setSubmitStatus({
          type: "error",
          message: "Please provide a valid email address before submitting.",
        });
        return;
      }

      // Safety check: ensure user hasn't already submitted an application or joined secretariat/admin
      const checkEmail = (
        session?.user?.email || String(applicantEmail)
      ).trim();
      const checkUserId = session?.user?.id;

      const { data: existingCheck } = await supabase
        .from("form_submissions")
        .select(
          "id, portal_type, applicant_name, applicant_email, status, created_at",
        )
        .ilike("applicant_email", checkEmail)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existingCheck) {
        setExistingSubmission(existingCheck);
        setSubmitStatus({
          type: "error",
          message: `You have already submitted an application for the ${existingCheck.portal_type} track. Multiple applications across tracks are not allowed.`,
        });
        setIsSubmitting(false);
        return;
      }

      const { data: secCheck } = await supabase
        .from("secretariat_members")
        .select("id, name, email, created_at")
        .ilike("email", checkEmail)
        .limit(1)
        .maybeSingle();

      if (secCheck) {
        const secSub = {
          id: secCheck.id,
          portal_type: "secretariat",
          applicant_name: secCheck.name,
          applicant_email: secCheck.email || checkEmail,
          status: "Accepted",
          created_at: secCheck.created_at || new Date().toISOString(),
        };
        setExistingSubmission(secSub);
        setSubmitStatus({
          type: "error",
          message:
            "You are already a member of the Secretariat. Multiple applications are not permitted.",
        });
        setIsSubmitting(false);
        return;
      }

      if (checkUserId) {
        const { data: roleAssCheck } = await supabase
          .from("admin_role_assignments")
          .select("id, email, created_at")
          .eq("user_id", checkUserId)
          .limit(1)
          .maybeSingle();

        if (roleAssCheck) {
          const roleSub = {
            id: roleAssCheck.id,
            portal_type: "secretariat",
            applicant_name: roleAssCheck.email || checkEmail,
            applicant_email: roleAssCheck.email || checkEmail,
            status: "Accepted",
            created_at: roleAssCheck.created_at || new Date().toISOString(),
          };
          setExistingSubmission(roleSub);
          setSubmitStatus({
            type: "error",
            message:
              "You are already an assigned Secretariat/Admin member. Multiple applications are not permitted.",
          });
          setIsSubmitting(false);
          return;
        }
      }

      const { error } = await supabase.from("form_submissions").insert({
        portal_type: track,
        applicant_name: String(applicantName).trim(),
        applicant_email: String(applicantEmail).trim(),
        applicant_phone: phoneField
          ? String(formData[phoneField.id] || "").trim() || null
          : null,
        submission_data: formData,
        status: "Submitted",
      });

      if (error) throw error;

      setSubmitStatus({
        type: "success",
        message:
          "Application submitted successfully! We'll review your application and get back to you within 7-10 business days.",
      });

      // Clear form
      setFormData({});

      // Redirect to home after 5 seconds
      setTimeout(() => {
        router.push("/#applications");
      }, 5000);
    } catch (error) {
      console.error("Error submitting form:", error);
      setSubmitStatus({
        type: "error",
        message:
          "Failed to submit your application. Please try again or contact us directly.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  function renderField(field: FormField) {
    const value = formData[field.id] ?? "";
    const error = errors[field.id];

    const commonClasses = `input-cosmic w-full ${
      error ? "border-red-500/50" : ""
    }`;

    switch (field.type) {
      case "text":
        return (
          <input
            type="text"
            id={field.id}
            value={value}
            onChange={(e) =>
              setFormData({ ...formData, [field.id]: e.target.value })
            }
            placeholder={field.placeholder}
            required={field.required}
            className={commonClasses}
          />
        );

      case "textarea":
        return (
          <textarea
            id={field.id}
            rows={4}
            value={value}
            onChange={(e) =>
              setFormData({ ...formData, [field.id]: e.target.value })
            }
            placeholder={field.placeholder}
            required={field.required}
            className={`${commonClasses} resize-none`}
          />
        );

      case "dropdown":
        return (
          <select
            id={field.id}
            value={value}
            onChange={(e) =>
              setFormData({ ...formData, [field.id]: e.target.value })
            }
            required={field.required}
            className={`${commonClasses} bg-nebula-purple-2`}
          >
            <option value="">-- Select an option --</option>
            {field.options?.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        );

      case "radio":
        return (
          <div className="space-y-2">
            {field.options?.map((opt) => (
              <label
                key={opt}
                className="flex items-center gap-2 cursor-pointer text-text-stardust hover:text-gold-primary transition-colors"
              >
                <input
                  type="radio"
                  name={field.id}
                  value={opt}
                  checked={value === opt}
                  onChange={(e) =>
                    setFormData({ ...formData, [field.id]: e.target.value })
                  }
                  required={field.required}
                  className="w-4 h-4 text-gold-primary bg-nebula-purple-1 border-border-cosmic-blue focus:ring-gold-primary"
                />
                <span className="text-sm">{opt}</span>
              </label>
            ))}
          </div>
        );

      case "checkbox":
        return (
          <div className="space-y-2">
            {field.options?.map((opt) => (
              <label
                key={opt}
                className="flex items-center gap-2 cursor-pointer text-text-stardust hover:text-gold-primary transition-colors"
              >
                <input
                  type="checkbox"
                  value={opt}
                  checked={Array.isArray(value) && value.includes(opt)}
                  onChange={(e) => {
                    const currentValues = Array.isArray(value) ? value : [];
                    const newValues = e.target.checked
                      ? [...currentValues, opt]
                      : currentValues.filter((v) => v !== opt);
                    setFormData({ ...formData, [field.id]: newValues });
                  }}
                  className="w-4 h-4 rounded text-gold-primary bg-nebula-purple-1 border-border-cosmic-blue focus:ring-gold-primary"
                />
                <span className="text-sm">{opt}</span>
              </label>
            ))}
          </div>
        );

      case "date":
        return (
          <input
            type="date"
            id={field.id}
            value={value}
            onChange={(e) =>
              setFormData({ ...formData, [field.id]: e.target.value })
            }
            required={field.required}
            className={commonClasses}
          />
        );

      case "file":
        return (
          <div className="text-sm text-text-stardust/60 p-4 rounded-lg bg-nebula-purple-1 border border-border-cosmic-blue">
            <p className="mb-2">
              File uploads are not yet supported in this form.
            </p>
            <p className="text-xs">
              Please email your file to{" "}
              <a
                href="mailto:applications@alterasummit.com"
                className="text-gold-primary hover:underline"
              >
                applications@alterasummit.com
              </a>{" "}
              with your name in the subject line.
            </p>
          </div>
        );

      default:
        return null;
    }
  }

  if (isLoading || isCheckingSubmission) {
    return (
      <div className="min-h-screen bg-bg-void flex items-center justify-center">
        <StarfieldCanvas starCount={150} showConstellations={false} />
        <div className="relative z-10 text-center">
          <Loader2
            size={48}
            className="animate-spin text-gold-primary mx-auto mb-4"
          />
          <p className="text-text-stardust/60">
            Loading application details...
          </p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-bg-void flex items-center justify-center p-4 sm:p-6 relative">
        <StarfieldCanvas starCount={150} showConstellations={true} />

        <div className="relative z-10 w-full max-w-lg">
          <div className="glass-dark rounded-[28px] border border-gold-primary/25 bg-[radial-gradient(circle_at_top,_rgba(212,175,55,0.14),_transparent_38%),_rgba(6,8,12,0.9)] p-5 sm:p-8 shadow-[0_0_35px_rgba(212,175,55,0.12)] backdrop-blur-xl">
            <div className="mb-6 text-center">
              <div className="mb-4 flex items-center justify-center">
                <Link
                  href="/applications"
                  className="inline-flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.22em] text-gold-primary/80 transition-colors hover:text-gold-primary"
                >
                  <ArrowLeft size={14} />
                  Back to portals
                </Link>
              </div>

              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-gold-primary/25 bg-gold-primary/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-gold-primary">
                Application access
              </div>

              <h1 className="font-display text-3xl font-bold text-gold-primary sm:text-4xl">
                {authMode === "signUp" ? "Create your account" : "Welcome back"}
              </h1>
              <p className="mt-3 text-sm leading-relaxed text-text-stardust/70">
                {authMode === "signUp"
                  ? "Secure your application before continuing for the " +
                    (track ?? "selected track") +
                    " track."
                  : "Sign in to continue your application for the " +
                    (track ?? "selected track") +
                    " track."}
              </p>
            </div>

            {authError && (
              <div className="mb-4 rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-200">
                {authError}
              </div>
            )}

            {authNotice && (
              <div className="mb-4 rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-3 text-sm text-emerald-200">
                {authNotice}
              </div>
            )}

            <div className="mb-6 flex rounded-xl border border-border-cosmic-blue bg-nebula-purple-1/60 p-1">
              <button
                type="button"
                onClick={() => setAuthMode("signUp")}
                className={`flex-1 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                  authMode === "signUp"
                    ? "bg-gold-primary text-bg-void shadow-[0_0_20px_rgba(212,175,55,0.35)]"
                    : "text-text-stardust/70 hover:text-text-stardust"
                }`}
              >
                Sign Up
              </button>
              <button
                type="button"
                onClick={() => setAuthMode("signIn")}
                className={`flex-1 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                  authMode === "signIn"
                    ? "bg-gold-primary text-bg-void shadow-[0_0_20px_rgba(212,175,55,0.35)]"
                    : "text-text-stardust/70 hover:text-text-stardust"
                }`}
              >
                Sign In
              </button>
            </div>

            <form onSubmit={handleAuthSubmit} className="space-y-4">
              {authMode === "signUp" && (
                <div>
                  <label className="mb-2 block text-sm font-medium text-text-stardust/80">
                    Full name
                  </label>
                  <input
                    type="text"
                    value={authName}
                    onChange={(e) => setAuthName(e.target.value)}
                    required
                    autoComplete="name"
                    className="input-cosmic"
                    placeholder="Your full name"
                  />
                </div>
              )}

              <div>
                <label className="mb-2 block text-sm font-medium text-text-stardust/80">
                  Email address
                </label>
                <input
                  type="email"
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  required
                  className="input-cosmic"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-text-stardust/80">
                  Password
                </label>
                <input
                  type="password"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  required
                  className="input-cosmic"
                  placeholder="••••••••"
                />
              </div>

              {authMode === "signUp" && (
                <div>
                  <label className="mb-2 block text-sm font-medium text-text-stardust/80">
                    Confirm password
                  </label>
                  <input
                    type="password"
                    value={authConfirmPassword}
                    onChange={(e) => setAuthConfirmPassword(e.target.value)}
                    required
                    className="input-cosmic"
                    placeholder="Confirm your password"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={authLoading}
                className="btn-primary flex w-full items-center justify-center gap-2 disabled:opacity-60"
              >
                {authLoading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    {authMode === "signUp"
                      ? "Creating account..."
                      : "Signing in..."}
                  </>
                ) : authMode === "signUp" ? (
                  "Create account"
                ) : (
                  "Continue to form"
                )}
              </button>
            </form>

            <div className="mt-5 rounded-xl border border-border-cosmic-blue bg-nebula-purple-1/40 p-3 text-center text-xs leading-relaxed text-text-stardust/55">
              By continuing, you agree to keep your application details secure
              and use this account only for your summit application.
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (existingSubmission) {
    return (
      <div className="min-h-screen bg-bg-void flex items-center justify-center p-4 sm:p-6 relative">
        <StarfieldCanvas starCount={150} showConstellations={true} />

        <div className="relative z-10 w-full max-w-lg">
          <div className="glass-dark rounded-[28px] border border-gold-primary/30 bg-[radial-gradient(circle_at_top,_rgba(212,175,55,0.15),_transparent_40%),_rgba(6,8,12,0.92)] p-6 sm:p-8 shadow-[0_0_40px_rgba(212,175,55,0.15)] backdrop-blur-xl text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-gold-primary/30 bg-gold-primary/10 text-gold-primary">
              <CheckCircle size={36} />
            </div>

            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-gold-primary/30 bg-gold-primary/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-gold-primary">
              Application On Record
            </div>

            <h1 className="font-display text-2xl font-bold text-gold-primary sm:text-3xl mb-3">
              Application Already Submitted
            </h1>

            <p className="text-sm leading-relaxed text-text-stardust/80 mb-6">
              You have already submitted an application for the{" "}
              <strong className="capitalize text-gold-primary">
                {existingSubmission.portal_type}
              </strong>{" "}
              track under <strong>{existingSubmission.applicant_email}</strong>.
            </p>

            <div className="mb-6 rounded-xl border border-border-cosmic-blue bg-nebula-purple-1/50 p-4 text-left space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-stardust/60">Submitted Track:</span>
                <span className="font-medium capitalize text-gold-primary">
                  {existingSubmission.portal_type}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-stardust/60">Status:</span>
                <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-400 border border-emerald-500/20">
                  {existingSubmission.status || "Submitted"}
                </span>
              </div>
              {existingSubmission.created_at && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-text-stardust/60">Submitted On:</span>
                  <span className="text-text-stardust/90 text-xs">
                    {new Date(existingSubmission.created_at).toLocaleDateString(
                      "en-US",
                      {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      },
                    )}
                  </span>
                </div>
              )}
            </div>

            <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs leading-relaxed text-amber-200/90">
              Note: Each applicant is permitted to submit only one application
              across all portals (Delegate, Chair, Secretariat). Multiple
              applications are not accepted.
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/applications"
                className="btn-primary flex-1 flex items-center justify-center gap-2"
              >
                <ArrowLeft size={16} />
                View Portals
              </Link>
              <Link
                href="/"
                className="rounded-xl border border-border-cosmic-blue bg-nebula-purple-1/60 px-4 py-2.5 text-sm font-medium text-text-stardust transition-colors hover:bg-nebula-purple-1 flex-1 flex items-center justify-center"
              >
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="min-h-screen bg-bg-void flex items-center justify-center p-4">
        <StarfieldCanvas starCount={150} showConstellations={false} />
        <div className="relative z-10 max-w-md text-center card-cosmic p-8">
          <AlertCircle size={48} className="text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-heading font-bold text-text-stardust mb-3">
            Form Not Available
          </h1>
          <p className="text-text-stardust/70 mb-6">
            The custom application form for{" "}
            <strong className="capitalize">{track ?? "this track"}</strong> is
            not currently active. Please check back later or contact us
            directly.
          </p>
          <Link
            href="/#applications"
            className="btn-primary inline-flex items-center gap-2"
          >
            <ArrowLeft size={18} />
            Back to Applications
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-void py-16 px-4 relative">
      <StarfieldCanvas starCount={200} showConstellations={true} />

      <div className="container-cosmic max-w-3xl relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <Link
            href="/#applications"
            className="inline-flex items-center gap-2 text-sm text-text-stardust/60 hover:text-gold-primary transition-colors mb-4"
          >
            <ArrowLeft size={16} />
            Back to Application Portals
          </Link>
          <h1 className="text-4xl font-display font-bold text-gold-primary mb-3">
            {form.title}
          </h1>
          <p className="text-text-stardust/80">
            {form.description || "Complete the application form below."}
          </p>
        </div>

        {/* Success/Error Message */}
        {submitStatus && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mb-6 p-6 rounded-xl flex items-start gap-4 ${
              submitStatus.type === "success"
                ? "bg-green-500/10 border border-green-500/30"
                : "bg-red-500/10 border border-red-500/30"
            }`}
          >
            {submitStatus.type === "success" ? (
              <CheckCircle size={24} className="text-green-400 flex-shrink-0" />
            ) : (
              <AlertCircle size={24} className="text-red-400 flex-shrink-0" />
            )}
            <div className="flex-1">
              <h3
                className={`font-heading font-semibold mb-1 ${
                  submitStatus.type === "success"
                    ? "text-green-300"
                    : "text-red-300"
                }`}
              >
                {submitStatus.type === "success"
                  ? "Application Submitted!"
                  : "Submission Failed"}
              </h3>
              <p
                className={`text-sm ${
                  submitStatus.type === "success"
                    ? "text-green-300/80"
                    : "text-red-300/80"
                }`}
              >
                {submitStatus.message}
              </p>
              {submitStatus.type === "success" && (
                <p className="text-xs text-green-300/60 mt-2">
                  Redirecting you back to the main page in 5 seconds...
                </p>
              )}
            </div>
          </motion.div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="card-cosmic p-8 space-y-6">
          {form.fields
            .sort((a, b) => a.display_order - b.display_order)
            .map((field) => (
              <div key={field.id}>
                <label
                  htmlFor={field.id}
                  className="block text-sm font-medium text-text-stardust mb-2"
                >
                  {field.label}
                  {field.required && (
                    <span className="text-red-400 ml-1">*</span>
                  )}
                </label>
                {renderField(field)}
                {errors[field.id] && (
                  <p className="text-xs text-red-400 mt-1">
                    {errors[field.id]}
                  </p>
                )}
              </div>
            ))}

          {/* Submit Button */}
          <div className="pt-4 border-t border-border-cosmic-blue">
            <button
              type="submit"
              disabled={isSubmitting || submitStatus?.type === "success"}
              className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send size={20} />
                  Submit Application
                </>
              )}
            </button>
            <p className="text-xs text-text-stardust/50 text-center mt-3">
              By submitting this form, you agree to our terms and privacy
              policy.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
