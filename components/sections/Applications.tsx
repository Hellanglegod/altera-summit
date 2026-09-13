"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { PortalSettings } from "@/types";
import { Users, Award, Crown, ExternalLink, Lock, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";

const trackConfig = {
  delegate: {
    icon: Users,
    title: "Delegate Applications",
    description: "Join us as a delegate and represent nations on the global stage",
    features: [
      "Access to all committee sessions",
      "Participate in voting and resolutions",
      "Networking opportunities",
      "Certificate of participation",
    ],
    color: "blue",
  },
  chair: {
    icon: Award,
    title: "Chair Applications",
    description: "Lead committees and guide diplomatic discourse",
    features: [
      "Chair a committee of your choice",
      "Mentor and guide delegates",
      "Shape the conference experience",
      "Leadership certificate",
    ],
    color: "purple",
  },
  secretariat: {
    icon: Crown,
    title: "Secretariat Applications",
    description: "Join the core team organizing Altera Summit",
    features: [
      "Work behind the scenes",
      "Logistics and operations",
      "Strategic planning",
      "Executive team experience",
    ],
    color: "gold",
  },
};

export function Applications() {
  const [portals, setPortals] = useState<PortalSettings[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchPortalSettings() {
      try {
        const { data, error } = await supabase
          .from("portal_settings")
          .select("*")
          .order("portal_type", { ascending: true });

        if (error) throw error;
        setPortals(data || []);
      } catch (error) {
        console.error("Error fetching portal settings:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchPortalSettings();

    // Real-time subscription for portal status changes
    const subscription = supabase
      .channel("portal_settings_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "portal_settings",
        },
        (payload) => {
          if (payload.eventType === "UPDATE") {
            setPortals((prev) =>
              prev.map((p) =>
                p.id === payload.new.id ? (payload.new as PortalSettings) : p
              )
            );
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const getPortalByType = (type: "delegate" | "chair" | "secretariat") => {
    return portals.find((p) => p.portal_type === type);
  };

  const handleApply = (portal: PortalSettings) => {
    if (!portal.is_active) return;

    if (portal.form_mode === "google_form" || portal.form_mode === "external_link") {
      if (portal.form_url) {
        window.open(portal.form_url, "_blank", "noopener,noreferrer");
      }
    } else if (portal.form_mode === "custom_builder") {
      // Navigate to custom form page (to be built)
      window.location.href = `/apply/${portal.portal_type}`;
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
      },
    },
  };

  return (
    <section id="applications" className="py-24 relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-nebula-purple-1/30 to-transparent" />

      <div className="container-cosmic relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <span className="inline-block px-4 py-2 rounded-full border border-gold-primary/30 bg-gold-primary/10 text-gold-primary text-sm font-medium mb-4">
            Join the Summit
          </span>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-gold-primary mb-4">
            Application Portals
          </h2>
          <p className="text-text-stardust/80 max-w-2xl mx-auto text-lg">
            Choose your path and become part of an elite diplomatic experience.
            Applications are reviewed on a rolling basis.
          </p>
        </motion.div>

        {/* Application Tracks */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12"
        >
          {(["delegate", "chair", "secretariat"] as const).map((type) => {
            const config = trackConfig[type];
            const portal = getPortalByType(type);
            const IconComponent = config.icon;

            return (
              <motion.div
                key={type}
                variants={cardVariants}
                className={`card-cosmic p-8 relative group ${
                  portal?.is_active
                    ? "hover:border-gold-primary/50"
                    : "opacity-80"
                } transition-all duration-300`}
              >
                {/* Status Badge */}
                <div className="absolute top-4 right-4">
                  {isLoading ? (
                    <div className="w-20 h-6 bg-nebula-purple-1 animate-pulse rounded-full" />
                  ) : portal?.is_active ? (
                    <span className="badge-active flex items-center gap-1.5">
                      <CheckCircle size={14} />
                      Open
                    </span>
                  ) : (
                    <span className="badge-closed flex items-center gap-1.5">
                      <Lock size={14} />
                      Closed
                    </span>
                  )}
                </div>

                {/* Icon */}
                <div
                  className={`w-16 h-16 rounded-lg flex items-center justify-center mb-6 ${
                    config.color === "blue"
                      ? "bg-blue-500/10 border border-blue-500/20"
                      : config.color === "purple"
                      ? "bg-purple-500/10 border border-purple-500/20"
                      : "bg-gold-primary/10 border border-gold-primary/20"
                  }`}
                >
                  <IconComponent
                    size={32}
                    className={
                      config.color === "blue"
                        ? "text-blue-400"
                        : config.color === "purple"
                        ? "text-purple-400"
                        : "text-gold-primary"
                    }
                  />
                </div>

                {/* Title & Description */}
                <h3 className="font-heading text-2xl font-semibold text-text-stardust mb-3">
                  {config.title}
                </h3>
                <p className="text-text-stardust/70 text-sm mb-6">
                  {config.description}
                </p>

                {/* Features */}
                <ul className="space-y-2 mb-6">
                  {config.features.map((feature, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-2 text-sm text-text-stardust/80"
                    >
                      <CheckCircle
                        size={16}
                        className="text-gold-primary/60 flex-shrink-0 mt-0.5"
                      />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* Apply Button or Closed Message */}
                {isLoading ? (
                  <div className="h-11 bg-nebula-purple-1 animate-pulse rounded-lg" />
                ) : portal?.is_active ? (
                  <button
                    onClick={() => handleApply(portal)}
                    className="w-full btn-primary flex items-center justify-center gap-2"
                  >
                    Apply Now
                    <ExternalLink size={18} />
                  </button>
                ) : (
                  <div className="p-4 rounded-lg bg-nebula-purple-1 border border-border-cosmic-blue">
                    <p className="text-sm text-text-stardust/70 text-center">
                      {portal?.closed_message ||
                        "Applications are currently closed. Check back soon!"}
                    </p>
                  </div>
                )}

                {/* Glow Effect on Hover (Only when active) */}
                {portal?.is_active && (
                  <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                    <div className="absolute inset-0 bg-gradient-to-br from-gold-primary/5 to-transparent rounded-2xl" />
                  </div>
                )}
              </motion.div>
            );
          })}
        </motion.div>

        {/* Additional Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="card-cosmic p-6 text-center"
        >
          <p className="text-text-stardust/80">
            <span className="font-semibold text-gold-primary">
              Rolling Admissions:
            </span>{" "}
            Applications are reviewed as they arrive. Early submission is
            encouraged as positions fill quickly. Decisions are typically
            communicated within 7-10 business days.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
