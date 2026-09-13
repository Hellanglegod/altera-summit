"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Committee } from "@/types";
import { Download, ExternalLink, Users } from "lucide-react";
import { motion } from "framer-motion";

type CategoryFilter =
  | "All"
  | "Flagship"
  | "Crisis"
  | "Conventional"
  | "Regional";

export function Committees() {
  const [committees, setCommittees] = useState<Committee[]>([]);
  const [activeFilter, setActiveFilter] = useState<CategoryFilter>("All");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchCommittees() {
      try {
        const { data, error } = await supabase
          .from("committees")
          .select("*")
          .eq("is_active", true)
          .order("display_order", { ascending: true });

        if (error) throw error;
        setCommittees(data || []);
      } catch (error) {
        console.error("Error fetching committees:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchCommittees();
  }, []);

  const filteredCommittees =
    activeFilter === "All"
      ? committees
      : committees.filter((c) => c.category === activeFilter);

  const categories: CategoryFilter[] = [
    "All",
    "Flagship",
    "Crisis",
    "Conventional",
    "Regional",
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
      },
    },
  };

  return (
    <section
      id="committees"
      className="section-shell relative overflow-hidden border-t border-border-cosmic-blue/40"
    >
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-nebula-purple-1/50 to-transparent" />

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
            Council Chambers
          </span>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-gold-primary mb-4">
            Our Committees
          </h2>
          <p className="text-text-stardust/80 max-w-2xl mx-auto text-lg">
            Explore {committees.length} meticulously crafted committees spanning
            flagship crises, regional forums, and conventional councils.
          </p>
        </motion.div>

        {/* Category Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-10"
        >
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setActiveFilter(category)}
              className={`px-4 sm:px-6 py-2 sm:py-2.5 rounded-full text-sm sm:text-base font-medium transition-all duration-300 ${
                activeFilter === category
                  ? "bg-gold-primary text-bg-void shadow-lg shadow-gold-primary/20"
                  : "bg-nebula-purple-2 text-text-stardust/70 hover:bg-nebula-purple-1 hover:text-text-stardust border border-border-cosmic-blue"
              }`}
            >
              {category}
            </button>
          ))}
        </motion.div>

        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="card-cosmic p-6 animate-pulse">
                <div className="w-24 h-24 bg-nebula-purple-1 rounded-lg mb-4" />
                <div className="h-6 bg-nebula-purple-1 rounded mb-3 w-3/4" />
                <div className="h-4 bg-nebula-purple-1 rounded mb-2" />
                <div className="h-4 bg-nebula-purple-1 rounded w-5/6" />
              </div>
            ))}
          </div>
        )}

        {/* Committee Grid */}
        {!isLoading && (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6"
          >
            {filteredCommittees.map((committee) => (
              <motion.div
                key={committee.id}
                variants={cardVariants}
                className="card-cosmic p-5 sm:p-6 hover:border-gold-primary/50 transition-all duration-300 group"
              >
                {/* Emblem */}
                {committee.emblem_url ? (
                  <div className="w-24 h-24 bg-nebula-purple-1 rounded-lg mb-4 overflow-hidden border border-border-cosmic-blue">
                    <img
                      src={committee.emblem_url}
                      alt={`${committee.name} emblem`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-24 h-24 bg-nebula-purple-1 rounded-lg mb-4 flex items-center justify-center border border-border-cosmic-blue">
                    <Users size={32} className="text-gold-primary/50" />
                  </div>
                )}

                {/* Category Badge */}
                <span className="inline-block px-3 py-1 rounded-full text-xs font-medium mb-3 bg-gold-primary/10 text-gold-primary border border-gold-primary/20">
                  {committee.category}
                </span>

                {/* Committee Name */}
                <h3 className="font-heading text-xl font-semibold text-text-stardust mb-2 group-hover:text-gold-primary transition-colors">
                  {committee.name}
                </h3>

                {/* Abbreviation */}
                {committee.abbreviation && (
                  <p className="text-sm text-text-stardust/60 mb-3">
                    {committee.abbreviation}
                  </p>
                )}

                {/* Agenda */}
                <p className="text-text-stardust/80 text-sm mb-4 line-clamp-2">
                  {committee.agenda}
                </p>

                {/* Chairs */}
                {(committee.chair_name || committee.cochair_name) && (
                  <div className="mb-4 pb-4 border-b border-border-cosmic-blue">
                    <p className="text-xs text-text-stardust/60 mb-1.5">
                      Chair{committee.cochair_name ? "s" : ""}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {committee.chair_name && (
                        <span className="text-xs px-2 py-1 rounded bg-nebula-purple-1 text-text-stardust/80">
                          {committee.chair_name}
                        </span>
                      )}
                      {committee.cochair_name && (
                        <span className="text-xs px-2 py-1 rounded bg-nebula-purple-1 text-text-stardust/80">
                          {committee.cochair_name}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Download Buttons */}
                <div className="flex gap-2">
                  {committee.study_guide_url && (
                    <a
                      href={committee.study_guide_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-nebula-purple-1 hover:bg-gold-primary/10 border border-border-cosmic-blue hover:border-gold-primary/50 text-text-stardust hover:text-gold-primary transition-all duration-300 text-sm"
                    >
                      <Download size={16} />
                      <span>Guide</span>
                    </a>
                  )}
                  {committee.matrix_url && (
                    <a
                      href={committee.matrix_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-nebula-purple-1 hover:bg-gold-primary/10 border border-border-cosmic-blue hover:border-gold-primary/50 text-text-stardust hover:text-gold-primary transition-all duration-300 text-sm"
                    >
                      <ExternalLink size={16} />
                      <span>Matrix</span>
                    </a>
                  )}
                </div>

                {/* Status Tag */}
                {committee.status && (
                  <div className="mt-4 pt-4 border-t border-border-cosmic-blue">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                        committee.status === "active"
                          ? "badge-active"
                          : committee.status === "allocation_full"
                            ? "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
                            : "badge-closed"
                      }`}
                    >
                      {committee.status === "active"
                        ? "Open"
                        : committee.status === "allocation_full"
                          ? "Allocation Full"
                          : "Waitlist Only"}
                    </span>
                  </div>
                )}
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Empty State */}
        {!isLoading && filteredCommittees.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <div className="w-24 h-24 rounded-full bg-nebula-purple-1 flex items-center justify-center mx-auto mb-4">
              <Users size={40} className="text-text-stardust/40" />
            </div>
            <h3 className="font-heading text-xl text-text-stardust/80 mb-2">
              No committees found
            </h3>
            <p className="text-text-stardust/60">
              Try selecting a different category filter
            </p>
          </motion.div>
        )}
      </div>
    </section>
  );
}
