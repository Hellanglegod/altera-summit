"use client";

import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { useAdminAuth } from "@/components/admin/AuthProvider";
import { FormSubmission, ApplicationStatus, Committee } from "@/types";
import {
  FileText,
  Search,
  Filter,
  Download,
  Trash2,
  Eye,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
  Users,
  Award,
  Crown,
  Save,
  Loader2,
  X,
  ChevronDown,
  RefreshCw,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

const STATUSES: ApplicationStatus[] = [
  "Submitted",
  "In Review",
  "Shortlisted",
  "Accepted",
  "Confirmed",
  "Rejected",
];

const STATUS_COLORS: Record<
  ApplicationStatus,
  { bg: string; text: string; border: string; icon: typeof Clock }
> = {
  Submitted: {
    bg: "bg-blue-500/10",
    text: "text-blue-400",
    border: "border-blue-500/30",
    icon: Clock,
  },
  "In Review": {
    bg: "bg-yellow-500/10",
    text: "text-yellow-400",
    border: "border-yellow-500/30",
    icon: Clock,
  },
  Shortlisted: {
    bg: "bg-purple-500/10",
    text: "text-purple-400",
    border: "border-purple-500/30",
    icon: Award,
  },
  Accepted: {
    bg: "bg-green-500/10",
    text: "text-green-400",
    border: "border-green-500/30",
    icon: CheckCircle,
  },
  Confirmed: {
    bg: "bg-gold-primary/10",
    text: "text-gold-primary",
    border: "border-gold-primary/30",
    icon: CheckCircle,
  },
  Rejected: {
    bg: "bg-red-500/10",
    text: "text-red-400",
    border: "border-red-500/30",
    icon: XCircle,
  },
};

const TRACK_ICONS = {
  delegate: Users,
  chair: Award,
  secretariat: Crown,
};

export default function ApplicationsPage() {
  const { committeeId, hasPermission } = useAdminAuth();
  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
  const [committees, setCommittees] = useState<Committee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTrack, setSelectedTrack] = useState<
    "all" | "delegate" | "chair" | "secretariat"
  >("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedSubmission, setSelectedSubmission] =
    useState<FormSubmission | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [internalNotes, setInternalNotes] = useState("");
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const canEdit = hasPermission("applications.manage");
  const canReview = hasPermission("applications.review");

  function canAcceptTrack(portalType: FormSubmission["portal_type"]): boolean {
    return hasPermission(`applications.${portalType}.accept`);
  }

  function canChangeStatus(submission: FormSubmission): boolean {
    return canEdit || canReview || canAcceptTrack(submission.portal_type);
  }

  function canAssignCommittee(submission: FormSubmission): boolean {
    return (
      (submission.portal_type === "delegate" ||
        submission.portal_type === "chair") &&
      canAcceptTrack(submission.portal_type)
    );
  }

  useEffect(() => {
    fetchSubmissions();
    fetchCommittees();
  }, []);

  useEffect(() => {
    if (selectedSubmission) {
      setInternalNotes(selectedSubmission.notes || "");
    }
  }, [selectedSubmission]);

  async function fetchSubmissions() {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("form_submissions")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setSubmissions(
        committeeId
          ? (data || []).filter(
              (submission) => submission.committee_id === committeeId,
            )
          : data || [],
      );
    } catch (error) {
      console.error("Error fetching submissions:", error);
      setStatusMessage({
        type: "error",
        text: "Failed to load submissions. Check your permissions.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchCommittees() {
    const { data } = await supabase
      .from("committees")
      .select("id, name, abbreviation, matrix_url")
      .order("display_order", { ascending: true });
    setCommittees((data || []) as Committee[]);
  }

  const scopedCommittee = committeeId
    ? committees.find((committee) => committee.id === committeeId)
    : null;
  const matrixFilledCount = submissions.filter((submission) =>
    Object.entries(submission.submission_data || {}).some(
      ([key, value]) =>
        /matrix|country|delegation|portfolio|assignment/i.test(key) &&
        value !== null &&
        value !== undefined &&
        String(value).trim().length > 0,
    ),
  ).length;

  async function handleAssignCommittee(
    submissionId: string,
    portalType: FormSubmission["portal_type"],
    committeeId: string,
  ) {
    if (
      (portalType !== "delegate" && portalType !== "chair") ||
      !canAcceptTrack(portalType)
    ) {
      return;
    }
    const { error } = await supabase
      .from("form_submissions")
      .update({
        committee_id: committeeId || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", submissionId);

    if (error) {
      setStatusMessage({
        type: "error",
        text: "Failed to assign this delegate to the committee.",
      });
      return;
    }

    setSubmissions((current) =>
      current.map((submission) =>
        submission.id === submissionId
          ? { ...submission, committee_id: committeeId || null }
          : submission,
      ),
    );
    setSelectedSubmission((current) =>
      current?.id === submissionId
        ? { ...current, committee_id: committeeId || null }
        : current,
    );
    setStatusMessage({ type: "success", text: "Committee assignment saved." });
  }

  async function handleStatusChange(
    submissionId: string,
    newStatus: ApplicationStatus,
  ) {
    const submission =
      submissions.find((item) => item.id === submissionId) ||
      (selectedSubmission?.id === submissionId ? selectedSubmission : null);
    if (!submission || !canChangeStatus(submission)) return;
    setIsUpdatingStatus(true);
    try {
      const { error } = await supabase
        .from("form_submissions")
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", submissionId);

      if (error) throw error;

      setSubmissions((prev) =>
        prev.map((s) =>
          s.id === submissionId ? { ...s, status: newStatus } : s,
        ),
      );

      if (selectedSubmission?.id === submissionId) {
        setSelectedSubmission((prev) =>
          prev ? { ...prev, status: newStatus } : null,
        );
      }

      setStatusMessage({
        type: "success",
        text: `Status updated to "${newStatus}"`,
      });
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (error) {
      console.error("Error updating status:", error);
      setStatusMessage({
        type: "error",
        text: "Failed to update status. Please try again.",
      });
    } finally {
      setIsUpdatingStatus(false);
    }
  }

  async function handleSaveNotes() {
    if (!selectedSubmission || (!canEdit && !canReview)) return;
    setIsSavingNotes(true);
    try {
      const { error } = await supabase
        .from("form_submissions")
        .update({
          notes: internalNotes,
          updated_at: new Date().toISOString(),
        })
        .eq("id", selectedSubmission.id);

      if (error) throw error;

      setSubmissions((prev) =>
        prev.map((s) =>
          s.id === selectedSubmission.id ? { ...s, notes: internalNotes } : s,
        ),
      );

      setSelectedSubmission((prev) =>
        prev ? { ...prev, notes: internalNotes } : null,
      );

      setStatusMessage({
        type: "success",
        text: "Reviewer notes saved successfully",
      });
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (error) {
      console.error("Error saving notes:", error);
      setStatusMessage({
        type: "error",
        text: "Failed to save notes.",
      });
    } finally {
      setIsSavingNotes(false);
    }
  }

  async function handleDelete(submissionId: string) {
    if (!canEdit) return;
    if (
      !confirm("Are you sure you want to permanently delete this application?")
    ) {
      return;
    }

    try {
      const { error } = await supabase
        .from("form_submissions")
        .delete()
        .eq("id", submissionId);

      if (error) throw error;

      setSubmissions((prev) => prev.filter((s) => s.id !== submissionId));
      if (selectedSubmission?.id === submissionId) {
        setSelectedSubmission(null);
      }

      setStatusMessage({
        type: "success",
        text: "Application deleted successfully",
      });
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (error) {
      console.error("Error deleting submission:", error);
      setStatusMessage({
        type: "error",
        text: "Failed to delete application.",
      });
    }
  }

  function sanitizeCSVField(val: string): string {
    const str = String(val || "").replace(/"/g, '""');
    if (/^[=+\-@\t\r]/.test(str)) {
      return `"'${str}"`;
    }
    return `"${str}"`;
  }

  function exportToCSV() {
    if (filteredSubmissions.length === 0) return;

    const headers = [
      "ID",
      "Applicant Name",
      "Email",
      "Phone",
      "Portal Track",
      "Status",
      "Submission Date",
      "Notes",
    ];

    const rows = filteredSubmissions.map((s) => [
      sanitizeCSVField(s.id),
      sanitizeCSVField(s.applicant_name),
      sanitizeCSVField(s.applicant_email),
      sanitizeCSVField(s.applicant_phone || ""),
      sanitizeCSVField(s.portal_type),
      sanitizeCSVField(s.status),
      sanitizeCSVField(formatDate(s.created_at)),
      sanitizeCSVField(s.notes || ""),
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((r) => r.join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `altera_summit_applications_${new Date().toISOString().slice(0, 10)}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Filtered list based on search, track, and status
  const filteredSubmissions = useMemo(() => {
    return submissions.filter((item) => {
      const matchesSearch =
        item.applicant_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.applicant_email
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        (item.applicant_phone &&
          item.applicant_phone
            .toLowerCase()
            .includes(searchQuery.toLowerCase()));

      const matchesTrack =
        selectedTrack === "all" || item.portal_type === selectedTrack;

      const matchesStatus =
        selectedStatus === "all" || item.status === selectedStatus;

      return matchesSearch && matchesTrack && matchesStatus;
    });
  }, [submissions, searchQuery, selectedTrack, selectedStatus]);

  // Statistics
  const stats = useMemo(() => {
    return {
      total: submissions.length,
      submitted: submissions.filter((s) => s.status === "Submitted").length,
      inReview: submissions.filter((s) => s.status === "In Review").length,
      shortlisted: submissions.filter((s) => s.status === "Shortlisted").length,
      accepted: submissions.filter((s) => s.status === "Accepted").length,
      confirmed: submissions.filter((s) => s.status === "Confirmed").length,
      rejected: submissions.filter((s) => s.status === "Rejected").length,
    };
  }, [submissions]);

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-gold-primary mb-2">
            Applications Management
          </h1>
          <p className="text-text-stardust/60">
            Review, evaluate, and manage candidate submissions across all
            portals.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchSubmissions}
            className="btn-secondary flex items-center gap-2 text-sm py-2 px-3"
            title="Refresh submissions"
          >
            <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <button
            onClick={exportToCSV}
            disabled={filteredSubmissions.length === 0}
            className="btn-primary flex items-center gap-2 text-sm py-2 px-4 disabled:opacity-50"
          >
            <Download size={16} />
            Export CSV ({filteredSubmissions.length})
          </button>
        </div>
      </div>

      {scopedCommittee && (
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="card-cosmic p-4 sm:col-span-3">
            <p className="text-xs uppercase tracking-wider text-gold-primary">
              Your committee
            </p>
            <h2 className="mt-1 text-2xl font-heading text-text-stardust">
              {scopedCommittee.abbreviation} - {scopedCommittee.name}
            </h2>
          </div>
          <div className="card-cosmic p-4">
            <p className="text-xs text-text-stardust/60">Applicants</p>
            <p className="mt-1 text-3xl font-bold text-text-stardust">
              {submissions.length}
            </p>
          </div>
          <div className="card-cosmic p-4">
            <p className="text-xs text-text-stardust/60">Matrix filled</p>
            <p className="mt-1 text-3xl font-bold text-gold-primary">
              {matrixFilledCount}
            </p>
          </div>
          <div className="card-cosmic p-4">
            <p className="text-xs text-text-stardust/60">Matrix pending</p>
            <p className="mt-1 text-3xl font-bold text-yellow-400">
              {Math.max(submissions.length - matrixFilledCount, 0)}
            </p>
          </div>
        </div>
      )}

      {/* Status Message Notification */}
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

      {/* Stats Pipeline Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
        <div
          onClick={() => setSelectedStatus("all")}
          className={`card-cosmic p-4 cursor-pointer transition-all ${
            selectedStatus === "all" ? "ring-2 ring-gold-primary/50" : ""
          }`}
        >
          <p className="text-xs text-text-stardust/60 mb-1">Total</p>
          <p className="text-2xl font-bold text-text-stardust">{stats.total}</p>
        </div>
        {STATUSES.map((status) => {
          const config = STATUS_COLORS[status];
          const count =
            status === "Submitted"
              ? stats.submitted
              : status === "In Review"
                ? stats.inReview
                : status === "Shortlisted"
                  ? stats.shortlisted
                  : status === "Accepted"
                    ? stats.accepted
                    : status === "Confirmed"
                      ? stats.confirmed
                      : stats.rejected;

          return (
            <div
              key={status}
              onClick={() => setSelectedStatus(status)}
              className={`card-cosmic p-4 cursor-pointer transition-all ${
                selectedStatus === status ? "ring-2 ring-gold-primary/50" : ""
              }`}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <span
                  className={`w-2 h-2 rounded-full ${
                    status === "Submitted"
                      ? "bg-blue-400"
                      : status === "In Review"
                        ? "bg-yellow-400"
                        : status === "Shortlisted"
                          ? "bg-purple-400"
                          : status === "Accepted"
                            ? "bg-green-400"
                            : status === "Confirmed"
                              ? "bg-gold-primary"
                              : "bg-red-400"
                  }`}
                />
                <p className="text-xs text-text-stardust/60 truncate">
                  {status}
                </p>
              </div>
              <p className={`text-2xl font-bold ${config.text}`}>{count}</p>
            </div>
          );
        })}
      </div>

      {/* Filters & Search Bar */}
      <div className="card-cosmic p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Track Tabs */}
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          {(["all", "delegate", "chair", "secretariat"] as const).map(
            (track) => (
              <button
                key={track}
                onClick={() => setSelectedTrack(track)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
                  selectedTrack === track
                    ? "bg-gold-primary text-bg-void"
                    : "bg-nebula-purple-1 text-text-stardust/70 hover:text-text-stardust border border-border-cosmic-blue"
                }`}
              >
                {track === "all" ? "All Tracks" : track}
              </button>
            ),
          )}
        </div>

        {/* Search & Status Filter */}
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="relative w-full sm:w-64">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-text-stardust/40"
            />
            <input
              type="text"
              placeholder="Search applicant or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-cosmic pl-10 py-2 text-sm w-full"
            />
          </div>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="input-cosmic py-2 text-sm px-3 bg-nebula-purple-2"
          >
            <option value="all">All Statuses</option>
            {STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Submissions Table */}
      <div className="card-cosmic overflow-hidden">
        {isLoading ? (
          <div className="p-16 text-center">
            <Loader2
              size={36}
              className="animate-spin text-gold-primary mx-auto mb-3"
            />
            <p className="text-text-stardust/60 text-sm">
              Loading applications...
            </p>
          </div>
        ) : filteredSubmissions.length === 0 ? (
          <div className="p-16 text-center">
            <FileText
              size={48}
              className="text-text-stardust/30 mx-auto mb-4"
            />
            <h3 className="font-heading text-lg text-text-stardust mb-1">
              No applications found
            </h3>
            <p className="text-sm text-text-stardust/60">
              {searchQuery ||
              selectedTrack !== "all" ||
              selectedStatus !== "all"
                ? "Try clearing your search or changing filters."
                : "No applications have been submitted yet."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border-cosmic-blue bg-nebula-purple-1/50 text-xs font-semibold uppercase tracking-wider text-text-stardust/60">
                  <th className="p-4">Applicant</th>
                  <th className="p-4">Track</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Submitted Date</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-cosmic-blue text-sm">
                {filteredSubmissions.map((submission) => {
                  const statusConfig = STATUS_COLORS[submission.status];
                  const TrackIcon =
                    TRACK_ICONS[submission.portal_type] || Users;

                  return (
                    <tr
                      key={submission.id}
                      className="hover:bg-nebula-purple-1/30 transition-colors"
                    >
                      {/* Applicant Info */}
                      <td className="p-4">
                        <div className="font-medium text-text-stardust">
                          {submission.applicant_name}
                        </div>
                        <div className="text-xs text-text-stardust/60">
                          {submission.applicant_email}
                        </div>
                        {submission.applicant_phone && (
                          <div className="text-xs text-text-stardust/40">
                            {submission.applicant_phone}
                          </div>
                        )}
                      </td>

                      {/* Track */}
                      <td className="p-4">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-nebula-purple-1 border border-border-cosmic-blue capitalize">
                          <TrackIcon size={14} className="text-gold-primary" />
                          {submission.portal_type}
                        </span>
                      </td>

                      {/* Status Dropdown */}
                      <td className="p-4">
                        {canChangeStatus(submission) ? (
                          <div className="relative inline-block">
                            <select
                              value={submission.status}
                              onChange={(e) =>
                                handleStatusChange(
                                  submission.id,
                                  e.target.value as ApplicationStatus,
                                )
                              }
                              className={`text-xs font-medium px-3 py-1.5 rounded-full border cursor-pointer focus:outline-none transition-colors ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}
                            >
                              {STATUSES.map((status) => (
                                <option
                                  key={status}
                                  value={status}
                                  className="bg-bg-void text-text-stardust"
                                >
                                  {status}
                                </option>
                              ))}
                            </select>
                          </div>
                        ) : (
                          <span
                            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}
                          >
                            {submission.status}
                          </span>
                        )}
                      </td>

                      {/* Date */}
                      <td className="p-4 text-xs text-text-stardust/60">
                        {formatDate(submission.created_at)}
                      </td>

                      {/* Actions */}
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setSelectedSubmission(submission)}
                            className="p-2 hover:bg-gold-primary/10 hover:text-gold-primary text-text-stardust/70 rounded-lg transition-colors"
                            title="View Full Application"
                          >
                            <Eye size={18} />
                          </button>
                          {canEdit && (
                            <button
                              onClick={() => handleDelete(submission.id)}
                              className="p-2 hover:bg-red-500/10 hover:text-red-400 text-text-stardust/40 rounded-lg transition-colors"
                              title="Delete Submission"
                            >
                              <Trash2 size={18} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Application Detail Modal / Drawer */}
      <AnimatePresence>
        {selectedSubmission && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-dark border border-gold-primary/30 rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-border-cosmic-blue flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-gold-primary/10 text-gold-primary border border-gold-primary/20 capitalize">
                      {selectedSubmission.portal_type} Application
                    </span>
                    <span className="text-xs text-text-stardust/40">
                      ID: {selectedSubmission.id.slice(0, 8)}...
                    </span>
                  </div>
                  <h2 className="text-2xl font-heading font-bold text-text-stardust">
                    {selectedSubmission.applicant_name}
                  </h2>
                </div>
                <button
                  onClick={() => setSelectedSubmission(null)}
                  className="p-2 hover:bg-nebula-purple-1 rounded-lg text-text-stardust/60 hover:text-text-stardust"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto space-y-6 flex-1">
                {/* Contact Information */}
                <div className="card-cosmic p-4">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-gold-primary mb-3">
                    Contact Details
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-text-stardust/50">Email</p>
                      <a
                        href={`mailto:${selectedSubmission.applicant_email}`}
                        className="text-text-stardust hover:text-gold-primary transition-colors"
                      >
                        {selectedSubmission.applicant_email}
                      </a>
                    </div>
                    <div>
                      <p className="text-xs text-text-stardust/50">Phone</p>
                      <p className="text-text-stardust">
                        {selectedSubmission.applicant_phone || "Not provided"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-text-stardust/50">
                        Submitted On
                      </p>
                      <p className="text-text-stardust">
                        {formatDate(selectedSubmission.created_at)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-text-stardust/50">
                        Last Updated
                      </p>
                      <p className="text-text-stardust">
                        {formatDate(selectedSubmission.updated_at)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Status Pipeline Selector */}
                <div className="card-cosmic p-4">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-gold-primary mb-3">
                    Application Status
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {STATUSES.map((status) => {
                      const isCurrent = selectedSubmission.status === status;
                      const config = STATUS_COLORS[status];
                      return (
                        <button
                          key={status}
                          disabled={
                            !canChangeStatus(selectedSubmission) ||
                            isUpdatingStatus
                          }
                          onClick={() =>
                            handleStatusChange(selectedSubmission.id, status)
                          }
                          className={`p-2.5 rounded-lg border text-xs font-medium transition-all text-center ${
                            isCurrent
                              ? `${config.bg} ${config.text} ${config.border} ring-2 ring-gold-primary/30`
                              : "bg-nebula-purple-1 border-border-cosmic-blue text-text-stardust/60 hover:text-text-stardust"
                          }`}
                        >
                          {status}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Form Submission Data (JSON payload) */}
                {(selectedSubmission.portal_type === "delegate" ||
                  selectedSubmission.portal_type === "chair") && (
                  <div className="card-cosmic p-4">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-gold-primary mb-3">
                      Committee Assignment
                    </h3>
                    <select
                      value={selectedSubmission.committee_id || ""}
                      disabled={!canAssignCommittee(selectedSubmission)}
                      onChange={(event) =>
                        void handleAssignCommittee(
                          selectedSubmission.id,
                          selectedSubmission.portal_type,
                          event.target.value,
                        )
                      }
                      className="input-cosmic w-full"
                    >
                      <option value="">Unassigned</option>
                      {committees.map((committee) => (
                        <option key={committee.id} value={committee.id}>
                          {committee.abbreviation} - {committee.name}
                        </option>
                      ))}
                    </select>
                    <p className="mt-2 text-xs text-text-stardust/50">
                      Authorized reviewers can assign delegates and chairs to an
                      active committee.
                    </p>
                  </div>
                )}

                {/* Form Submission Data (JSON payload) */}
                <div className="card-cosmic p-4">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-gold-primary mb-3">
                    Form Responses
                  </h3>
                  {selectedSubmission.submission_data &&
                  Object.keys(selectedSubmission.submission_data).length > 0 ? (
                    <div className="space-y-3">
                      {Object.entries(selectedSubmission.submission_data).map(
                        ([key, val]) => (
                          <div
                            key={key}
                            className="p-3 rounded-lg bg-nebula-purple-1 border border-border-cosmic-blue"
                          >
                            <p className="text-xs font-medium text-gold-primary/80 capitalize mb-1">
                              {key.replace(/_/g, " ")}
                            </p>
                            <p className="text-sm text-text-stardust whitespace-pre-wrap">
                              {typeof val === "object"
                                ? JSON.stringify(val, null, 2)
                                : String(val)}
                            </p>
                          </div>
                        ),
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-text-stardust/50 italic">
                      No custom response fields submitted.
                    </p>
                  )}
                </div>

                {/* Internal Reviewer Notes */}
                <div className="card-cosmic p-4">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-gold-primary mb-3">
                    Internal Reviewer Notes
                  </h3>
                  <textarea
                    rows={3}
                    value={internalNotes}
                    onChange={(e) => setInternalNotes(e.target.value)}
                    disabled={!canEdit && !canReview}
                    placeholder="Add internal remarks, interview feedback, allocation choices..."
                    className="input-cosmic w-full text-sm resize-none mb-3"
                  />
                  {(canEdit || canReview) && (
                    <button
                      onClick={handleSaveNotes}
                      disabled={isSavingNotes}
                      className="btn-primary text-xs py-2 px-4 flex items-center gap-2"
                    >
                      {isSavingNotes ? (
                        <>
                          <Loader2 size={14} className="animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save size={14} />
                          Save Notes
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-border-cosmic-blue flex justify-end">
                <button
                  onClick={() => setSelectedSubmission(null)}
                  className="btn-secondary text-sm py-2 px-6"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
