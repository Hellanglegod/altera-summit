"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { StarfieldCanvas } from "@/components/ui/StarfieldCanvas";
import { supabase } from "@/lib/supabase";
import { getTimeRemaining } from "@/lib/utils";

interface CountdownState {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export function Hero() {
  const [countdown, setCountdown] = useState<CountdownState>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [eventDate, setEventDate] = useState<Date | null>(null);

  useEffect(() => {
    async function fetchEventDate() {
      const { data, error } = await supabase
        .from("event_config")
        .select("event_start_at")
        .limit(1);

      if (error) {
        console.error("Error fetching event date:", error);
        return;
      }

      const eventStartAt = data?.[0]?.event_start_at;
      if (eventStartAt) setEventDate(new Date(eventStartAt));
    }

    fetchEventDate();
  }, []);

  useEffect(() => {
    if (!eventDate) return;

    const updateCountdown = () => {
      const timeRemaining = getTimeRemaining(eventDate);
      setCountdown({
        days: timeRemaining.days,
        hours: timeRemaining.hours,
        minutes: timeRemaining.minutes,
        seconds: timeRemaining.seconds,
      });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [eventDate]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.2, delayChildren: 0.3 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8 } },
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center pt-24 sm:pt-20 overflow-hidden px-2 sm:px-0">
      {/* Background starfield */}
      <div className="absolute inset-0">
        <StarfieldCanvas starCount={150} showConstellations={true} />
      </div>

      {/* Content */}
      <div className="relative container-cosmic z-10 flex flex-col items-center text-center">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-5 sm:space-y-6 md:space-y-8 w-full"
        >
          {/* Eyebrow Badge */}
          <motion.div variants={itemVariants}>
            <div className="inline-block max-w-full px-3 py-2 sm:px-4 rounded-full bg-nebula-purple-1/50 border border-gold-primary/30 backdrop-blur-sm">
              <p className="text-[0.68rem] sm:text-sm md:text-base font-body text-gold-primary tracking-wider">
                ✦ THE ANNUAL MODEL UNITED NATIONS CONFERENCE ✦
              </p>
            </div>
          </motion.div>

          {/* Main Headline */}
          <motion.h1
            variants={itemVariants}
            className="font-display text-[clamp(2.8rem,9vw,7rem)] font-bold text-gold-primary leading-[0.96] tracking-tight"
          >
            Forging Destiny
            <br />
            Among the Stars
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            variants={itemVariants}
            className="font-heading text-base sm:text-xl md:text-2xl text-text-stardust/80 max-w-3xl mx-auto leading-relaxed px-2 sm:px-0"
          >
            An elite Model United Nations conference blending cosmology with
            classical antiquity. Engage in diplomatic discourse, forge global
            solutions, and shape the future.
          </motion.p>

          {/* Countdown Timer */}
          <motion.div variants={itemVariants} className="py-6 sm:py-8">
            <p className="text-xs sm:text-sm md:text-base font-body text-text-stardust/60 uppercase tracking-widest mb-4 sm:mb-6">
              Conference Begins In
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6 max-w-2xl mx-auto">
              {[
                { label: "Days", value: countdown.days },
                { label: "Hours", value: countdown.hours },
                { label: "Minutes", value: countdown.minutes },
                { label: "Seconds", value: countdown.seconds },
              ].map((item) => (
                <motion.div
                  key={item.label}
                  whileHover={{ scale: 1.05 }}
                  className="relative group min-w-0"
                >
                  <div className="absolute inset-0 bg-gold-primary/20 rounded-lg blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="relative bg-nebula-purple-2/80 border border-gold-primary/50 rounded-lg p-3 sm:p-4 md:p-6 backdrop-blur-sm">
                    <div className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-display font-bold text-gold-primary leading-none">
                      {String(item.value).padStart(2, "0")}
                    </div>
                    <div className="text-[0.6rem] sm:text-xs md:text-sm font-body text-text-stardust/60 uppercase tracking-wider mt-2">
                      {item.label}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* CTAs */}
          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 md:gap-6 pt-6 sm:pt-8"
          >
            <Link
              href="#committees"
              className="btn-primary text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 w-full sm:w-auto"
            >
              Explore Committees
            </Link>
            <Link
              href="#applications"
              className="btn-secondary text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 w-full sm:w-auto"
            >
              Enter Portal
            </Link>
          </motion.div>

          {/* Scroll Indicator */}
          <motion.div
            variants={itemVariants}
            className="pt-12"
            animate={{ y: [0, 10, 0] }}
            transition={{ repeat: Infinity, duration: 3 }}
          >
            <p className="text-sm text-text-stardust/40 font-body">
              Scroll to explore
            </p>
          </motion.div>
        </motion.div>
      </div>

      {/* Gradient overlay at bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-bg-void to-transparent" />
    </section>
  );
}
