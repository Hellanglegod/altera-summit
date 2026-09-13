"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAdminAuth } from "@/components/admin/AuthProvider";
import { ScheduleItem } from "@/types";
import {
  Calendar,
  Plus,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  Loader2,
  X,
  Clock,
  MapPin,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const DAYS = [1, 2, 3];
const DAY_LABELS: Record<number, string> = {
  1: "Day 1 — Opening Ceremony",
  2: "Day 2 — Committee Sessions",
  3: "Day 3 — Closing & Awards",
};

const emptyItemForm: Omit<ScheduleItem, "id"> = {
  day: 1,
  time: "09:00",
  title: "",
  description: "",
  location: "",
  display_order: 1,
  is_active: true,
};

export default function AdminSchedulePage() {
  const { hasPermission } = useAdminAuth();
  const [items, setItems] = useState<ScheduleItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeDay, setActiveDay] = useState<number>(1);
  const [editingItem, setEditingItem] = useState<
    (Omit<ScheduleItem, "id"> & { id?: string }) | null
  >(null);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const canEdit = hasPermission("schedule.manage");

  useEffect(() => {
    fetchItems();
  }, []);

  async function fetchItems() {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("schedule_items")
        .select("*")
        .order("day", { ascending: true })
        .order("display_order", { ascending: true });

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error("Error fetching schedule:", error);
      setStatusMessage({
        type: "error",
        text: "Failed to load schedule items.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleToggleActive(item: ScheduleItem) {
    if (!canEdit) return;
    try {
      const { error } = await supabase
        .from("schedule_items")
        .update({ is_active: !item.is_active })
        .eq("id", item.id);

      if (error) throw error;

      setItems((prev) =>
        prev.map((i) =>
          i.id === item.id ? { ...i, is_active: !item.is_active } : i,
        ),
      );
    } catch (error) {
      console.error("Error toggling item:", error);
      setStatusMessage({ type: "error", text: "Failed to update visibility." });
    }
  }

  async function handleSaveItem(e: React.FormEvent) {
    e.preventDefault();
    if (!editingItem || !canEdit) return;

    setIsSaving(true);
    try {
      const payload = {
        day: Number(editingItem.day),
        time: editingItem.time,
        title: editingItem.title,
        description: editingItem.description || null,
        location: editingItem.location || null,
        display_order: Number(editingItem.display_order) || 1,
        is_active: editingItem.is_active,
      };

      if (editingItem.id) {
        const { error } = await supabase
          .from("schedule_items")
          .update(payload)
          .eq("id", editingItem.id);
        if (error) throw error;
        setStatusMessage({ type: "success", text: "Schedule item updated." });
      } else {
        const { error } = await supabase.from("schedule_items").insert(payload);
        if (error) throw error;
        setStatusMessage({ type: "success", text: "Schedule item added." });
      }

      setEditingItem(null);
      fetchItems();
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (error) {
      console.error("Error saving item:", error);
      setStatusMessage({
        type: "error",
        text: "Failed to save schedule item.",
      });
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(item: ScheduleItem) {
    if (!canEdit) return;
    if (!confirm(`Delete "${item.title}" from Day ${item.day}?`)) return;

    try {
      const { error: deleteError } = await supabase
        .from("schedule_items")
        .delete()
        .eq("id", item.id);
      if (deleteError) throw deleteError;

      // Get remaining items of the same day and reorder them
      const remainingOfDay = items
        .filter((i) => i.id !== item.id && i.day === item.day)
        .sort((a, b) => a.display_order - b.display_order);

      // Update display_order for remaining items of the same day
      for (let i = 0; i < remainingOfDay.length; i++) {
        const { error: updateError } = await supabase
          .from("schedule_items")
          .update({ display_order: i + 1 })
          .eq("id", remainingOfDay[i].id);
        if (updateError) throw updateError;
      }

      // Update local state - keep other day's items, update reordered day items
      setItems((prev) => {
        const withoutDeleted = prev.filter((i) => i.id !== item.id);
        const otherDays = withoutDeleted.filter((i) => i.day !== item.day);
        const sameDayReordered = remainingOfDay.map((i, idx) => ({
          ...i,
          display_order: idx + 1,
        }));
        return [...otherDays, ...sameDayReordered];
      });

      setStatusMessage({ type: "success", text: "Item deleted." });
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (error) {
      console.error("Error deleting item:", error);
      setStatusMessage({ type: "error", text: "Failed to delete item." });
    }
  }

  const dayItems = items
    .filter((i) => i.day === activeDay)
    .sort((a, b) => a.display_order - b.display_order);

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-gold-primary mb-2">
            Schedule CMS
          </h1>
          <p className="text-text-stardust/60">
            Build the 3-day summit agenda shown on the public timeline.
          </p>
        </div>

        {canEdit && (
          <button
            onClick={() =>
              setEditingItem({
                ...emptyItemForm,
                day: activeDay,
                display_order: dayItems.length + 1,
              })
            }
            className="btn-primary flex items-center gap-2 text-sm py-2.5 px-4"
          >
            <Plus size={18} />
            Add Event
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

      {/* Day Tabs */}
      <div className="flex flex-wrap gap-2">
        {DAYS.map((day) => {
          const count = items.filter((i) => i.day === day).length;
          return (
            <button
              key={day}
              onClick={() => setActiveDay(day)}
              className={`px-5 py-3 rounded-lg text-sm font-medium transition-colors text-left ${
                activeDay === day
                  ? "bg-gold-primary text-bg-void"
                  : "bg-nebula-purple-1 text-text-stardust/70 hover:text-text-stardust border border-border-cosmic-blue"
              }`}
            >
              <span className="block font-display font-bold">Day {day}</span>
              <span className="text-xs opacity-70">{count} events</span>
            </button>
          );
        })}
      </div>

      {/* Timeline */}
      {isLoading ? (
        <div className="card-cosmic p-16 text-center">
          <Loader2
            size={36}
            className="animate-spin text-gold-primary mx-auto mb-3"
          />
          <p className="text-text-stardust/60 text-sm">Loading schedule...</p>
        </div>
      ) : (
        <div className="card-cosmic p-6">
          <div className="mb-6">
            <h2 className="font-heading text-lg text-text-stardust">
              {DAY_LABELS[activeDay]}
            </h2>
          </div>

          {dayItems.length === 0 ? (
            <div className="py-12 text-center">
              <Calendar
                size={40}
                className="text-text-stardust/30 mx-auto mb-3"
              />
              <p className="text-sm text-text-stardust/60">
                No events scheduled for Day {activeDay} yet.
              </p>
            </div>
          ) : (
            <div className="relative space-y-4 before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-0.5 before:bg-border-cosmic-blue">
              {dayItems.map((item) => (
                <div
                  key={item.id}
                  className={`relative pl-8 ${
                    item.is_active ? "" : "opacity-50"
                  }`}
                >
                  {/* Timeline Dot */}
                  <span className="absolute left-0 top-1.5 w-4 h-4 rounded-full bg-gold-primary border-2 border-bg-void z-10" />

                  <div className="card-cosmic p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-nebula-purple-1/40">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="inline-flex items-center gap-1 text-sm font-mono font-semibold text-gold-primary">
                          <Clock size={14} />
                          {item.time}
                        </span>
                        <span className="text-xs font-mono text-text-stardust/40">
                          #{item.display_order}
                        </span>
                      </div>
                      <h3 className="font-heading font-medium text-text-stardust">
                        {item.title}
                      </h3>
                      {item.description && (
                        <p className="text-xs text-text-stardust/60 mt-1">
                          {item.description}
                        </p>
                      )}
                      {item.location && (
                        <p className="inline-flex items-center gap-1 text-xs text-text-stardust/50 mt-1">
                          <MapPin size={12} />
                          {item.location}
                        </p>
                      )}
                    </div>

                    {canEdit && (
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => handleToggleActive(item)}
                          className="p-1.5 hover:bg-nebula-purple-1 rounded-lg text-text-stardust/50 transition-colors"
                          title={item.is_active ? "Hide" : "Show"}
                        >
                          {item.is_active ? (
                            <Eye size={16} className="text-green-400" />
                          ) : (
                            <EyeOff size={16} className="text-red-400" />
                          )}
                        </button>
                        <button
                          onClick={() => setEditingItem(item)}
                          className="p-1.5 hover:bg-gold-primary/10 hover:text-gold-primary rounded-lg text-text-stardust/50 transition-colors"
                          title="Edit"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(item)}
                          className="p-1.5 hover:bg-red-500/10 hover:text-red-400 rounded-lg text-text-stardust/40 transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Edit / Add Modal */}
      <AnimatePresence>
        {editingItem && (
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
                  {editingItem.id ? "Edit Event" : "Add Schedule Event"}
                </h2>
                <button
                  onClick={() => setEditingItem(null)}
                  className="p-2 hover:bg-nebula-purple-1 rounded-lg text-text-stardust/60 hover:text-text-stardust"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Form */}
              <form
                onSubmit={handleSaveItem}
                className="p-6 overflow-y-auto space-y-4 flex-1"
              >
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-text-stardust/80 mb-1">
                      Day *
                    </label>
                    <select
                      value={editingItem.day}
                      onChange={(e) =>
                        setEditingItem({
                          ...editingItem,
                          day: parseInt(e.target.value),
                        })
                      }
                      className="input-cosmic w-full text-sm bg-nebula-purple-2"
                    >
                      {DAYS.map((d) => (
                        <option key={d} value={d}>
                          Day {d}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-text-stardust/80 mb-1">
                      Time *
                    </label>
                    <input
                      type="time"
                      required
                      value={editingItem.time}
                      onChange={(e) =>
                        setEditingItem({
                          ...editingItem,
                          time: e.target.value,
                        })
                      }
                      className="input-cosmic w-full text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-text-stardust/80 mb-1">
                      Order
                    </label>
                    <input
                      type="number"
                      value={editingItem.display_order}
                      onChange={(e) =>
                        setEditingItem({
                          ...editingItem,
                          display_order: parseInt(e.target.value) || 1,
                        })
                      }
                      className="input-cosmic w-full text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-text-stardust/80 mb-1">
                    Event Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingItem.title}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        title: e.target.value,
                      })
                    }
                    placeholder="e.g. Opening Ceremony & Keynote"
                    className="input-cosmic w-full text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-text-stardust/80 mb-1">
                    Description
                  </label>
                  <textarea
                    rows={2}
                    value={editingItem.description || ""}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        description: e.target.value,
                      })
                    }
                    placeholder="Optional details..."
                    className="input-cosmic w-full text-sm resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-text-stardust/80 mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    value={editingItem.location || ""}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        location: e.target.value,
                      })
                    }
                    placeholder="e.g. Grand Ballroom, Level 2"
                    className="input-cosmic w-full text-sm"
                  />
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <input
                    type="checkbox"
                    id="item_active"
                    checked={editingItem.is_active}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        is_active: e.target.checked,
                      })
                    }
                    className="w-4 h-4 rounded text-gold-primary bg-nebula-purple-1 border-border-cosmic-blue focus:ring-gold-primary"
                  />
                  <label
                    htmlFor="item_active"
                    className="text-sm text-text-stardust cursor-pointer select-none"
                  >
                    Visible on Public Timeline
                  </label>
                </div>

                {/* Modal Footer */}
                <div className="pt-4 border-t border-border-cosmic-blue flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setEditingItem(null)}
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
                      "Save Event"
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
