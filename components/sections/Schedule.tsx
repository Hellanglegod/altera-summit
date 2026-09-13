"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { ScheduleItem } from "@/types";
import { Clock, MapPin, Calendar } from "lucide-react";
import { motion } from "framer-motion";

export function Schedule() {
  const [scheduleByDay, setScheduleByDay] = useState<{
    [key: number]: ScheduleItem[];
  }>({});
  const [activeDay, setActiveDay] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchSchedule() {
      try {
        const { data, error } = await supabase
          .from("schedule_items")
          .select("*")
          .eq("is_active", true)
          .order("day", { ascending: true })
          .order("display_order", { ascending: true });

        if (error) throw error;

        // Group by day
        const grouped = (data || []).reduce(
          (acc, item) => {
            if (!acc[item.day]) acc[item.day] = [];
            acc[item.day].push(item);
            return acc;
          },
          {} as { [key: number]: ScheduleItem[] },
        );

        setScheduleByDay(grouped);
      } catch (error) {
        console.error("Error fetching schedule:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchSchedule();
  }, []);

  const days = Object.keys(scheduleByDay).map(Number).sort();
  const currentDaySchedule = scheduleByDay[activeDay] || [];

  return (
    <section
      id="schedule"
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
            Conference Agenda
          </span>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-gold-primary mb-4">
            Schedule
          </h2>
          <p className="text-text-stardust/80 max-w-2xl mx-auto text-lg">
            A meticulously crafted timeline of sessions, debates, and ceremonies
            across three days of diplomatic excellence.
          </p>
        </motion.div>

        {/* Day Tabs */}
        {!isLoading && days.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-wrap justify-center gap-3 mb-10"
          >
            {days.map((day) => (
              <button
                key={day}
                onClick={() => setActiveDay(day)}
                className={`px-4 sm:px-8 py-2.5 sm:py-3 rounded-lg font-medium transition-all duration-300 flex items-center gap-2 ${
                  activeDay === day
                    ? "bg-gold-primary text-bg-void shadow-lg shadow-gold-primary/20"
                    : "bg-nebula-purple-2 text-text-stardust/70 hover:bg-nebula-purple-1 hover:text-text-stardust border border-border-cosmic-blue"
                }`}
              >
                <Calendar size={18} />
                Day {day}
              </button>
            ))}
          </motion.div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="card-cosmic p-6 animate-pulse">
                <div className="flex gap-4">
                  <div className="w-20 h-20 bg-nebula-purple-1 rounded-lg" />
                  <div className="flex-1">
                    <div className="h-6 bg-nebula-purple-1 rounded mb-3 w-3/4" />
                    <div className="h-4 bg-nebula-purple-1 rounded w-1/2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Schedule Timeline */}
        {!isLoading && currentDaySchedule.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="space-y-4"
          >
            {currentDaySchedule.map((item, idx) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.1 * idx }}
                className="card-cosmic p-5 sm:p-6 hover:border-gold-primary/50 transition-all duration-300 group relative"
              >
                <div className="flex flex-col md:flex-row gap-6 relative z-10">
                  {/* Time Badge */}
                  <div className="flex-shrink-0">
                    <div className="w-20 h-20 rounded-lg bg-gold-primary/10 border border-gold-primary/20 flex flex-col items-center justify-center group-hover:bg-gold-primary/20 transition-colors">
                      <Clock size={20} className="text-gold-primary mb-1" />
                      <span className="text-gold-primary font-semibold text-sm">
                        {item.time}
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <h3 className="font-heading text-xl font-semibold text-text-stardust mb-2 group-hover:text-gold-primary transition-colors">
                      {item.title}
                    </h3>
                    {item.description && (
                      <p className="text-text-stardust/70 text-sm mb-3">
                        {item.description}
                      </p>
                    )}
                    {item.location && (
                      <div className="flex items-center gap-2 text-text-stardust/60 text-sm">
                        <MapPin size={16} className="text-gold-primary/60" />
                        <span>{item.location}</span>
                      </div>
                    )}
                  </div>

                  {/* Connector Line (except last item) */}
                  {idx < currentDaySchedule.length - 1 && (
                    <div className="hidden md:block absolute left-[6.5rem] top-[5.5rem] bottom-[-1.5rem] w-px bg-border-cosmic-blue" />
                  )}
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Empty State */}
        {!isLoading && days.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16 card-cosmic"
          >
            <div className="w-24 h-24 rounded-full bg-nebula-purple-1 flex items-center justify-center mx-auto mb-4">
              <Calendar size={40} className="text-text-stardust/40" />
            </div>
            <h3 className="font-heading text-xl text-text-stardust/80 mb-2">
              Schedule coming soon
            </h3>
            <p className="text-text-stardust/60">
              The detailed conference schedule will be published shortly
            </p>
          </motion.div>
        )}

        {!isLoading && days.length > 0 && currentDaySchedule.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16 card-cosmic"
          >
            <p className="text-text-stardust/60">
              No events scheduled for Day {activeDay}
            </p>
          </motion.div>
        )}
      </div>
    </section>
  );
}
