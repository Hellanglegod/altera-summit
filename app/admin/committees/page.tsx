"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAdminAuth } from "@/components/admin/AuthProvider";
import { Committee, CommitteeCategory, CommitteeStatus } from "@/types";
import {
  Landmark,
  Plus,
  Search,
  Edit2,
  Trash2,
  ExternalLink,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  Loader2,
  X,
  FileText,
  Table,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const CATEGORIES: CommitteeCategory[] = [
  "Flagship",
  "Crisis",
  "Conventional",
  "Regional",
];

const STATUS_CONFIG: Record<
  CommitteeStatus,
  { label: string; bg: string; text: string; border: string }
> = {
  active: {
    label: "Open / Active",
    bg: "bg-green-500/10",
    text: "text-green-400",
    border: "border-green-500/30",
  },
  allocation_full: {
    label: "Allocation Full",
    bg: "bg-red-500/10",
    text: "text-red-400",
    border: "border-red-500/30",
  },
  waitlist_only: {
    label: "Waitlist Only",
    bg: "bg-yellow-500/10",
    text: "text-yellow-400",
    border: "border-yellow-500/30",
  },
};

const emptyCommitteeForm: Omit<Committee, "id" | "created_at" | "updated_at"> = {
  name: "",
  abbreviation: "",
  agenda: "",
  category: "Flagship",
  status: "active",
  is_active: true,
  display_order: 1,
  chair_name: "",
  chair_photo_url: "",
  cochair_name: "",
  cochair_photo_url: "",
  emblem_url: "",
  study_guide_url: "",
  matrix_url: "",
};

export default function AdminCommitteesPage() {
  const { role } = useAdminAuth();
  const [committees, setCommittees] = useState<Committee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [editingCommittee, setEditingCommittee] = useState<
    (Omit<Committee, "id" | "created_at" | "updated_at"> & { id?: string }) | null
  >(null);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const canEdit =
    role === "super_admin" || role === "committee_director";

  useEffect(() => {
    fetchCommittees();
  }, []);

  async function fetchCommittees() {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("committees")
        .select("*")
        .order("display_order", { ascending: true });

      if (error) throw error;
      setCommittees(data || []);
    } catch (error) {
      console.error("Error fetching committees:", error);
      setStatusMessage({
        type: "error",
        text: "Failed to load committees from database.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleToggleActive(committee: Committee) {
    if (!canEdit) return;
    try {
      const updatedStatus = !committee.is_active;
      const { error } = await supabase
        .from("committees")
        .update({
          is_active: updatedStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", committee.id);

      if (error) throw error;

      setCommittees((prev) =>
        prev.map((c) =>
          c.id === committee.id ? { ...c, is_active: updatedStatus } : c
        )
      );

      setStatusMessage({
        type: "success",
        text: `${committee.abbreviation} is now ${
          updatedStatus ? "visible on public site" : "hidden"
        }`,
      });
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (error) {
      console.error("Error toggling active status:", error);
      setStatusMessage({
        type: "error",
        text: "Failed to update visibility.",
      });
    }
  }

  async function handleStatusChange(
    committeeId: string,
    newStatus: CommitteeStatus
  ) {
    if (!canEdit) return;
    try {
      const { error } = await supabase
        .from("committees")
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", committeeId);

      if (error) throw error;

      setCommittees((prev) =>
        prev.map((c) =>
          c.id === committeeId ? { ...c, status: newStatus } : c
        )
      );

      setStatusMessage({
        type: "success",
        text: "Committee allocation status updated.",
      });
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (error) {
      console.error("Error updating status:", error);
      setStatusMessage({
        type: "error",
        text: "Failed to update committee status.",
      });
    }
  }

  async function handleSaveCommittee(e: React.FormEvent) {
    e.preventDefault();
    if (!editingCommittee || !canEdit) return;

    setIsSaving(true);
    try {
      if (editingCommittee.id) {
        // Update existing
        const { error } = await supabase
          .from("committees")
          .update({
            name: editingCommittee.name,
            abbreviation: editingCommittee.abbreviation,
            agenda: editingCommittee.agenda,
            category: editingCommittee.category,
            status: editingCommittee.status,
            is_active: editingCommittee.is_active,
            display_order: Number(editingCommittee.display_order) || 1,
            chair_name: editingCommittee.chair_name || null,
            chair_photo_url: editingCommittee.chair_photo_url || null,
            cochair_name: editingCommittee.cochair_name || null,
            cochair_photo_url: editingCommittee.cochair_photo_url || null,
            emblem_url: editingCommittee.emblem_url || null,
            study_guide_url: editingCommittee.study_guide_url || null,
            matrix_url: editingCommittee.matrix_url || null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingCommittee.id);

        if (error) throw error;
        setStatusMessage({
          type: "success",
          text: `Committee ${editingCommittee.abbreviation} updated successfully.`,
        });
      } else {
        // Insert new
        const { error } = await supabase.from("committees").insert({
          name: editingCommittee.name,
          abbreviation: editingCommittee.abbreviation,
          agenda: editingCommittee.agenda,
          category: editingCommittee.category,
          status: editingCommittee.status,
          is_active: editingCommittee.is_active,
          display_order: Number(editingCommittee.display_order) || 1,
          chair_name: editingCommittee.chair_name || null,
          chair_photo_url: editingCommittee.chair_photo_url || null,
          cochair_name: editingCommittee.cochair_name || null,
          cochair_photo_url: editingCommittee.cochair_photo_url || null,
          emblem_url: editingCommittee.emblem_url || null,
          study_guide_url: editingCommittee.study_guide_url || null,
          matrix_url: editingCommittee.matrix_url || null,
        });

        if (error) throw error;
        setStatusMessage({
          type: "success",
          text: `New committee ${editingCommittee.abbreviation} added.`,
        });
      }

      setEditingCommittee(null);
      fetchCommittees();
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (error) {
      console.error("Error saving committee:", error);
      setStatusMessage({
        type: "error",
        text: "Failed to save committee. Check all required fields.",
      });
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(committee: Committee) {
    if (!canEdit) return;
    if (
      !confirm(
        `Are you sure you want to delete ${committee.abbreviation} - ${committee.name}?`
      )
    ) {
      return;
    }

    try {
      const { error } = await supabase
        .from("committees")
        .delete()
        .eq("id", committee.id);

      if (error) throw error;

      setCommittees((prev) => prev.filter((c) => c.id !== committee.id));
      setStatusMessage({
        type: "success",
        text: `Deleted ${committee.abbreviation}`,
      });
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (error) {
      console.error("Error deleting committee:", error);
      setStatusMessage({
        type: "error",
        text: "Failed to delete committee.",
      });
    }
  }

  const filteredCommittees = committees.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.abbreviation.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.agenda.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === "all" || c.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-gold-primary mb-2">
            Committees CMS
          </h1>
          <p className="text-text-stardust/60">
            Configure council agendas, chair assignments, study guides, and
            country matrices.
          </p>
        </div>

        {canEdit && (
          <button
            onClick={() =>
              setEditingCommittee({
                ...emptyCommitteeForm,
                display_order: committees.length + 1,
              })
            }
            className="btn-primary flex items-center gap-2 text-sm py-2.5 px-4"
          >
            <Plus size={18} />
            Add Committee
          </button>
        )}
      </div>

      {/* Status Message */}
      {statusMessage && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-lg flex items-center gap-3 ${
            statusMessage.type === "success"
              ? "bg-green-500/10 border border-green-500/30 text-green-300"
              : "bg-red-500/10 border border-red-500/30 text-red-300"
          }`}
        >
          {statusMessage.type === "success" ? (
            <CheckCircle size={20} className="text-green-400" />
          ) : (
            <AlertCircle size={20} className="text-red-400" />
          )}
          <p className="text-sm">{statusMessage.text}</p>
        </motion.div>
      )}

      {/* Filters Bar */}
      <div className="card-cosmic p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Category Filter */}
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          {["all", ...CATEGORIES].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
                selectedCategory === cat
                  ? "bg-gold-primary text-bg-void"
                  : "bg-nebula-purple-1 text-text-stardust/70 hover:text-text-stardust border border-border-cosmic-blue"
              }`}
            >
              {cat === "all" ? "All Categories" : cat}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-stardust/40"
          />
          <input
            type="text"
            placeholder="Search committee or agenda..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-cosmic pl-10 py-2 text-sm w-full"
          />
        </div>
      </div>

      {/* Committees Grid / Table */}
      {isLoading ? (
        <div className="card-cosmic p-16 text-center">
          <Loader2
            size={36}
            className="animate-spin text-gold-primary mx-auto mb-3"
          />
          <p className="text-text-stardust/60 text-sm">Loading committees...</p>
        </div>
      ) : filteredCommittees.length === 0 ? (
        <div className="card-cosmic p-16 text-center">
          <Landmark size={48} className="text-text-stardust/30 mx-auto mb-4" />
          <h3 className="font-heading text-lg text-text-stardust mb-1">
            No committees found
          </h3>
          <p className="text-sm text-text-stardust/60">
            {searchQuery || selectedCategory !== "all"
              ? "Try adjusting your search criteria."
              : "Click 'Add Committee' to create your first council."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCommittees.map((committee) => {
            const statusConfig = STATUS_CONFIG[committee.status];

            return (
              <div
                key={committee.id}
                className={`card-cosmic p-6 flex flex-col justify-between border transition-all ${
                  committee.is_active
                    ? "border-border-cosmic-blue"
                    : "border-border-cosmic-blue/30 opacity-60 bg-bg-void/40"
                }`}
              >
                <div>
                  {/* Top Bar: Abbreviation & Category */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-display text-lg font-bold text-gold-primary">
                      {committee.abbreviation}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-nebula-purple-1 text-text-stardust/70 border border-border-cosmic-blue">
                        {committee.category}
                      </span>
                      <span className="text-xs font-mono text-text-stardust/40">
                        #{committee.display_order}
                      </span>
                    </div>
                  </div>

                  {/* Title & Agenda */}
                  <h3 className="text-lg font-heading font-semibold text-text-stardust mb-2 line-clamp-1">
                    {committee.name}
                  </h3>
                  <p className="text-xs text-text-stardust/70 mb-4 line-clamp-3 leading-relaxed">
                    {committee.agenda}
                  </p>

                  {/* Chairs & Status */}
                  <div className="space-y-2 mb-4 pt-3 border-t border-border-cosmic-blue/50 text-xs">
                    <div className="flex items-center justify-between text-text-stardust/60">
                      <span>Chair:</span>
                      <span className="font-medium text-text-stardust">
                        {committee.chair_name || "TBA"}
                      </span>
                    </div>
                    {committee.cochair_name && (
                      <div className="flex items-center justify-between text-text-stardust/60">
                        <span>Co-Chair:</span>
                        <span className="font-medium text-text-stardust">
                          {committee.cochair_name}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Resources Links */}
                  <div className="flex items-center gap-2 mb-4">
                    {committee.study_guide_url ? (
                      <a
                        href={committee.study_guide_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-gold-primary/80 hover:text-gold-primary bg-gold-primary/10 px-2.5 py-1 rounded-md"
                      >
                        <FileText size={12} />
                        Study Guide
                      </a>
                    ) : (
                      <span className="text-xs text-text-stardust/30 bg-nebula-purple-1 px-2.5 py-1 rounded-md">
                        No Guide
                      </span>
                    )}

                    {committee.matrix_url ? (
                      <a
                        href={committee.matrix_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 bg-blue-500/10 px-2.5 py-1 rounded-md"
                      >
                        <Table size={12} />
                        Matrix
                      </a>
                    ) : (
                      <span className="text-xs text-text-stardust/30 bg-nebula-purple-1 px-2.5 py-1 rounded-md">
                        No Matrix
                      </span>
                    )}
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="pt-4 border-t border-border-cosmic-blue/50 flex items-center justify-between gap-2">
                  {/* Status Dropdown */}
                  {canEdit ? (
                    <select
                      value={committee.status}
                      onChange={(e) =>
                        handleStatusChange(
                          committee.id,
                          e.target.value as CommitteeStatus
                        )
                      }
                      className={`text-xs font-medium px-2.5 py-1 rounded-full border cursor-pointer focus:outline-none ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}
                    >
                      <option
                        value="active"
                        className="bg-bg-void text-text-stardust"
                      >
                        Active
                      </option>
                      <option
                        value="allocation_full"
                        className="bg-bg-void text-text-stardust"
                      >
                        Full
                      </option>
                      <option
                        value="waitlist_only"
                        className="bg-bg-void text-text-stardust"
                      >
                        Waitlist
                      </option>
                    </select>
                  ) : (
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full border ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}
                    >
                      {statusConfig.label}
                    </span>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    {canEdit && (
                      <>
                        <button
                          onClick={() => handleToggleActive(committee)}
                          className="p-1.5 hover:bg-nebula-purple-1 rounded-lg text-text-stardust/60 hover:text-text-stardust transition-colors"
                          title={
                            committee.is_active
                              ? "Hide on public site"
                              : "Show on public site"
                          }
                        >
                          {committee.is_active ? (
                            <Eye size={16} className="text-green-400" />
                          ) : (
                            <EyeOff size={16} className="text-red-400" />
                          )}
                        </button>
                        <button
                          onClick={() => setEditingCommittee(committee)}
                          className="p-1.5 hover:bg-gold-primary/10 hover:text-gold-primary rounded-lg text-text-stardust/60 transition-colors"
                          title="Edit Committee"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(committee)}
                          className="p-1.5 hover:bg-red-500/10 hover:text-red-400 rounded-lg text-text-stardust/40 transition-colors"
                          title="Delete Committee"
                        >
                          <Trash2 size={16} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit / Add Modal */}
      <AnimatePresence>
        {editingCommittee && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-dark border border-gold-primary/30 rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-border-cosmic-blue flex items-center justify-between">
                <h2 className="text-xl font-heading font-bold text-text-stardust">
                  {editingCommittee.id
                    ? `Edit Committee: ${editingCommittee.abbreviation}`
                    : "Add New Committee"}
                </h2>
                <button
                  onClick={() => setEditingCommittee(null)}
                  className="p-2 hover:bg-nebula-purple-1 rounded-lg text-text-stardust/60 hover:text-text-stardust"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Form Body */}
              <form
                onSubmit={handleSaveCommittee}
                className="p-6 overflow-y-auto space-y-4 flex-1"
              >
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-text-stardust/80 mb-1">
                      Full Committee Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={editingCommittee.name}
                      onChange={(e) =>
                        setEditingCommittee({
                          ...editingCommittee,
                          name: e.target.value,
                        })
                      }
                      placeholder="e.g. United Nations Security Council"
                      className="input-cosmic w-full text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-text-stardust/80 mb-1">
                      Abbreviation *
                    </label>
                    <input
                      type="text"
                      required
                      value={editingCommittee.abbreviation}
                      onChange={(e) =>
                        setEditingCommittee({
                          ...editingCommittee,
                          abbreviation: e.target.value.toUpperCase(),
                        })
                      }
                      placeholder="e.g. UNSC"
                      className="input-cosmic w-full text-sm font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-text-stardust/80 mb-1">
                      Category
                    </label>
                    <select
                      value={editingCommittee.category}
                      onChange={(e) =>
                        setEditingCommittee({
                          ...editingCommittee,
                          category: e.target.value as CommitteeCategory,
                        })
                      }
                      className="input-cosmic w-full text-sm bg-nebula-purple-2"
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-text-stardust/80 mb-1">
                      Status
                    </label>
                    <select
                      value={editingCommittee.status}
                      onChange={(e) =>
                        setEditingCommittee({
                          ...editingCommittee,
                          status: e.target.value as CommitteeStatus,
                        })
                      }
                      className="input-cosmic w-full text-sm bg-nebula-purple-2"
                    >
                      <option value="active">Active / Open</option>
                      <option value="allocation_full">Allocation Full</option>
                      <option value="waitlist_only">Waitlist Only</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-text-stardust/80 mb-1">
                      Display Order
                    </label>
                    <input
                      type="number"
                      value={editingCommittee.display_order}
                      onChange={(e) =>
                        setEditingCommittee({
                          ...editingCommittee,
                          display_order: parseInt(e.target.value) || 1,
                        })
                      }
                      className="input-cosmic w-full text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-text-stardust/80 mb-1">
                    Agenda / Topic Description *
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={editingCommittee.agenda}
                    onChange={(e) =>
                      setEditingCommittee({
                        ...editingCommittee,
                        agenda: e.target.value,
                      })
                    }
                    placeholder="Describe the committee's central agenda..."
                    className="input-cosmic w-full text-sm resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-text-stardust/80 mb-1">
                      Chair Name
                    </label>
                    <input
                      type="text"
                      value={editingCommittee.chair_name || ""}
                      onChange={(e) =>
                        setEditingCommittee({
                          ...editingCommittee,
                          chair_name: e.target.value,
                        })
                      }
                      placeholder="e.g. Eleanor Vance"
                      className="input-cosmic w-full text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-text-stardust/80 mb-1">
                      Co-Chair Name
                    </label>
                    <input
                      type="text"
                      value={editingCommittee.cochair_name || ""}
                      onChange={(e) =>
                        setEditingCommittee({
                          ...editingCommittee,
                          cochair_name: e.target.value,
                        })
                      }
                      placeholder="e.g. Liam Chen"
                      className="input-cosmic w-full text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-text-stardust/80 mb-1">
                      Study Guide URL
                    </label>
                    <input
                      type="url"
                      value={editingCommittee.study_guide_url || ""}
                      onChange={(e) =>
                        setEditingCommittee({
                          ...editingCommittee,
                          study_guide_url: e.target.value,
                        })
                      }
                      placeholder="https://drive.google.com/..."
                      className="input-cosmic w-full text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-text-stardust/80 mb-1">
                      Country Matrix URL
                    </label>
                    <input
                      type="url"
                      value={editingCommittee.matrix_url || ""}
                      onChange={(e) =>
                        setEditingCommittee({
                          ...editingCommittee,
                          matrix_url: e.target.value,
                        })
                      }
                      placeholder="https://docs.google.com/spreadsheets/..."
                      className="input-cosmic w-full text-sm"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <input
                    type="checkbox"
                    id="is_active_checkbox"
                    checked={editingCommittee.is_active}
                    onChange={(e) =>
                      setEditingCommittee({
                        ...editingCommittee,
                        is_active: e.target.checked,
                      })
                    }
                    className="w-4 h-4 rounded text-gold-primary bg-nebula-purple-1 border-border-cosmic-blue focus:ring-gold-primary"
                  />
                  <label
                    htmlFor="is_active_checkbox"
                    className="text-sm text-text-stardust cursor-pointer select-none"
                  >
                    Visible on Public Website
                  </label>
                </div>

                {/* Modal Footer */}
                <div className="pt-4 border-t border-border-cosmic-blue flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setEditingCommittee(null)}
                    className="btn-secondary text-sm py-2 px-4"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="btn-primary text-sm py-2 px-6 flex items-center gap-2"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save Committee"
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
