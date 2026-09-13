"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { EventConfig } from "@/types";
import { Globe, Users, Calendar, Trophy } from "lucide-react";
import { motion } from "framer-motion";

export function About() {
  const [eventConfig, setEventConfig] = useState<EventConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchEventConfig() {
      try {
        const { data, error } = await supabase
          .from("event_config")
          .select("*")
          .limit(1);

        if (error) throw error;
        setEventConfig(data?.[0] || null);
      } catch (error) {
        console.error("Error fetching event config:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchEventConfig();
  }, []);

  const stats = [
    {
      icon: Users,
      value: eventConfig?.delegate_count || "300+",
      label: "Delegates",
      color: "blue",
    },
    {
      icon: Globe,
      value: eventConfig?.committee_count || "14",
      label: "Committees",
      color: "purple",
    },
    {
      icon: Calendar,
      value: eventConfig?.days_of_debate || "3",
      label: "Days of Debate",
      color: "gold",
    },
    {
      icon: Trophy,
      value: eventConfig?.prize_pool_display || "$5,000",
      label: "Prize Pool",
      color: "green",
    },
  ];

  return (
    <section
      id="about"
      className="section-shell relative overflow-hidden border-t border-border-cosmic-blue/40"
    >
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-nebula-purple-1/50 via-transparent to-nebula-purple-1/50" />

      <div className="container-cosmic relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10"
        >
          <span className="inline-block px-4 py-2 rounded-full border border-gold-primary/30 bg-gold-primary/10 text-gold-primary text-sm font-medium mb-4">
            About the Summit
          </span>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-gold-primary mb-6">
            Where Diplomacy Meets the Cosmos
          </h2>
          <p className="text-text-stardust/80 max-w-3xl mx-auto text-lg leading-relaxed">
            Altera Summit is an elite Model United Nations conference that
            transcends traditional diplomacy. Inspired by the mysteries of the
            cosmos and the grandeur of classical antiquity, we create an
            experience where delegates don't just debate—they{" "}
            <span className="text-gold-primary font-semibold">
              forge destiny among the stars
            </span>
            .
          </p>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mb-10"
        >
          {stats.map((stat, idx) => {
            const IconComponent = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 * idx }}
                className="card-cosmic p-6 text-center"
              >
                <div
                  className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 ${
                    stat.color === "blue"
                      ? "bg-blue-500/10 border border-blue-500/20"
                      : stat.color === "purple"
                        ? "bg-purple-500/10 border border-purple-500/20"
                        : stat.color === "gold"
                          ? "bg-gold-primary/10 border border-gold-primary/20"
                          : "bg-green-500/10 border border-green-500/20"
                  }`}
                >
                  <IconComponent
                    size={28}
                    className={
                      stat.color === "blue"
                        ? "text-blue-400"
                        : stat.color === "purple"
                          ? "text-purple-400"
                          : stat.color === "gold"
                            ? "text-gold-primary"
                            : "text-green-400"
                    }
                  />
                </div>
                {isLoading ? (
                  <div className="h-8 w-16 bg-nebula-purple-1 animate-pulse rounded mx-auto mb-2" />
                ) : (
                  <p className="font-display text-3xl font-bold text-text-stardust mb-1">
                    {stat.value}
                  </p>
                )}
                <p className="text-text-stardust/60 text-sm">{stat.label}</p>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Vision & Mission */}
        <div className="grid md:grid-cols-2 gap-6 mb-10">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="card-cosmic p-8"
          >
            <h3 className="font-heading text-2xl font-semibold text-gold-primary mb-4">
              Our Vision
            </h3>
            <p className="text-text-stardust/80 leading-relaxed">
              To cultivate a generation of leaders who approach global
              challenges with the same wonder and ambition that drives humanity
              to explore the stars. We believe that diplomacy, like space
              exploration, requires courage, collaboration, and a commitment to
              pushing boundaries.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="card-cosmic p-8"
          >
            <h3 className="font-heading text-2xl font-semibold text-gold-primary mb-4">
              Our Mission
            </h3>
            <p className="text-text-stardust/80 leading-relaxed">
              To provide an immersive, intellectually rigorous platform where
              delegates engage with pressing global issues, hone their
              diplomatic skills, and build lasting connections—all within an
              environment that celebrates both the elegance of antiquity and the
              limitless potential of the future.
            </p>
          </motion.div>
        </div>

        {/* What Sets Us Apart */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="card-cosmic p-6 sm:p-6 sm:p-6 sm:p-8"
        >
          <h3 className="font-heading text-2xl font-semibold text-gold-primary mb-6 text-center">
            What Sets Altera Summit Apart
          </h3>
          <div className="grid md:grid-cols-3 gap-5 sm:gap-6">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-gold-primary/10 border border-gold-primary/20 flex items-center justify-center mx-auto mb-3">
                <span className="text-gold-primary font-display text-xl font-bold">
                  1
                </span>
              </div>
              <h4 className="font-heading font-semibold text-text-stardust mb-2">
                Thematic Excellence
              </h4>
              <p className="text-text-stardust/70 text-sm">
                A cosmic design ethos that makes every moment memorable, from
                opening ceremonies to closing awards.
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-gold-primary/10 border border-gold-primary/20 flex items-center justify-center mx-auto mb-3">
                <span className="text-gold-primary font-display text-xl font-bold">
                  2
                </span>
              </div>
              <h4 className="font-heading font-semibold text-text-stardust mb-2">
                Diverse Committees
              </h4>
              <p className="text-text-stardust/70 text-sm">
                From flagship UNSC to innovative crisis simulations like the
                Galactic Senate, we offer something for everyone.
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-gold-primary/10 border border-gold-primary/20 flex items-center justify-center mx-auto mb-3">
                <span className="text-gold-primary font-display text-xl font-bold">
                  3
                </span>
              </div>
              <h4 className="font-heading font-semibold text-text-stardust mb-2">
                Elite Secretariat
              </h4>
              <p className="text-text-stardust/70 text-sm">
                Our team comprises seasoned MUN veterans and thought leaders
                dedicated to creating an unparalleled experience.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Video/Poster Placeholder */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mt-10 card-cosmic p-6 sm:p-8 text-center"
        >
          <h3 className="font-heading text-2xl font-semibold text-gold-primary mb-4">
            Experience the Summit
          </h3>
          <div className="aspect-video bg-nebula-purple-1 rounded-lg border border-border-cosmic-blue flex items-center justify-center">
            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-gold-primary/10 border-2 border-gold-primary/30 flex items-center justify-center mx-auto mb-4">
                <div className="w-0 h-0 border-t-[12px] border-t-transparent border-l-[20px] border-l-gold-primary border-b-[12px] border-b-transparent ml-1"></div>
              </div>
              <p className="text-text-stardust/60">
                Conference highlight video coming soon
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
