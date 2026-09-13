"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { CustomForm, FormField } from "@/types";
import { StarfieldCanvas } from "@/components/ui/StarfieldCanvas";
import {
  Loader2,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  Send,
} from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

export default function ApplyPage() {
  const params = useParams();
  const router = useRouter();
  const track = params.track as "delegate" | "chair" | "secretariat";

  const [form, setForm] = useState<CustomForm | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitStatus, setSubmitStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  useEffect(() => {
    fetchForm();
  }, [track]);

  async function fetchForm() {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("custom_forms")
        .select("*")
        .eq("portal_type", track)
        .eq("is_active", true)
        .single();

      if (error) throw error;
      setForm(data);
    } catch (error) {
      console.error("Error fetching form:", error);
    } finally {
      setIsLoading(false);
    }
  }

  function validateForm(): boolean {
    const newErrors: Record<string, string> = {};

    form?.fields.forEach((field) => {
      if (field.required && !formData[field.id]) {
        newErrors[field.id] = `${field.label} is required`;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validateForm() || !form) return;

    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      // Extract core applicant details
      const nameField = form.fields.find(
        (f) =>
          f.label.toLowerCase().includes("name") && f.type === "text"
      );
      const emailField = form.fields.find(
        (f) =>
          f.label.toLowerCase().includes("email") && f.type === "text"
      );
      const phoneField = form.fields.find(
        (f) =>
          f.label.toLowerCase().includes("phone") && f.type === "text"
      );

      const { error } = await supabase.from("form_submissions").insert({
        portal_type: track,
        applicant_name: nameField ? formData[nameField.id] : "Unknown",
        applicant_email: emailField ? formData[emailField.id] : "no-email@provided.com",
        applicant_phone: phoneField ? formData[phoneField.id] : null,
        submission_data: formData,
        status: "Submitted",
      });

      if (error) throw error;

      setSubmitStatus({
        type: "success",
        message:
          "Application submitted successfully! We'll review your application and get back to you within 7-10 business days.",
      });

      // Clear form
      setFormData({});

      // Redirect to home after 5 seconds
      setTimeout(() => {
        router.push("/#applications");
      }, 5000);
    } catch (error) {
      console.error("Error submitting form:", error);
      setSubmitStatus({
        type: "error",
        message:
          "Failed to submit your application. Please try again or contact us directly.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  function renderField(field: FormField) {
    const value = formData[field.id] || "";
    const error = errors[field.id];

    const commonClasses = `input-cosmic w-full ${
      error ? "border-red-500/50" : ""
    }`;

    switch (field.type) {
      case "text":
        return (
          <input
            type="text"
            id={field.id}
            value={value}
            onChange={(e) =>
              setFormData({ ...formData, [field.id]: e.target.value })
            }
            placeholder={field.placeholder}
            required={field.required}
            className={commonClasses}
          />
        );

      case "textarea":
        return (
          <textarea
            id={field.id}
            rows={4}
            value={value}
            onChange={(e) =>
              setFormData({ ...formData, [field.id]: e.target.value })
            }
            placeholder={field.placeholder}
            required={field.required}
            className={`${commonClasses} resize-none`}
          />
        );

      case "dropdown":
        return (
          <select
            id={field.id}
            value={value}
            onChange={(e) =>
              setFormData({ ...formData, [field.id]: e.target.value })
            }
            required={field.required}
            className={`${commonClasses} bg-nebula-purple-2`}
          >
            <option value="">-- Select an option --</option>
            {field.options?.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        );

      case "radio":
        return (
          <div className="space-y-2">
            {field.options?.map((opt) => (
              <label
                key={opt}
                className="flex items-center gap-2 cursor-pointer text-text-stardust hover:text-gold-primary transition-colors"
              >
                <input
                  type="radio"
                  name={field.id}
                  value={opt}
                  checked={value === opt}
                  onChange={(e) =>
                    setFormData({ ...formData, [field.id]: e.target.value })
                  }
                  required={field.required}
                  className="w-4 h-4 text-gold-primary bg-nebula-purple-1 border-border-cosmic-blue focus:ring-gold-primary"
                />
                <span className="text-sm">{opt}</span>
              </label>
            ))}
          </div>
        );

      case "checkbox":
        return (
          <div className="space-y-2">
            {field.options?.map((opt) => (
              <label
                key={opt}
                className="flex items-center gap-2 cursor-pointer text-text-stardust hover:text-gold-primary transition-colors"
              >
                <input
                  type="checkbox"
                  value={opt}
                  checked={(value as string[])?.includes(opt) || false}
                  onChange={(e) => {
                    const currentValues = (value as string[]) || [];
                    const newValues = e.target.checked
                      ? [...currentValues, opt]
                      : currentValues.filter((v) => v !== opt);
                    setFormData({ ...formData, [field.id]: newValues });
                  }}
                  className="w-4 h-4 rounded text-gold-primary bg-nebula-purple-1 border-border-cosmic-blue focus:ring-gold-primary"
                />
                <span className="text-sm">{opt}</span>
              </label>
            ))}
          </div>
        );

      case "date":
        return (
          <input
            type="date"
            id={field.id}
            value={value}
            onChange={(e) =>
              setFormData({ ...formData, [field.id]: e.target.value })
            }
            required={field.required}
            className={commonClasses}
          />
        );

      case "file":
        return (
          <div className="text-sm text-text-stardust/60 p-4 rounded-lg bg-nebula-purple-1 border border-border-cosmic-blue">
            <p className="mb-2">
              File uploads are not yet supported in this form.
            </p>
            <p className="text-xs">
              Please email your file to{" "}
              <a
                href="mailto:applications@alterasummit.com"
                className="text-gold-primary hover:underline"
              >
                applications@alterasummit.com
              </a>{" "}
              with your name in the subject line.
            </p>
          </div>
        );

      default:
        return null;
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg-void flex items-center justify-center">
        <StarfieldCanvas starCount={150} showConstellations={false} />
        <div className="relative z-10 text-center">
          <Loader2
            size={48}
            className="animate-spin text-gold-primary mx-auto mb-4"
          />
          <p className="text-text-stardust/60">Loading application form...</p>
        </div>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="min-h-screen bg-bg-void flex items-center justify-center p-4">
        <StarfieldCanvas starCount={150} showConstellations={false} />
        <div className="relative z-10 max-w-md text-center card-cosmic p-8">
          <AlertCircle size={48} className="text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-heading font-bold text-text-stardust mb-3">
            Form Not Available
          </h1>
          <p className="text-text-stardust/70 mb-6">
            The custom application form for <strong className="capitalize">{track}</strong> is not currently active.
            Please check back later or contact us directly.
          </p>
          <Link href="/#applications" className="btn-primary inline-flex items-center gap-2">
            <ArrowLeft size={18} />
            Back to Applications
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-void py-16 px-4 relative">
      <StarfieldCanvas starCount={200} showConstellations={true} />

      <div className="container-cosmic max-w-3xl relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <Link
            href="/#applications"
            className="inline-flex items-center gap-2 text-sm text-text-stardust/60 hover:text-gold-primary transition-colors mb-4"
          >
            <ArrowLeft size={16} />
            Back to Application Portals
          </Link>
          <h1 className="text-4xl font-display font-bold text-gold-primary mb-3">
            {form.title}
          </h1>
          <p className="text-text-stardust/80">{form.description}</p>
        </div>

        {/* Success/Error Message */}
        {submitStatus && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mb-6 p-6 rounded-xl flex items-start gap-4 ${
              submitStatus.type === "success"
                ? "bg-green-500/10 border border-green-500/30"
                : "bg-red-500/10 border border-red-500/30"
            }`}
          >
            {submitStatus.type === "success" ? (
              <CheckCircle size={24} className="text-green-400 flex-shrink-0" />
            ) : (
              <AlertCircle size={24} className="text-red-400 flex-shrink-0" />
            )}
            <div className="flex-1">
              <h3
                className={`font-heading font-semibold mb-1 ${
                  submitStatus.type === "success"
                    ? "text-green-300"
                    : "text-red-300"
                }`}
              >
                {submitStatus.type === "success"
                  ? "Application Submitted!"
                  : "Submission Failed"}
              </h3>
              <p
                className={`text-sm ${
                  submitStatus.type === "success"
                    ? "text-green-300/80"
                    : "text-red-300/80"
                }`}
              >
                {submitStatus.message}
              </p>
              {submitStatus.type === "success" && (
                <p className="text-xs text-green-300/60 mt-2">
                  Redirecting you back to the main page in 5 seconds...
                </p>
              )}
            </div>
          </motion.div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="card-cosmic p-8 space-y-6">
          {form.fields
            .sort((a, b) => a.display_order - b.display_order)
            .map((field) => (
              <div key={field.id}>
                <label
                  htmlFor={field.id}
                  className="block text-sm font-medium text-text-stardust mb-2"
                >
                  {field.label}
                  {field.required && (
                    <span className="text-red-400 ml-1">*</span>
                  )}
                </label>
                {renderField(field)}
                {errors[field.id] && (
                  <p className="text-xs text-red-400 mt-1">
                    {errors[field.id]}
                  </p>
                )}
              </div>
            ))}

          {/* Submit Button */}
          <div className="pt-4 border-t border-border-cosmic-blue">
            <button
              type="submit"
              disabled={isSubmitting || submitStatus?.type === "success"}
              className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send size={20} />
                  Submit Application
                </>
              )}
            </button>
            <p className="text-xs text-text-stardust/50 text-center mt-3">
              By submitting this form, you agree to our terms and privacy
              policy.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
