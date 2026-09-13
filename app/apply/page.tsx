"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Header, Footer } from "@/components/layout";
import { Users, Award, Crown, CheckCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";

const tracks = [
  {
    type: "delegate",
    title: "Delegate Application",
    description:
      "Join the summit as a delegate and represent a nation on the global stage.",
    icon: Users,
  },
  {
    type: "chair",
    title: "Chair Application",
    description:
      "Lead a committee and guide diplomatic discussion with confidence and clarity.",
    icon: Award,
  },
  {
    type: "secretariat",
    title: "Secretariat Application",
    description:
      "Support the summit behind the scenes and help shape the conference experience.",
    icon: Crown,
  },
] as const;

export default function ApplyLandingPage() {
  const [userSubmission, setUserSubmission] = useState<{
    portal_type: string;
    status: string;
  } | null>(null);

  useEffect(() => {
    async function checkUserSubmission() {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user?.email) return;

      const email = session.user.email;
      const userId = session.user.id;

      // 1. Check form_submissions
      const { data: subData } = await supabase
        .from("form_submissions")
        .select("portal_type, status")
        .ilike("applicant_email", email)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (subData) {
        setUserSubmission(subData);
        return;
      }

      // 2. Check secretariat_members
      const { data: secData } = await supabase
        .from("secretariat_members")
        .select("id")
        .ilike("email", email)
        .limit(1)
        .maybeSingle();

      if (secData) {
        setUserSubmission({ portal_type: "secretariat", status: "Accepted" });
        return;
      }

      // 3. Check admin_role_assignments
      const { data: roleData } = await supabase
        .from("admin_role_assignments")
        .select("id")
        .eq("user_id", userId)
        .limit(1)
        .maybeSingle();

      if (roleData) {
        setUserSubmission({ portal_type: "secretariat", status: "Accepted" });
        return;
      }
    }

    checkUserSubmission();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-bg-void text-text-stardust">
      <Header />
      <main className="flex-1 pt-20">
        <section className="section-shell relative overflow-hidden border-t border-border-cosmic-blue/40">
          <div className="container-cosmic relative z-10">
            <div className="mx-auto mb-10 max-w-3xl text-center">
              <span className="mb-4 inline-block rounded-full border border-gold-primary/30 bg-gold-primary/10 px-4 py-2 text-sm font-medium text-gold-primary">
                Application Access
              </span>
              <h1 className="mb-4 font-display text-4xl font-bold text-gold-primary md:text-5xl">
                Choose your application path
              </h1>
              <p className="text-lg text-text-stardust/80">
                Select an application portal below to sign up and submit your
                application.
              </p>
            </div>

            {userSubmission && (
              <div className="mx-auto mb-10 max-w-2xl rounded-2xl border border-gold-primary/30 bg-gold-primary/10 p-5 text-center backdrop-blur-md">
                <div className="mb-1 inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-gold-primary">
                  <CheckCircle size={18} /> Application On Record
                </div>
                <p className="text-sm text-text-stardust/90">
                  You have already submitted an application for the{" "}
                  <strong className="capitalize text-gold-primary">
                    {userSubmission.portal_type}
                  </strong>{" "}
                  track (Status:{" "}
                  <span className="font-semibold text-emerald-400">
                    {userSubmission.status || "Submitted"}
                  </span>
                  ). Applicants may only submit one application across all
                  portals.
                </p>
              </div>
            )}

            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {tracks.map(({ type, title, description, icon: Icon }) => {
                const isAppliedTrack = userSubmission?.portal_type === type;
                const isOtherApplied =
                  userSubmission && userSubmission.portal_type !== type;

                return (
                  <Link
                    key={type}
                    href={`/apply/${type}`}
                    className={`card-cosmic group rounded-2xl p-6 transition-all duration-300 ${
                      isOtherApplied
                        ? "opacity-60 hover:border-border-cosmic-blue cursor-not-allowed"
                        : "hover:border-gold-primary/60"
                    }`}
                  >
                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl border border-gold-primary/25 bg-gold-primary/10 text-gold-primary">
                      <Icon size={28} />
                    </div>
                    <div className="mb-2 text-xs uppercase tracking-[0.2em] text-gold-primary/80">
                      {type}
                    </div>
                    <h2 className="mb-3 font-heading text-3xl text-text-stardust group-hover:text-gold-primary">
                      {title}
                    </h2>
                    <p className="text-sm leading-relaxed text-text-stardust/70">
                      {description}
                    </p>
                    <div className="mt-5 inline-flex items-center text-sm font-medium text-gold-primary">
                      {isAppliedTrack ? (
                        <span className="inline-flex items-center gap-1.5 text-emerald-400 font-semibold">
                          <CheckCircle size={16} /> View Submission
                        </span>
                      ) : isOtherApplied ? (
                        <span className="text-text-stardust/40">
                          Application Limit Reached
                        </span>
                      ) : (
                        "Continue to form"
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
