"use client";

import { useAdminAuth } from "@/components/admin/AuthProvider";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  Users,
  FileText,
  Layers,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

interface DashboardStats {
  totalSubmissions: number;
  pendingReview: number;
  totalCommittees: number;
  activePortals: number;
}

export default function AdminDashboardPage() {
  const { user, role } = useAdminAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalSubmissions: 0,
    pendingReview: 0,
    totalCommittees: 0,
    activePortals: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        // Fetch submission stats
        const { count: totalSubmissions } = await supabase
          .from("form_submissions")
          .select("*", { count: "exact", head: true });

        const { count: pendingReview } = await supabase
          .from("form_submissions")
          .select("*", { count: "exact", head: true })
          .eq("status", "Submitted");

        // Fetch committee count
        const { count: totalCommittees } = await supabase
          .from("committees")
          .select("*", { count: "exact", head: true })
          .eq("is_active", true);

        // Fetch active portals
        const { count: activePortals } = await supabase
          .from("portal_settings")
          .select("*", { count: "exact", head: true })
          .eq("is_active", true);

        setStats({
          totalSubmissions: totalSubmissions || 0,
          pendingReview: pendingReview || 0,
          totalCommittees: totalCommittees || 0,
          activePortals: activePortals || 0,
        });
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchStats();
  }, []);

  const statCards = [
    {
      title: "Total Applications",
      value: stats.totalSubmissions,
      icon: FileText,
      color: "text-blue-400",
      bgColor: "bg-blue-500/10",
    },
    {
      title: "Pending Review",
      value: stats.pendingReview,
      icon: Clock,
      color: "text-yellow-400",
      bgColor: "bg-yellow-500/10",
    },
    {
      title: "Active Committees",
      value: stats.totalCommittees,
      icon: Layers,
      color: "text-green-400",
      bgColor: "bg-green-500/10",
    },
    {
      title: "Open Portals",
      value: stats.activePortals,
      icon: CheckCircle,
      color: "text-gold-primary",
      bgColor: "bg-gold-primary/10",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-display font-bold text-gold-primary mb-2">
          Dashboard
        </h1>
        <p className="text-text-stardust/60">
          Welcome back, {user?.email?.split("@")[0]}! Here's your overview.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card) => (
          <div key={card.title} className="card-cosmic p-6">
            <div className="flex items-start justify-between mb-4">
              <div className={`p-3 rounded-lg ${card.bgColor}`}>
                <card.icon size={24} className={card.color} />
              </div>
              <TrendingUp size={20} className="text-green-400" />
            </div>
            <div>
              <p className="text-sm text-text-stardust/60 mb-1">{card.title}</p>
              {isLoading ? (
                <div className="h-8 w-16 bg-nebula-purple-1 animate-pulse rounded" />
              ) : (
                <p className="text-3xl font-bold text-text-stardust">
                  {card.value}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="card-cosmic p-6">
        <h2 className="text-xl font-heading font-semibold text-text-stardust mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a
            href="/admin/applications"
            className="p-4 rounded-lg bg-nebula-purple-1 hover:bg-nebula-purple-2 border border-border-cosmic-blue hover:border-gold-primary/50 transition-all duration-300"
          >
            <FileText size={24} className="text-gold-primary mb-2" />
            <h3 className="font-medium text-text-stardust mb-1">
              Review Applications
            </h3>
            <p className="text-sm text-text-stardust/60">
              View and manage submissions
            </p>
          </a>

          <a
            href="/admin/settings"
            className="p-4 rounded-lg bg-nebula-purple-1 hover:bg-nebula-purple-2 border border-border-cosmic-blue hover:border-gold-primary/50 transition-all duration-300"
          >
            <Users size={24} className="text-gold-primary mb-2" />
            <h3 className="font-medium text-text-stardust mb-1">
              Portal Settings
            </h3>
            <p className="text-sm text-text-stardust/60">
              Toggle application portals
            </p>
          </a>

          <a
            href="/admin/committees"
            className="p-4 rounded-lg bg-nebula-purple-1 hover:bg-nebula-purple-2 border border-border-cosmic-blue hover:border-gold-primary/50 transition-all duration-300"
          >
            <Layers size={24} className="text-gold-primary mb-2" />
            <h3 className="font-medium text-text-stardust mb-1">
              Manage Committees
            </h3>
            <p className="text-sm text-text-stardust/60">
              Edit committee details
            </p>
          </a>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card-cosmic p-6">
        <h2 className="text-xl font-heading font-semibold text-text-stardust mb-4">
          System Status
        </h2>
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-nebula-purple-1">
            <CheckCircle size={20} className="text-green-400" />
            <div className="flex-1">
              <p className="text-sm font-medium text-text-stardust">
                Database Connected
              </p>
              <p className="text-xs text-text-stardust/60">
                Supabase operational
              </p>
            </div>
            <span className="text-xs text-green-400">Active</span>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-lg bg-nebula-purple-1">
            <CheckCircle size={20} className="text-green-400" />
            <div className="flex-1">
              <p className="text-sm font-medium text-text-stardust">
                Authentication Service
              </p>
              <p className="text-xs text-text-stardust/60">
                Logged in as {role?.replace("_", " ")}
              </p>
            </div>
            <span className="text-xs text-green-400">Active</span>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-lg bg-nebula-purple-1">
            <AlertCircle size={20} className="text-yellow-400" />
            <div className="flex-1">
              <p className="text-sm font-medium text-text-stardust">
                Storage Service
              </p>
              <p className="text-xs text-text-stardust/60">
                Ensure storage buckets are created
              </p>
            </div>
            <span className="text-xs text-yellow-400">Check</span>
          </div>
        </div>
      </div>
    </div>
  );
}