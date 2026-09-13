"use client";

import { useEffect, useState } from "react";
import {
  AlertCircle,
  Check,
  Loader2,
  Plus,
  ShieldCheck,
  Trash2,
  UserPlus,
  X,
} from "lucide-react";
import { useAdminAuth } from "@/components/admin/AuthProvider";
import { supabase } from "@/lib/supabase";

type Role = {
  id: string;
  name: string;
  description: string | null;
  permissions: string[];
  is_system: boolean;
};

type ActionRequest = {
  id: string;
  action: string;
  resource: string;
  status: string;
  requested_by: string;
  record_id: string | null;
  created_at: string;
  review_note: string | null;
};

type Assignment = {
  id: string;
  user_id: string;
  portal_id: string;
  email: string;
  role_id: string;
  role?: { name?: string } | null;
  created_at: string;
};

const permissionOptions = [
  ["applications.read", "View applications"],
  ["applications.manage", "Manage applications"],
  ["applications.review", "Review applications"],
  ["applications.export", "Export applications"],
  ["applications.delegate.accept", "Accept Delegate applications"],
  ["applications.chair.accept", "Accept Chair applications"],
  ["applications.secretariat.accept", "Accept Secretariat applications"],
  ["portals.delegate.manage", "Manage Delegate portal"],
  ["portals.chair.manage", "Manage Chair portal"],
  ["portals.secretariat.manage", "Manage Secretariat portal"],
  ["committees.read", "View committees"],
  ["committees.manage", "Manage committees"],
  ["forms.manage", "Manage form builder"],
  ["schedule.manage", "Manage schedule"],
  ["secretariat.manage", "Manage secretariat"],
  ["settings.manage", "Manage summit settings"],
] as const;

function roleDisplayName(name: string) {
  return name === "super_admin" ? "Founder" : name.replaceAll("_", " ");
}

export default function AdminAccessPage() {
  const { hasPermission, permissions, user } = useAdminAuth();
  const canManageRoles = hasPermission("roles.manage");
  const canRequestRevocation = hasPermission("secretariat.manage");
  const [roles, setRoles] = useState<Role[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [requests, setRequests] = useState<ActionRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [newRole, setNewRole] = useState({
    name: "",
    description: "",
    permissions: [] as string[],
  });
  const [assignment, setAssignment] = useState({
    userId: "",
    email: "",
    roleId: "",
  });

  useEffect(() => {
    if (canManageRoles || canRequestRevocation) {
      void loadData();
    }
  }, [canManageRoles, canRequestRevocation]);

  async function loadData() {
    setIsLoading(true);
    const [rolesResult, assignmentsResult, requestsResult] = await Promise.all([
      supabase.from("admin_roles").select("*").order("name"),
      supabase
        .from("admin_role_assignments")
        .select(
          "id, user_id, portal_id, email, role_id, created_at, role:admin_roles(name)",
        )
        .order("created_at", { ascending: true }),
      supabase
        .from("admin_action_requests")
        .select("*")
        .eq("status", "pending")
        .order("created_at", { ascending: false }),
    ]);
    if (rolesResult.error || assignmentsResult.error || requestsResult.error) {
      setMessage("Run supabase/admin-roles.sql first, then reload this page.");
    }
    setRoles((rolesResult.data || []) as Role[]);
    setAssignments((assignmentsResult.data || []) as Assignment[]);
    setRequests((requestsResult.data || []) as ActionRequest[]);
    setIsLoading(false);
  }

  function togglePermission(permission: string) {
    setNewRole((current) => ({
      ...current,
      permissions: current.permissions.includes(permission)
        ? current.permissions.filter((item) => item !== permission)
        : [...current.permissions, permission],
    }));
  }

  async function createRole(event: React.FormEvent) {
    event.preventDefault();
    if (!newRole.name.trim()) return;
    setIsSaving(true);
    const { error } = await supabase.from("admin_roles").insert({
      name: newRole.name.trim().toLowerCase().replace(/\s+/g, "_"),
      description: newRole.description.trim() || null,
      permissions: newRole.permissions,
    });
    setIsSaving(false);
    if (error) {
      setMessage(error.message);
      return;
    }
    setNewRole({ name: "", description: "", permissions: [] });
    setMessage("Role created.");
    await loadData();
  }

  function updateRole(roleId: string, changes: Partial<Role>) {
    setRoles((current) =>
      current.map((item) =>
        item.id === roleId ? { ...item, ...changes } : item,
      ),
    );
  }

  function toggleRolePermission(roleId: string, permission: string) {
    setRoles((current) =>
      current.map((item) => {
        if (item.id !== roleId) return item;
        const permissions = item.permissions.includes(permission)
          ? item.permissions.filter((value) => value !== permission)
          : [...item.permissions.filter((value) => value !== "*"), permission];
        return { ...item, permissions };
      }),
    );
  }

  async function saveRole(item: Role) {
    setIsSaving(true);
    const { error } = await supabase
      .from("admin_roles")
      .update({
        name: item.name.trim().toLowerCase().replace(/\s+/g, "_"),
        description: item.description?.trim() || null,
        permissions: item.permissions,
        updated_at: new Date().toISOString(),
      })
      .eq("id", item.id);
    setIsSaving(false);
    setMessage(error ? error.message : `${item.name} permissions updated.`);
    if (!error) await loadData();
  }

  async function deleteRole(item: Role) {
    if (item.name === "super_admin") {
      setMessage("The Founder role cannot be deleted.");
      return;
    }
    if (!window.confirm(`Delete the ${roleDisplayName(item.name)} role?`))
      return;

    setIsSaving(true);
    const { error } = await supabase
      .from("admin_roles")
      .delete()
      .eq("id", item.id);
    setIsSaving(false);
    if (error) {
      setMessage(
        `Could not delete this role. Remove its user assignments first. ${error.message}`,
      );
      return;
    }
    setRoles((current) =>
      current.filter((roleItem) => roleItem.id !== item.id),
    );
    setMessage(`${roleDisplayName(item.name)} role deleted.`);
  }

  async function assignRole(event: React.FormEvent) {
    event.preventDefault();
    setIsSaving(true);
    const { error } = await supabase.from("admin_role_assignments").upsert(
      {
        user_id: assignment.userId.trim(),
        email: assignment.email.trim(),
        role_id: assignment.roleId,
        assigned_by: user?.id,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );
    setIsSaving(false);
    setMessage(
      error
        ? error.message
        : "Role assigned. The user will receive the updated permissions on their next session.",
    );
    if (!error) {
      setAssignment({ userId: "", email: "", roleId: "" });
      await loadData();
    }
  }

  async function changeAssignmentRole(assignmentId: string, roleId: string) {
    if (!roleId) return;
    setIsSaving(true);
    const { error } = await supabase
      .from("admin_role_assignments")
      .update({
        role_id: roleId,
        assigned_by: user?.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", assignmentId);
    setIsSaving(false);
    if (error) {
      setMessage(error.message);
      return;
    }
    setAssignments((current) =>
      current.map((item) =>
        item.id === assignmentId
          ? {
              ...item,
              role_id: roleId,
              role: { name: roles.find((item) => item.id === roleId)?.name },
            }
          : item,
      ),
    );
    setMessage(
      "Role updated. The user will receive the change on their next session.",
    );
  }

  async function revokeAssignment(item: Assignment) {
    if (item.user_id === user?.id) {
      setMessage(
        "You cannot revoke your own Super Admin access from this page.",
      );
      return;
    }
    if (item.role?.name === "super_admin") {
      setMessage("The Founder access cannot be revoked.");
      return;
    }
    if (!window.confirm(`Revoke admin access for ${item.email}?`)) return;
    setIsSaving(true);
    const { error } = canManageRoles
      ? await supabase.from("admin_role_assignments").delete().eq("id", item.id)
      : await supabase.from("admin_action_requests").insert({
          requested_by: user?.id,
          action: "delete",
          resource: "admin_role_assignments",
          record_id: item.id,
          payload: { email: item.email, portal_id: item.portal_id },
        });
    setIsSaving(false);
    if (error) {
      setMessage(error.message);
      return;
    }
    if (canManageRoles) {
      setAssignments((current) =>
        current.filter((assignment) => assignment.id !== item.id),
      );
      setMessage("Admin access revoked.");
    } else {
      setMessage("Revocation request sent to the Founder for approval.");
    }
  }

  async function reviewRequest(id: string, status: "approved" | "rejected") {
    if (!canManageRoles) return;
    const request = requests.find((item) => item.id === id);
    if (
      status === "approved" &&
      request?.resource === "admin_role_assignments"
    ) {
      const { error: deleteError } = await supabase
        .from("admin_role_assignments")
        .delete()
        .eq("id", request.record_id || "");
      if (deleteError) {
        setMessage(deleteError.message);
        return;
      }
    }
    const { error } = await supabase
      .from("admin_action_requests")
      .update({
        status,
        reviewed_by: user?.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", id);
    if (error) setMessage(error.message);
    else
      setRequests((current) => current.filter((request) => request.id !== id));
  }

  if (!canManageRoles && !canRequestRevocation) {
    return (
      <div className="card-cosmic p-8 text-center text-text-stardust/70">
        This area is restricted to the Super Admin.
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 size={40} className="animate-spin text-gold-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <header>
        <div className="flex items-center gap-2">
          <ShieldCheck className="text-gold-primary" size={24} />
          <h1 className="text-2xl font-display font-bold text-gold-primary">
            Roles & Approvals
          </h1>
        </div>
        <p className="mt-1 text-sm text-text-stardust/60">
          Define permissions, assign administrators, and review requested
          changes.
        </p>
      </header>

      {message && (
        <div className="flex items-center gap-2 rounded-lg border border-gold-primary/30 bg-gold-primary/10 p-3 text-sm">
          <AlertCircle size={18} />
          <span>{message}</span>
          <button
            className="ml-auto"
            onClick={() => setMessage(null)}
            aria-label="Dismiss"
          >
            <X size={18} />
          </button>
        </div>
      )}

      {canManageRoles && (
        <section className="grid gap-4 xl:grid-cols-2">
          <form onSubmit={createRole} className="card-cosmic space-y-3 p-4">
            <h2 className="flex items-center gap-2 text-lg font-heading">
              <Plus size={20} className="text-gold-primary" /> Create role
            </h2>
            <input
              className="input-cosmic"
              placeholder="Role name, e.g. communications_lead"
              value={newRole.name}
              onChange={(event) =>
                setNewRole({ ...newRole, name: event.target.value })
              }
              required
            />
            <textarea
              className="input-cosmic min-h-14"
              placeholder="What this role is responsible for"
              value={newRole.description}
              onChange={(event) =>
                setNewRole({ ...newRole, description: event.target.value })
              }
            />
            <div className="grid gap-2 sm:grid-cols-2">
              {permissionOptions.map(([permission, label]) => (
                <label
                  key={permission}
                  className="flex items-center gap-2 text-sm text-text-stardust/80"
                >
                  <input
                    type="checkbox"
                    checked={newRole.permissions.includes(permission)}
                    onChange={() => togglePermission(permission)}
                  />
                  {label}
                </label>
              ))}
            </div>
            <button
              className="btn-primary flex items-center gap-2"
              disabled={isSaving}
            >
              <Plus size={18} /> Create role
            </button>
          </form>

          <form onSubmit={assignRole} className="card-cosmic space-y-3 p-4">
            <h2 className="flex items-center gap-2 text-lg font-heading">
              <UserPlus size={20} className="text-gold-primary" /> Assign a role
            </h2>
            <p className="text-xs text-text-stardust/60">
              Use the user UUID from Supabase Auth. The email is kept for a
              readable audit trail.
            </p>
            <input
              className="input-cosmic"
              placeholder="User UUID"
              value={assignment.userId}
              onChange={(event) =>
                setAssignment({ ...assignment, userId: event.target.value })
              }
              required
            />
            <input
              className="input-cosmic"
              type="email"
              placeholder="admin@example.com"
              value={assignment.email}
              onChange={(event) =>
                setAssignment({ ...assignment, email: event.target.value })
              }
              required
            />
            <select
              className="input-cosmic"
              value={assignment.roleId}
              onChange={(event) =>
                setAssignment({ ...assignment, roleId: event.target.value })
              }
              required
            >
              <option value="">Choose a role</option>
              {roles.map((item) => (
                <option key={item.id} value={item.id}>
                  {roleDisplayName(item.name)}
                </option>
              ))}
            </select>
            <button
              className="btn-primary flex items-center gap-2"
              disabled={isSaving}
            >
              <UserPlus size={18} /> Assign role
            </button>
          </form>
        </section>
      )}

      {(canManageRoles || canRequestRevocation) && (
        <section className="card-cosmic p-4">
          <h2 className="mb-3 flex items-center gap-2 text-lg font-heading">
            <UserPlus size={20} className="text-gold-primary" /> Assigned
            administrators
          </h2>
          {assignments.length === 0 ? (
            <p className="text-text-stardust/60">
              No database role assignments yet.
            </p>
          ) : (
            <div className="space-y-2">
              {assignments.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col gap-2 border-b border-border-cosmic-blue/50 pb-2 last:border-0 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{item.email}</p>
                    <p className="text-xs font-semibold uppercase tracking-wider text-gold-primary">
                      Reference code: {item.portal_id}
                    </p>
                    <p className="truncate text-xs text-text-stardust/50">
                      {item.user_id}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {canManageRoles && (
                      <select
                        className="input-cosmic min-w-40"
                        value={item.role_id}
                        disabled={isSaving}
                        onChange={(event) =>
                          void changeAssignmentRole(item.id, event.target.value)
                        }
                        aria-label={`Role for ${item.email}`}
                      >
                        {roles.map((availableRole) => (
                          <option
                            key={availableRole.id}
                            value={availableRole.id}
                          >
                            {roleDisplayName(availableRole.name)}
                          </option>
                        ))}
                      </select>
                    )}
                    {item.role?.name !== "super_admin" && (
                      <button
                        type="button"
                        className="btn-secondary"
                        disabled={isSaving || item.user_id === user?.id}
                        onClick={() => void revokeAssignment(item)}
                      >
                        {canManageRoles ? "Revoke" : "Request revoke"}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {canManageRoles && (
        <section className="card-cosmic p-4">
          <h2 className="mb-3 flex items-center gap-2 text-lg font-heading">
            <ShieldCheck size={20} className="text-gold-primary" /> Edit roles &
            permissions
          </h2>
          <div className="space-y-2">
            {roles.map((item) => (
              <details
                key={item.id}
                className="border-b border-border-cosmic-blue/50 pb-2 last:border-0"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 py-2 text-sm">
                  <span className="font-medium">
                    {roleDisplayName(item.name)}
                  </span>
                  <span className="text-xs text-text-stardust/50">
                    {item.is_system ? "Built-in" : "Custom"} ·{" "}
                    {item.permissions.includes("*")
                      ? "Full access"
                      : `${item.permissions.length} permissions`}
                  </span>
                </summary>
                <div className="space-y-2 pt-2">
                  <div className="grid gap-2 md:grid-cols-2">
                    <input
                      className="input-cosmic"
                      value={
                        item.name === "super_admin" ? "Founder" : item.name
                      }
                      readOnly={item.name === "super_admin"}
                      onChange={(event) =>
                        updateRole(item.id, { name: event.target.value })
                      }
                      aria-label={`Name for ${item.name}`}
                    />
                    <input
                      className="input-cosmic"
                      value={item.description || ""}
                      placeholder="Role description"
                      onChange={(event) =>
                        updateRole(item.id, { description: event.target.value })
                      }
                      aria-label={`Description for ${item.name}`}
                    />
                  </div>
                  <div className="grid gap-x-3 gap-y-1 sm:grid-cols-2 lg:grid-cols-3">
                    <label className="flex items-center gap-2 text-xs text-gold-primary">
                      <input
                        type="checkbox"
                        checked={item.permissions.includes("*")}
                        onChange={() => toggleRolePermission(item.id, "*")}
                      />
                      Full access
                    </label>
                    {permissionOptions.map(([permission, label]) => (
                      <label
                        key={permission}
                        className="flex items-center gap-2 text-xs text-text-stardust/80"
                      >
                        <input
                          type="checkbox"
                          checked={
                            item.permissions.includes("*") ||
                            item.permissions.includes(permission)
                          }
                          disabled={item.permissions.includes("*")}
                          onChange={() =>
                            toggleRolePermission(item.id, permission)
                          }
                        />
                        {label}
                      </label>
                    ))}
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      className="btn-primary flex items-center gap-2"
                      disabled={isSaving || !item.name.trim()}
                      onClick={() => void saveRole(item)}
                    >
                      <Check size={16} /> Save role
                    </button>
                    <button
                      type="button"
                      className="btn-secondary flex items-center gap-2"
                      disabled={isSaving || item.name === "super_admin"}
                      onClick={() => void deleteRole(item)}
                    >
                      <Trash2 size={16} /> Delete
                    </button>
                  </div>
                </div>
              </details>
            ))}
          </div>
        </section>
      )}

      <section className="card-cosmic p-4">
        <h2 className="mb-3 flex items-center gap-2 text-lg font-heading">
          <AlertCircle size={20} className="text-gold-primary" /> Pending
          approvals{" "}
          <span className="text-sm text-text-stardust/50">
            ({requests.length})
          </span>
        </h2>
        {requests.length === 0 ? (
          <p className="text-text-stardust/60">No pending requests.</p>
        ) : (
          <div className="space-y-2">
            {requests.map((request) => (
              <div
                key={request.id}
                className="flex flex-col gap-2 border-b border-border-cosmic-blue/50 pb-2 last:border-0 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-medium">
                    {request.action} {request.resource}
                  </p>
                  <p className="text-sm text-text-stardust/60">
                    Requested by {request.requested_by} on{" "}
                    {new Date(request.created_at).toLocaleString()}
                  </p>
                </div>
                {canManageRoles && (
                  <div className="flex gap-2">
                    <button
                      className="btn-primary flex items-center gap-2"
                      onClick={() => reviewRequest(request.id, "approved")}
                    >
                      <Check size={16} /> Approve
                    </button>
                    <button
                      className="btn-secondary flex items-center gap-2"
                      onClick={() => reviewRequest(request.id, "rejected")}
                    >
                      <X size={16} /> Reject
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
