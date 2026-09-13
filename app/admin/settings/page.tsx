"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAdminAuth } from "@/components/admin/AuthProvider";
import { PortalSettings, FormMode } from "@/types";
import {
  Users,
  Award,
  Crown,
  Save,
  Loader2,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Link2,
  FileEdit,
  Power,
} from "lucide-react";
import { motion } from "framer-motion";

const portalConfig = {
  delegate: {
    icon: Users,
    title: "Delegate Portal",
    description: "Delegate applications",
    color: "blue",
  },
  chair: {
    icon: Award,
    title: "Chair Portal",
    description: "Chair applications",
    color: "purple",
  },
  secretariat: {
    icon: Crown,
    title: "Secretariat Portal",
    description: "Secretariat applications",
    color: "gold",
  },
};

const formModeConfig: Record<
  FormMode,
  { label: string; icon: typeof Link2; description: string }
> = {
  google_form: {
    label: "Google Form",
    icon: ExternalLink,
    description: "Link to an external Google Form",
  },
  external_link: {
    label: "External Link",
    icon: Link2,
    description: "Link to any external form URL",
  },
  custom_builder: {
    label: "Custom Form",
    icon: FileEdit,
    description: "Use the built-in form builder",
  },
};

export default function AdminSettingsPage() {
  const { user, hasPermission } = useAdminAuth();
  const [portals, setPortals] = useState<PortalSettings[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [hasChanges, setHasChanges] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchPortals();
  }, []);

  async function fetchPortals() {
    try {
      const { data, error } = await supabase
        .from("portal_settings")
        .select("*")
        .order("portal_type", { ascending: true });

      if (error) throw error;
      setPortals(data || []);
    } catch (error) {
      console.error("Error fetching portal settings:", error);
      setSaveStatus({
        type: "error",
        message: "Failed to load portal settings. Check your connection.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  function handleToggle(portalId: string, currentValue: boolean) {
    setPortals((prev) =>
      prev.map((p) =>
        p.id === portalId ? { ...p, is_active: !currentValue } : p,
      ),
    );
    setHasChanges((prev) => new Set(prev).add(portalId));
  }

  function handleFormModeChange(portalId: string, newMode: FormMode) {
    setPortals((prev) =>
      prev.map((p) => (p.id === portalId ? { ...p, form_mode: newMode } : p)),
    );
    setHasChanges((prev) => new Set(prev).add(portalId));
  }

  function handleUrlChange(portalId: string, url: string) {
    setPortals((prev) =>
      prev.map((p) => (p.id === portalId ? { ...p, form_url: url } : p)),
    );
    setHasChanges((prev) => new Set(prev).add(portalId));
  }

  function handleClosedMessageChange(portalId: string, message: string) {
    setPortals((prev) =>
      prev.map((p) =>
        p.id === portalId ? { ...p, closed_message: message } : p,
      ),
    );
    setHasChanges((prev) => new Set(prev).add(portalId));
  }

  async function savePortal(portal: PortalSettings) {
    setIsSaving(portal.id);
    setSaveStatus(null);

    try {
      const { error } = await supabase
        .from("portal_settings")
        .update({
          is_active: portal.is_active,
          form_mode: portal.form_mode,
          form_url: portal.form_url,
          closed_message: portal.closed_message,
          updated_at: new Date().toISOString(),
        })
        .eq("id", portal.id);

      if (error) throw error;

      setSaveStatus({
        type: "success",
        message: `${portalConfig[portal.portal_type].title} updated successfully!`,
      });

      // Remove from changed set
      setHasChanges((prev) => {
        const next = new Set(prev);
        next.delete(portal.id);
        return next;
      });

      // Clear status after 3 seconds
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (error) {
      console.error("Error saving portal settings:", error);
      setSaveStatus({
        type: "error",
        message: `Failed to update ${portalConfig[portal.portal_type].title}. Please try again.`,
      });
    } finally {
      setIsSaving(null);
    }
  }

  async function saveAll() {
    const changedPortals = portals.filter((p) => hasChanges.has(p.id));
    for (const portal of changedPortals) {
      await savePortal(portal);
    }
  }

  const canEdit = hasPermission("settings.manage");

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 size={40} className="animate-spin text-gold-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-gold-primary mb-2">
            Portal Settings
          </h1>
          <p className="text-text-stardust/60">
            Control application portals and form configurations in real-time.
          </p>
        </div>
        {hasChanges.size > 0 && canEdit && (
          <button
            onClick={saveAll}
            disabled={isSaving !== null}
            className="btn-primary flex items-center gap-2"
          >
            {isSaving ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save size={18} />
                Save All Changes ({hasChanges.size})
              </>
            )}
          </button>
        )}
      </div>

      {/* Permission Notice */}
      {!canEdit && (
        <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30 flex items-start gap-3">
          <AlertCircle
            size={20}
            className="text-yellow-400 flex-shrink-0 mt-0.5"
          />
          <p className="text-sm text-yellow-300">
            You have read-only access. Only Super Admins and Directors of
            Registrations can modify portal settings.
          </p>
        </div>
      )}

      {/* Save Status */}
      {saveStatus && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-lg flex items-center gap-3 ${
            saveStatus.type === "success"
              ? "bg-green-500/10 border border-green-500/30"
              : "bg-red-500/10 border border-red-500/30"
          }`}
        >
          {saveStatus.type === "success" ? (
            <CheckCircle size={20} className="text-green-400" />
          ) : (
            <AlertCircle size={20} className="text-red-400" />
          )}
          <p
            className={`text-sm ${
              saveStatus.type === "success" ? "text-green-300" : "text-red-300"
            }`}
          >
            {saveStatus.message}
          </p>
        </motion.div>
      )}

      {/* Portal Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {portals.map((portal) => {
          const config = portalConfig[portal.portal_type];
          const IconComponent = config.icon;
          const isChanged = hasChanges.has(portal.id);

          return (
            <div
              key={portal.id}
              className={`card-cosmic p-6 ${
                portal.is_active ? "" : "opacity-80"
              } ${isChanged ? "ring-2 ring-gold-primary/40" : ""}`}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div
                    className={`p-3 rounded-lg ${
                      config.color === "blue"
                        ? "bg-blue-500/10 border border-blue-500/20"
                        : config.color === "purple"
                          ? "bg-purple-500/10 border border-purple-500/20"
                          : "bg-gold-primary/10 border border-gold-primary/20"
                    }`}
                  >
                    <IconComponent
                      size={24}
                      className={
                        config.color === "blue"
                          ? "text-blue-400"
                          : config.color === "purple"
                            ? "text-purple-400"
                            : "text-gold-primary"
                      }
                    />
                  </div>
                  <div>
                    <h3 className="font-heading text-lg font-semibold text-text-stardust">
                      {config.title}
                    </h3>
                    <p className="text-xs text-text-stardust/60">
                      {config.description}
                    </p>
                  </div>
                </div>

                {/* Toggle Switch */}
                <button
                  onClick={() =>
                    canEdit && handleToggle(portal.id, portal.is_active)
                  }
                  disabled={!canEdit}
                  className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors disabled:cursor-not-allowed ${
                    portal.is_active
                      ? "bg-green-500"
                      : "bg-nebula-purple-1 border border-border-cosmic-blue"
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                      portal.is_active ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              {/* Status Badge */}
              <div className="mb-6">
                {portal.is_active ? (
                  <span className="badge-active flex items-center gap-1.5 w-fit">
                    <Power size={14} />
                    Open
                  </span>
                ) : (
                  <span className="badge-closed flex items-center gap-1.5 w-fit">
                    <Power size={14} />
                    Closed
                  </span>
                )}
              </div>

              {/* Form Mode Selector */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-stardust/80 mb-2">
                    Form Mode
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(Object.keys(formModeConfig) as FormMode[]).map((mode) => {
                      const modeConfig = formModeConfig[mode];
                      const ModeIcon = modeConfig.icon;
                      const isSelected = portal.form_mode === mode;
                      return (
                        <button
                          key={mode}
                          onClick={() =>
                            canEdit && handleFormModeChange(portal.id, mode)
                          }
                          disabled={!canEdit}
                          className={`p-2 rounded-lg border text-center transition-all duration-200 ${
                            isSelected
                              ? "bg-gold-primary/10 border-gold-primary/50 text-gold-primary"
                              : "bg-nebula-purple-1 border-border-cosmic-blue text-text-stardust/60 hover:text-text-stardust"
                          } disabled:cursor-not-allowed`}
                          title={modeConfig.description}
                        >
                          <ModeIcon size={16} className="mx-auto mb-1" />
                          <span className="text-xs">{modeConfig.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Form URL (only for google_form and external_link) */}
                {portal.form_mode !== "custom_builder" && (
                  <div>
                    <label className="block text-sm font-medium text-text-stardust/80 mb-2">
                      Form URL
                    </label>
                    <input
                      type="url"
                      value={portal.form_url || ""}
                      onChange={(e) =>
                        handleUrlChange(portal.id, e.target.value)
                      }
                      disabled={!canEdit}
                      placeholder="https://forms.google.com/..."
                      className="input-cosmic w-full disabled:opacity-50"
                    />
                  </div>
                )}

                {/* Custom Form Builder Link */}
                {portal.form_mode === "custom_builder" && (
                  <div className="p-3 rounded-lg bg-gold-primary/10 border border-gold-primary/30">
                    <p className="text-xs text-gold-primary/90">
                      <FileEdit size={14} className="inline mr-1" />
                      Custom form is active. Build your form at{" "}
                      <a
                        href="/admin/forms"
                        className="underline hover:text-gold-primary"
                      >
                        Form Builder
                      </a>
                    </p>
                  </div>
                )}

                {/* Closed Message */}
                <div>
                  <label className="block text-sm font-medium text-text-stardust/80 mb-2">
                    Closed Message
                  </label>
                  <textarea
                    value={portal.closed_message || ""}
                    onChange={(e) =>
                      handleClosedMessageChange(portal.id, e.target.value)
                    }
                    disabled={!canEdit}
                    rows={2}
                    placeholder="Applications are currently closed. Check back soon!"
                    className="input-cosmic w-full resize-none disabled:opacity-50"
                  />
                  <p className="text-xs text-text-stardust/50 mt-1">
                    This message is shown when the portal is closed.
                  </p>
                </div>

                {/* Save Button */}
                {canEdit && isChanged && (
                  <button
                    onClick={() => savePortal(portal)}
                    disabled={isSaving === portal.id}
                    className="w-full btn-secondary flex items-center justify-center gap-2 mt-2"
                  >
                    {isSaving === portal.id ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save size={16} />
                        Save Changes
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {portals.length === 0 && !isLoading && (
        <div className="card-cosmic p-12 text-center">
          <AlertCircle
            size={48}
            className="text-text-stardust/40 mx-auto mb-4"
          />
          <h3 className="font-heading text-xl text-text-stardust/80 mb-2">
            No portal settings found
          </h3>
          <p className="text-text-stardust/60">
            Add portal configurations in Supabase before opening applications.
          </p>
        </div>
      )}

      {/* Help Section */}
      <div className="card-cosmic p-6">
        <h2 className="font-heading text-xl font-semibold text-text-stardust mb-4">
          How Portal Settings Work
        </h2>
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Power size={18} className="text-gold-primary" />
              <h4 className="font-medium text-text-stardust">Toggle</h4>
            </div>
            <p className="text-sm text-text-stardust/70">
              Turn portals on or off instantly. Changes appear on the public
              site in real-time.
            </p>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <ExternalLink size={18} className="text-gold-primary" />
              <h4 className="font-medium text-text-stardust">Form Mode</h4>
            </div>
            <p className="text-sm text-text-stardust/70">
              Choose between Google Forms, external links, or the custom form
              builder.
            </p>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle size={18} className="text-gold-primary" />
              <h4 className="font-medium text-text-stardust">Closed Message</h4>
            </div>
            <p className="text-sm text-text-stardust/70">
              Set a custom message displayed when a portal is closed to inform
              applicants.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
