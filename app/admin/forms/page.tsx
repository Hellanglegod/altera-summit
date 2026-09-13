"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAdminAuth } from "@/components/admin/AuthProvider";
import { CustomForm, FormField, FieldType } from "@/types";
import {
  FileEdit,
  Plus,
  Trash2,
  GripVertical,
  CheckCircle,
  AlertCircle,
  Loader2,
  X,
  Edit2,
  TextCursor,
  AlignLeft,
  ChevronDownCircle,
  CircleDot,
  FileUp,
  Calendar,
  CheckSquare,
  Eye,
  Save,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const FIELD_TYPES: {
  value: FieldType;
  label: string;
  icon: typeof TextCursor;
}[] = [
  { value: "text", label: "Short Text", icon: TextCursor },
  { value: "textarea", label: "Long Text", icon: AlignLeft },
  { value: "dropdown", label: "Dropdown", icon: ChevronDownCircle },
  { value: "radio", label: "Radio Choice", icon: CircleDot },
  { value: "checkbox", label: "Checkbox", icon: CheckSquare },
  { value: "date", label: "Date", icon: Calendar },
  { value: "file", label: "File Upload", icon: FileUp },
];

const TRACKS = ["delegate", "chair", "secretariat"] as const;

export default function AdminFormsPage() {
  const { hasPermission } = useAdminAuth();
  const [forms, setForms] = useState<CustomForm[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingForm, setEditingForm] = useState<CustomForm | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const canEdit = hasPermission("forms.manage");

  useEffect(() => {
    fetchForms();
  }, []);

  async function fetchForms() {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("custom_forms")
        .select("*")
        .order("portal_type", { ascending: true });

      if (error) throw error;
      setForms(data || []);
    } catch (error) {
      console.error("Error fetching forms:", error);
      setStatusMessage({
        type: "error",
        text: "Failed to load custom forms.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSaveForm() {
    if (!editingForm || !canEdit) return;

    setIsSaving(true);
    try {
      const payload = {
        portal_type: editingForm.portal_type,
        title: editingForm.title,
        description: editingForm.description,
        fields: editingForm.fields,
        is_active: editingForm.is_active,
      };

      if (editingForm.id) {
        const { error } = await supabase
          .from("custom_forms")
          .update({ ...payload, updated_at: new Date().toISOString() })
          .eq("id", editingForm.id);
        if (error) throw error;
        setStatusMessage({
          type: "success",
          text: `Form for ${editingForm.portal_type} updated.`,
        });
      } else {
        const { error } = await supabase.from("custom_forms").insert(payload);
        if (error) throw error;
        setStatusMessage({
          type: "success",
          text: `Custom form created for ${editingForm.portal_type}.`,
        });
      }

      setEditingForm(null);
      fetchForms();
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (error) {
      console.error("Error saving form:", error);
      setStatusMessage({
        type: "error",
        text: "Failed to save form.",
      });
    } finally {
      setIsSaving(false);
    }
  }

  async function handleToggleActive(form: CustomForm) {
    if (!canEdit) return;
    try {
      const { error } = await supabase
        .from("custom_forms")
        .update({
          is_active: !form.is_active,
          updated_at: new Date().toISOString(),
        })
        .eq("id", form.id);
      if (error) throw error;

      setForms((prev) =>
        prev.map((f) =>
          f.id === form.id ? { ...f, is_active: !form.is_active } : f,
        ),
      );
      setStatusMessage({
        type: "success",
        text: `Form ${form.is_active ? "disabled" : "enabled"}.`,
      });
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (error) {
      console.error("Error toggling form:", error);
    }
  }

  async function handleDelete(form: CustomForm) {
    if (!canEdit) return;
    if (!confirm(`Delete the custom form for ${form.portal_type}?`)) return;

    try {
      const { error } = await supabase
        .from("custom_forms")
        .delete()
        .eq("id", form.id);
      if (error) throw error;
      setForms((prev) => prev.filter((f) => f.id !== form.id));
      setStatusMessage({ type: "success", text: "Form deleted." });
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (error) {
      console.error("Error deleting form:", error);
    }
  }

  function startNewForm(track: (typeof TRACKS)[number]) {
    const existing = forms.find((f) => f.portal_type === track);
    if (existing) {
      setEditingForm(existing);
      return;
    }

    setEditingForm({
      id: "",
      portal_type: track,
      title: `${track.charAt(0).toUpperCase() + track.slice(1)} Application Form`,
      description: `Apply for the ${track} program at Altera Summit.`,
      fields: [
        {
          id: crypto.randomUUID(),
          label: "Full Name",
          type: "text",
          required: true,
          display_order: 1,
        },
        {
          id: crypto.randomUUID(),
          label: "Email Address",
          type: "text",
          required: true,
          display_order: 2,
        },
      ],
      is_active: true,
      created_at: "",
      updated_at: "",
    });
  }

  function addField(type: FieldType) {
    if (!editingForm) return;
    const newField: FormField = {
      id: crypto.randomUUID(),
      label: "New Field",
      type,
      required: false,
      display_order: editingForm.fields.length + 1,
      ...(type === "dropdown" || type === "radio" || type === "checkbox"
        ? { options: ["Option 1", "Option 2"] }
        : {}),
    };
    setEditingForm({
      ...editingForm,
      fields: [...editingForm.fields, newField],
    });
  }

  function updateField(fieldId: string, updates: Partial<FormField>) {
    if (!editingForm) return;
    setEditingForm({
      ...editingForm,
      fields: editingForm.fields.map((f) =>
        f.id === fieldId ? { ...f, ...updates } : f,
      ),
    });
  }

  function removeField(fieldId: string) {
    if (!editingForm) return;
    setEditingForm({
      ...editingForm,
      fields: editingForm.fields
        .filter((f) => f.id !== fieldId)
        .map((f, idx) => ({ ...f, display_order: idx + 1 })),
    });
  }

  function moveField(fieldId: string, direction: "up" | "down") {
    if (!editingForm) return;
    const idx = editingForm.fields.findIndex((f) => f.id === fieldId);
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= editingForm.fields.length) return;

    const newFields = [...editingForm.fields];
    [newFields[idx], newFields[swapIdx]] = [newFields[swapIdx], newFields[idx]];
    setEditingForm({
      ...editingForm,
      fields: newFields.map((f, i) => ({ ...f, display_order: i + 1 })),
    });
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-display font-bold text-gold-primary mb-2">
          Custom Form Builder
        </h1>
        <p className="text-text-stardust/60">
          Design custom application forms. Activate the{" "}
          <span className="text-gold-primary">Custom Builder</span> mode in
          Portal Settings to use these forms on the public site.
        </p>
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

      {/* Forms Overview Cards */}
      {isLoading ? (
        <div className="card-cosmic p-16 text-center">
          <Loader2
            size={36}
            className="animate-spin text-gold-primary mx-auto mb-3"
          />
          <p className="text-text-stardust/60 text-sm">Loading forms...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TRACKS.map((track) => {
            const form = forms.find((f) => f.portal_type === track);
            return (
              <div
                key={track}
                className="card-cosmic p-6 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-heading text-lg text-text-stardust capitalize">
                      {track}
                    </h3>
                    {form ? (
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full border ${
                          form.is_active
                            ? "bg-green-500/10 text-green-400 border-green-500/30"
                            : "bg-nebula-purple-1 text-text-stardust/50 border-border-cosmic-blue"
                        }`}
                      >
                        {form.is_active ? "Active" : "Draft"}
                      </span>
                    ) : (
                      <span className="text-xs px-2.5 py-1 rounded-full bg-nebula-purple-1 text-text-stardust/50 border border-border-cosmic-blue">
                        Not Built
                      </span>
                    )}
                  </div>

                  {form ? (
                    <>
                      <p className="text-sm text-text-stardust/70 mb-3">
                        {form.title}
                      </p>
                      <p className="text-xs text-text-stardust/50 mb-4">
                        {form.fields.length} fields configured
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-text-stardust/50 mb-4 italic">
                      No custom form built yet.
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-4 border-t border-border-cosmic-blue/50">
                  {canEdit && (
                    <>
                      <button
                        onClick={() =>
                          form ? setEditingForm(form) : startNewForm(track)
                        }
                        className="btn-primary text-xs py-2 px-3 flex items-center gap-1.5 flex-1 justify-center"
                      >
                        {form ? (
                          <>
                            <Edit2 size={14} />
                            Edit Form
                          </>
                        ) : (
                          <>
                            <Plus size={14} />
                            Build Form
                          </>
                        )}
                      </button>
                      {form && (
                        <>
                          <button
                            onClick={() => handleToggleActive(form)}
                            className="p-2 hover:bg-nebula-purple-1 rounded-lg text-text-stardust/60 hover:text-text-stardust transition-colors"
                            title={form.is_active ? "Disable" : "Enable"}
                          >
                            <Eye
                              size={16}
                              className={
                                form.is_active
                                  ? "text-green-400"
                                  : "text-text-stardust/40"
                              }
                            />
                          </button>
                          <button
                            onClick={() => handleDelete(form)}
                            className="p-2 hover:bg-red-500/10 hover:text-red-400 rounded-lg text-text-stardust/40 transition-colors"
                            title="Delete Form"
                          >
                            <Trash2 size={16} />
                          </button>
                        </>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Form Builder Modal */}
      <AnimatePresence>
        {editingForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-dark border border-gold-primary/30 rounded-2xl max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden shadow-2xl"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-border-cosmic-blue flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileEdit size={24} className="text-gold-primary" />
                  <div>
                    <h2 className="text-xl font-heading font-bold text-text-stardust">
                      Form Builder
                    </h2>
                    <p className="text-xs text-text-stardust/60 capitalize">
                      {editingForm.portal_type} application
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setEditingForm(null)}
                  className="p-2 hover:bg-nebula-purple-1 rounded-lg text-text-stardust/60 hover:text-text-stardust"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Form Body */}
              <div className="p-6 overflow-y-auto space-y-6 flex-1">
                {/* Form Meta */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-text-stardust/80 mb-1">
                      Form Title
                    </label>
                    <input
                      type="text"
                      value={editingForm.title}
                      onChange={(e) =>
                        setEditingForm({
                          ...editingForm,
                          title: e.target.value,
                        })
                      }
                      className="input-cosmic w-full text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-text-stardust/80 mb-1">
                      Description
                    </label>
                    <input
                      type="text"
                      value={editingForm.description}
                      onChange={(e) =>
                        setEditingForm({
                          ...editingForm,
                          description: e.target.value,
                        })
                      }
                      className="input-cosmic w-full text-sm"
                    />
                  </div>
                </div>

                {/* Add Field Toolbar */}
                <div className="card-cosmic p-4">
                  <p className="text-xs font-medium text-text-stardust/80 mb-3">
                    Add a field:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {FIELD_TYPES.map((ft) => {
                      const Icon = ft.icon;
                      return (
                        <button
                          key={ft.value}
                          onClick={() => addField(ft.value)}
                          className="inline-flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg bg-nebula-purple-1 border border-border-cosmic-blue text-text-stardust/70 hover:text-gold-primary hover:border-gold-primary/30 transition-colors"
                        >
                          <Icon size={14} />
                          {ft.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Fields List */}
                <div className="space-y-3">
                  {editingForm.fields.map((field, idx) => (
                    <div
                      key={field.id}
                      className="card-cosmic p-4 space-y-3 bg-nebula-purple-1/40"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-text-stardust/50">
                          <GripVertical size={16} />
                          <span className="text-xs font-mono">
                            Field {idx + 1}
                          </span>
                          <span className="text-xs px-2 py-0.5 rounded bg-gold-primary/10 text-gold-primary border border-gold-primary/20">
                            {field.type}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => moveField(field.id, "up")}
                            disabled={idx === 0}
                            className="p-1 hover:bg-nebula-purple-1 rounded text-text-stardust/50 disabled:opacity-30"
                          >
                            ↑
                          </button>
                          <button
                            onClick={() => moveField(field.id, "down")}
                            disabled={idx === editingForm.fields.length - 1}
                            className="p-1 hover:bg-nebula-purple-1 rounded text-text-stardust/50 disabled:opacity-30"
                          >
                            ↓
                          </button>
                          <button
                            onClick={() => removeField(field.id)}
                            className="p-1 hover:bg-red-500/10 hover:text-red-400 rounded text-text-stardust/40"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-text-stardust/60 mb-1">
                            Label
                          </label>
                          <input
                            type="text"
                            value={field.label}
                            onChange={(e) =>
                              updateField(field.id, { label: e.target.value })
                            }
                            className="input-cosmic w-full text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-text-stardust/60 mb-1">
                            Placeholder
                          </label>
                          <input
                            type="text"
                            value={field.placeholder || ""}
                            onChange={(e) =>
                              updateField(field.id, {
                                placeholder: e.target.value,
                              })
                            }
                            className="input-cosmic w-full text-sm"
                          />
                        </div>
                      </div>

                      {/* Options for dropdown/radio/checkbox */}
                      {(field.type === "dropdown" ||
                        field.type === "radio" ||
                        field.type === "checkbox") && (
                        <div>
                          <label className="block text-xs text-text-stardust/60 mb-1">
                            Options (one per line)
                          </label>
                          <textarea
                            rows={3}
                            value={(field.options || []).join("\n")}
                            onChange={(e) =>
                              updateField(field.id, {
                                options: e.target.value
                                  .split("\n")
                                  .filter(Boolean),
                              })
                            }
                            className="input-cosmic w-full text-sm resize-none"
                            placeholder={"Option 1\nOption 2\nOption 3"}
                          />
                        </div>
                      )}

                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          id={`required-${field.id}`}
                          checked={field.required}
                          onChange={(e) =>
                            updateField(field.id, {
                              required: e.target.checked,
                            })
                          }
                          className="w-4 h-4 rounded text-gold-primary bg-nebula-purple-1 border-border-cosmic-blue focus:ring-gold-primary"
                        />
                        <label
                          htmlFor={`required-${field.id}`}
                          className="text-xs text-text-stardust cursor-pointer"
                        >
                          Required field
                        </label>
                      </div>
                    </div>
                  ))}

                  {editingForm.fields.length === 0 && (
                    <div className="text-center py-8 text-text-stardust/50">
                      <p className="text-sm">
                        No fields yet. Add one from the toolbar above.
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <input
                    type="checkbox"
                    id="form_active"
                    checked={editingForm.is_active}
                    onChange={(e) =>
                      setEditingForm({
                        ...editingForm,
                        is_active: e.target.checked,
                      })
                    }
                    className="w-4 h-4 rounded text-gold-primary bg-nebula-purple-1 border-border-cosmic-blue focus:ring-gold-primary"
                  />
                  <label
                    htmlFor="form_active"
                    className="text-sm text-text-stardust cursor-pointer"
                  >
                    Publish form (make it live on the public site)
                  </label>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-border-cosmic-blue flex items-center justify-end gap-3">
                <button
                  onClick={() => setEditingForm(null)}
                  className="btn-secondary text-sm py-2 px-4"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveForm}
                  disabled={isSaving}
                  className="btn-primary text-sm py-2 px-6 flex items-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      Save Form
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
