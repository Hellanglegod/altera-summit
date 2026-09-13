"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAdminAuth } from "@/components/admin/AuthProvider";
import { SecretariatMember } from "@/types";
import {
  UserCheck,
  Plus,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  Loader2,
  X,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const emptyMemberForm: Omit<
  SecretariatMember,
  "id" | "created_at" | "updated_at"
> = {
  name: "",
  designation: "",
  bio: "",
  photo_url: "",
  linkedin_url: "",
  email: "",
  display_order: 1,
  is_active: true,
};

export default function AdminSecretariatPage() {
  const { hasPermission } = useAdminAuth();
  const [members, setMembers] = useState<SecretariatMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingMember, setEditingMember] = useState<
    | (Omit<SecretariatMember, "id" | "created_at" | "updated_at"> & {
        id?: string;
      })
    | null
  >(null);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const canEdit = hasPermission("secretariat.manage");

  useEffect(() => {
    fetchMembers();
  }, []);

  async function fetchMembers() {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("secretariat_members")
        .select("*")
        .order("display_order", { ascending: true });

      if (error) throw error;
      setMembers(data || []);
    } catch (error) {
      console.error("Error fetching secretariat members:", error);
      setStatusMessage({
        type: "error",
        text: "Failed to load secretariat members.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleToggleActive(member: SecretariatMember) {
    if (!canEdit) return;
    try {
      const { error } = await supabase
        .from("secretariat_members")
        .update({
          is_active: !member.is_active,
          updated_at: new Date().toISOString(),
        })
        .eq("id", member.id);

      if (error) throw error;

      setMembers((prev) =>
        prev.map((m) =>
          m.id === member.id ? { ...m, is_active: !member.is_active } : m,
        ),
      );

      setStatusMessage({
        type: "success",
        text: `${member.name} is now ${!member.is_active ? "visible" : "hidden"}`,
      });
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (error) {
      console.error("Error toggling visibility:", error);
      setStatusMessage({
        type: "error",
        text: "Failed to update visibility.",
      });
    }
  }

  async function handleReorder(
    member: SecretariatMember,
    direction: "up" | "down",
  ) {
    if (!canEdit) return;

    const index = members.findIndex((m) => m.id === member.id);
    const swapIndex = direction === "up" ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= members.length) return;

    const swapTarget = members[swapIndex];

    try {
      const batch = [
        supabase
          .from("secretariat_members")
          .update({
            display_order: swapTarget.display_order,
            updated_at: new Date().toISOString(),
          })
          .eq("id", member.id),
        supabase
          .from("secretariat_members")
          .update({
            display_order: member.display_order,
            updated_at: new Date().toISOString(),
          })
          .eq("id", swapTarget.id),
      ];

      const results = await Promise.all(batch);
      const failedUpdate = results.find((result) => result.error);
      if (failedUpdate?.error) throw failedUpdate.error;

      setMembers((prev) => {
        const newList = [...prev];
        const tempOrder = newList[index].display_order;
        newList[index] = {
          ...newList[index],
          display_order: newList[swapIndex].display_order,
        };
        newList[swapIndex] = {
          ...newList[swapIndex],
          display_order: tempOrder,
        };
        return newList.sort((a, b) => a.display_order - b.display_order);
      });
    } catch (error) {
      console.error("Error reordering:", error);
      setStatusMessage({
        type: "error",
        text: "Failed to reorder members.",
      });
    }
  }

  async function handleSaveMember(e: React.FormEvent) {
    e.preventDefault();
    if (!editingMember || !canEdit) return;

    setIsSaving(true);
    try {
      const payload = {
        name: editingMember.name,
        designation: editingMember.designation,
        bio: editingMember.bio || null,
        photo_url: editingMember.photo_url || null,
        linkedin_url: editingMember.linkedin_url || null,
        email: editingMember.email || null,
        display_order: Number(editingMember.display_order) || 1,
        is_active: editingMember.is_active,
      };

      if (editingMember.id) {
        const { error } = await supabase
          .from("secretariat_members")
          .update({ ...payload, updated_at: new Date().toISOString() })
          .eq("id", editingMember.id);
        if (error) throw error;
        setStatusMessage({
          type: "success",
          text: `${editingMember.name} updated.`,
        });
      } else {
        const { error } = await supabase
          .from("secretariat_members")
          .insert(payload);
        if (error) throw error;
        setStatusMessage({
          type: "success",
          text: `${editingMember.name} added to the secretariat.`,
        });
      }

      setEditingMember(null);
      fetchMembers();
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (error) {
      console.error("Error saving member:", error);
      setStatusMessage({
        type: "error",
        text: "Failed to save member details.",
      });
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(member: SecretariatMember) {
    if (!canEdit) return;
    if (
      !confirm(
        `Delete ${member.name} (${member.designation}) from the secretariat?`,
      )
    ) {
      return;
    }

    try {
      const { error: deleteError } = await supabase
        .from("secretariat_members")
        .delete()
        .eq("id", member.id);

      if (deleteError) throw deleteError;

      // Get remaining members and reorder them
      const remaining = members
        .filter((m) => m.id !== member.id)
        .sort((a, b) => a.display_order - b.display_order);

      // Update display_order for all remaining items
      for (let i = 0; i < remaining.length; i++) {
        const { error: updateError } = await supabase
          .from("secretariat_members")
          .update({
            display_order: i + 1,
            updated_at: new Date().toISOString(),
          })
          .eq("id", remaining[i].id);
        if (updateError) throw updateError;
      }

      // Update local state
      setMembers(remaining.map((m, i) => ({ ...m, display_order: i + 1 })));

      setStatusMessage({
        type: "success",
        text: `${member.name} removed.`,
      });
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (error) {
      console.error("Error deleting member:", error);
      setStatusMessage({
        type: "error",
        text: "Failed to delete member.",
      });
    }
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-gold-primary mb-2">
            Secretariat Team CMS
          </h1>
          <p className="text-text-stardust/60">
            Manage team member profiles displayed on the public website.
          </p>
        </div>

        {canEdit && (
          <button
            onClick={() =>
              setEditingMember({
                ...emptyMemberForm,
                display_order: members.length + 1,
              })
            }
            className="btn-primary flex items-center gap-2 text-sm py-2.5 px-4"
          >
            <Plus size={18} />
            Add Member
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

      {/* Members List */}
      {isLoading ? (
        <div className="card-cosmic p-16 text-center">
          <Loader2
            size={36}
            className="animate-spin text-gold-primary mx-auto mb-3"
          />
          <p className="text-text-stardust/60 text-sm">Loading team...</p>
        </div>
      ) : members.length === 0 ? (
        <div className="card-cosmic p-16 text-center">
          <UserCheck size={48} className="text-text-stardust/30 mx-auto mb-4" />
          <h3 className="font-heading text-lg text-text-stardust mb-1">
            No secretariat members yet
          </h3>
          <p className="text-sm text-text-stardust/60">
            Add your first team member with the button above.
          </p>
        </div>
      ) : (
        <div className="card-cosmic overflow-hidden divide-y divide-border-cosmic-blue">
          {members.map((member, index) => (
            <div
              key={member.id}
              className={`p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4 transition-all ${
                member.is_active ? "" : "opacity-50 bg-bg-void/30"
              }`}
            >
              {/* Photo */}
              <div className="w-14 h-14 rounded-full bg-nebula-purple-1 border border-border-cosmic-blue flex items-center justify-center text-gold-primary font-display text-xl shrink-0 overflow-hidden">
                {member.photo_url ? (
                  <img
                    src={member.photo_url}
                    alt={member.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  member.name.charAt(0).toUpperCase()
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-heading font-medium text-text-stardust">
                    {member.name}
                  </h3>
                  <span className="text-xs font-mono text-text-stardust/40">
                    #{member.display_order}
                  </span>
                </div>
                <p className="text-sm text-gold-primary/80">
                  {member.designation}
                </p>
                {member.bio && (
                  <p className="text-xs text-text-stardust/60 mt-1 line-clamp-1">
                    {member.bio}
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              {canEdit && (
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => handleReorder(member, "up")}
                    disabled={index === 0}
                    className="p-1.5 hover:bg-nebula-purple-1 rounded-lg text-text-stardust/50 hover:text-text-stardust disabled:opacity-30 disabled:pointer-events-none transition-colors"
                    title="Move up"
                  >
                    <ArrowUp size={16} />
                  </button>
                  <button
                    onClick={() => handleReorder(member, "down")}
                    disabled={index === members.length - 1}
                    className="p-1.5 hover:bg-nebula-purple-1 rounded-lg text-text-stardust/50 hover:text-text-stardust disabled:opacity-30 disabled:pointer-events-none transition-colors"
                    title="Move down"
                  >
                    <ArrowDown size={16} />
                  </button>
                  <button
                    onClick={() => handleToggleActive(member)}
                    className="p-1.5 hover:bg-nebula-purple-1 rounded-lg text-text-stardust/50 transition-colors"
                    title={member.is_active ? "Hide" : "Show"}
                  >
                    {member.is_active ? (
                      <Eye size={16} className="text-green-400" />
                    ) : (
                      <EyeOff size={16} className="text-red-400" />
                    )}
                  </button>
                  <button
                    onClick={() => setEditingMember(member)}
                    className="p-1.5 hover:bg-gold-primary/10 hover:text-gold-primary rounded-lg text-text-stardust/50 transition-colors"
                    title="Edit"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(member)}
                    className="p-1.5 hover:bg-red-500/10 hover:text-red-400 rounded-lg text-text-stardust/40 transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Edit / Add Modal */}
      <AnimatePresence>
        {editingMember && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-dark border border-gold-primary/30 rounded-2xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-border-cosmic-blue flex items-center justify-between">
                <h2 className="text-xl font-heading font-bold text-text-stardust">
                  {editingMember.id ? "Edit Member" : "Add Team Member"}
                </h2>
                <button
                  onClick={() => setEditingMember(null)}
                  className="p-2 hover:bg-nebula-purple-1 rounded-lg text-text-stardust/60 hover:text-text-stardust"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Form */}
              <form
                onSubmit={handleSaveMember}
                className="p-6 overflow-y-auto space-y-4 flex-1"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-text-stardust/80 mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={editingMember.name}
                      onChange={(e) =>
                        setEditingMember({
                          ...editingMember,
                          name: e.target.value,
                        })
                      }
                      placeholder="e.g. Alexandra Chen"
                      className="input-cosmic w-full text-sm"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-text-stardust/80 mb-1">
                      Designation / Title *
                    </label>
                    <input
                      type="text"
                      required
                      value={editingMember.designation}
                      onChange={(e) =>
                        setEditingMember({
                          ...editingMember,
                          designation: e.target.value,
                        })
                      }
                      placeholder="e.g. Secretary-General"
                      className="input-cosmic w-full text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-text-stardust/80 mb-1">
                    Bio
                  </label>
                  <textarea
                    rows={3}
                    value={editingMember.bio || ""}
                    onChange={(e) =>
                      setEditingMember({
                        ...editingMember,
                        bio: e.target.value,
                      })
                    }
                    placeholder="Brief biography..."
                    className="input-cosmic w-full text-sm resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-text-stardust/80 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={editingMember.email || ""}
                      onChange={(e) =>
                        setEditingMember({
                          ...editingMember,
                          email: e.target.value,
                        })
                      }
                      placeholder="member@alterasummit.com"
                      className="input-cosmic w-full text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-text-stardust/80 mb-1">
                      LinkedIn URL
                    </label>
                    <input
                      type="url"
                      value={editingMember.linkedin_url || ""}
                      onChange={(e) =>
                        setEditingMember({
                          ...editingMember,
                          linkedin_url: e.target.value,
                        })
                      }
                      placeholder="https://linkedin.com/in/..."
                      className="input-cosmic w-full text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-text-stardust/80 mb-1">
                      Photo URL
                    </label>
                    <input
                      type="url"
                      value={editingMember.photo_url || ""}
                      onChange={(e) =>
                        setEditingMember({
                          ...editingMember,
                          photo_url: e.target.value,
                        })
                      }
                      placeholder="https://..."
                      className="input-cosmic w-full text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-text-stardust/80 mb-1">
                      Display Order
                    </label>
                    <input
                      type="number"
                      value={editingMember.display_order}
                      onChange={(e) =>
                        setEditingMember({
                          ...editingMember,
                          display_order: parseInt(e.target.value) || 1,
                        })
                      }
                      className="input-cosmic w-full text-sm"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <input
                    type="checkbox"
                    id="member_active"
                    checked={editingMember.is_active}
                    onChange={(e) =>
                      setEditingMember({
                        ...editingMember,
                        is_active: e.target.checked,
                      })
                    }
                    className="w-4 h-4 rounded text-gold-primary bg-nebula-purple-1 border-border-cosmic-blue focus:ring-gold-primary"
                  />
                  <label
                    htmlFor="member_active"
                    className="text-sm text-text-stardust cursor-pointer select-none"
                  >
                    Visible on Public Website
                  </label>
                </div>

                {/* Modal Footer */}
                <div className="pt-4 border-t border-border-cosmic-blue flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setEditingMember(null)}
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
                      "Save Member"
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
