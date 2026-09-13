"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { SecretariatMember } from "@/types";
import { Mail, Link, User } from "lucide-react";
import { motion } from "framer-motion";

export function Secretariat() {
  const [members, setMembers] = useState<SecretariatMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchSecretariat() {
      try {
        const { data, error } = await supabase
          .from("secretariat_members")
          .select("*")
          .eq("is_active", true)
          .order("display_order", { ascending: true });

        if (error) throw error;
        setMembers(data || []);
      } catch (error) {
        console.error("Error fetching secretariat:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchSecretariat();
  }, []);

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
      id="secretariat"
      className="section-shell relative overflow-hidden border-t border-border-cosmic-blue/40"
    >
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-nebula-purple-1/30 to-transparent" />

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
            Meet the Team
          </span>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-gold-primary mb-4">
            The Secretariat
          </h2>
          <p className="text-text-stardust/80 max-w-2xl mx-auto text-lg">
            Our dedicated team of experienced diplomats and organizers working
            tirelessly to create an unforgettable conference experience.
          </p>
        </motion.div>

        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="card-cosmic p-6 animate-pulse">
                <div className="w-32 h-32 bg-nebula-purple-1 rounded-full mx-auto mb-4" />
                <div className="h-6 bg-nebula-purple-1 rounded mb-2 w-3/4 mx-auto" />
                <div className="h-4 bg-nebula-purple-1 rounded w-1/2 mx-auto" />
              </div>
            ))}
          </div>
        )}

        {/* Secretariat Grid */}
        {!isLoading && members.length > 0 && (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6"
          >
            {members.map((member) => (
              <motion.div
                key={member.id}
                variants={cardVariants}
                className="card-cosmic p-5 sm:p-6 text-center group hover:border-gold-primary/50 transition-all duration-300"
              >
                {/* Photo */}
                <div className="relative w-32 h-32 mx-auto mb-4">
                  {member.photo_url ? (
                    <div className="w-full h-full rounded-full overflow-hidden border-2 border-gold-primary/20 group-hover:border-gold-primary/50 transition-colors">
                      <img
                        src={member.photo_url}
                        alt={member.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-full h-full rounded-full bg-nebula-purple-1 border-2 border-gold-primary/20 group-hover:border-gold-primary/50 flex items-center justify-center transition-colors">
                      <User size={48} className="text-gold-primary/50" />
                    </div>
                  )}
                  {/* Glow effect on hover */}
                  <div className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                    <div className="absolute inset-0 rounded-full bg-gold-primary/10 blur-xl" />
                  </div>
                </div>

                {/* Name */}
                <h3 className="font-heading text-xl font-semibold text-text-stardust mb-1 group-hover:text-gold-primary transition-colors">
                  {member.name}
                </h3>

                {/* Designation */}
                <p className="text-gold-primary/80 text-sm font-medium mb-3">
                  {member.designation}
                </p>

                {/* Bio */}
                {member.bio && (
                  <p className="text-text-stardust/70 text-sm mb-4 line-clamp-3">
                    {member.bio}
                  </p>
                )}

                {/* Social Links */}
                {(member.email || member.linkedin_url) && (
                  <div className="flex justify-center gap-3 pt-4 border-t border-border-cosmic-blue">
                    {member.email && (
                      <a
                        href={`mailto:${member.email}`}
                        className="w-9 h-9 rounded-full bg-nebula-purple-1 hover:bg-gold-primary/10 border border-border-cosmic-blue hover:border-gold-primary/50 flex items-center justify-center text-text-stardust hover:text-gold-primary transition-all duration-300"
                        title={`Email ${member.name}`}
                      >
                        <Mail size={16} />
                      </a>
                    )}
                    {member.linkedin_url && (
                      <a
                        href={member.linkedin_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-9 h-9 rounded-full bg-nebula-purple-1 hover:bg-gold-primary/10 border border-border-cosmic-blue hover:border-gold-primary/50 flex items-center justify-center text-text-stardust hover:text-gold-primary transition-all duration-300"
                        title={`${member.name} on LinkedIn`}
                      >
                        <Link size={16} />
                      </a>
                    )}
                  </div>
                )}
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Empty State */}
        {!isLoading && members.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <div className="w-24 h-24 rounded-full bg-nebula-purple-1 flex items-center justify-center mx-auto mb-4">
              <User size={40} className="text-text-stardust/40" />
            </div>
            <h3 className="font-heading text-xl text-text-stardust/80 mb-2">
              Secretariat coming soon
            </h3>
            <p className="text-text-stardust/60">
              Our team roster will be announced shortly
            </p>
          </motion.div>
        )}
      </div>
    </section>
  );
}
