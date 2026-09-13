// Database Types for Altera Summit MUN Platform

// Portal Settings - Application Track Configuration
export type FormMode = 'google_form' | 'custom_builder' | 'external_link';

export interface PortalSettings {
  id: string;
  portal_type: 'secretariat' | 'chair' | 'delegate';
  is_active: boolean;
  form_mode: FormMode;
  form_url: string | null;
  closed_message: string;
  updated_at: string;
}

// Committee Categories
export type CommitteeCategory = 'Flagship' | 'Crisis' | 'Conventional' | 'Regional';

// Committee Status
export type CommitteeStatus = 'active' | 'allocation_full' | 'waitlist_only';

// Committee
export interface Committee {
  id: string;
  name: string;
  abbreviation: string;
  agenda: string;
  category: CommitteeCategory;
  study_guide_url: string | null;
  matrix_url: string | null;
  status: CommitteeStatus;
  is_active: boolean;
  display_order: number;
  // Chair information
  chair_name: string | null;
  chair_photo_url: string | null;
  cochair_name: string | null;
  cochair_photo_url: string | null;
  // Emblem
  emblem_url: string | null;
  created_at: string;
  updated_at: string;
}

// Application Status Pipeline
export type ApplicationStatus = 'Submitted' | 'In Review' | 'Shortlisted' | 'Accepted' | 'Confirmed' | 'Rejected';

// Form Submission
export interface FormSubmission {
  id: string;
  portal_type: 'secretariat' | 'chair' | 'delegate';
  applicant_name: string;
  applicant_email: string;
  applicant_phone: string | null;
  submission_data: Record<string, unknown>;
  status: ApplicationStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// Secretariat Member
export interface SecretariatMember {
  id: string;
  name: string;
  designation: string;
  bio: string | null;
  photo_url: string | null;
  linkedin_url: string | null;
  email: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Event Configuration
export interface EventConfig {
  id: string;
  event_name: string;
  event_tagline: string;
  event_start_at: string | null;
  event_end_at: string | null;
  venue_name: string | null;
  venue_address: string | null;
  venue_map_url: string | null;
  delegate_count: number | null;
  committee_count: number | null;
  days_of_debate: number | null;
  prize_pool_display: string | null;
  announcement_banner_text: string | null;
  announcement_banner_active: boolean;
  created_at: string;
  updated_at: string;
}

// Custom Form Field Types
export type FieldType = 'text' | 'textarea' | 'dropdown' | 'radio' | 'file' | 'date' | 'checkbox';

export interface FormField {
  id: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  required: boolean;
  options?: string[]; // For dropdown/radio
  conditional_on?: {
    field_id: string;
    value: string;
  };
  display_order: number;
}

export interface CustomForm {
  id: string;
  portal_type: 'secretariat' | 'chair' | 'delegate';
  title: string;
  description: string;
  fields: FormField[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Admin User / Roles
export type AdminRole = 'super_admin' | 'director_registrations' | 'committee_director';

export interface AdminUser {
  id: string;
  email: string;
  role: AdminRole;
  created_at: string;
}

// Schedule Item
export interface ScheduleItem {
  id: string;
  day: number; // 1, 2, or 3
  time: string; // HH:MM format
  title: string;
  description: string | null;
  location: string | null;
  display_order: number;
  is_active: boolean;
}

// Schedule Day
export interface ScheduleDay {
  day: number;
  label: string;
  items: ScheduleItem[];
}

// Application Track Info
export interface ApplicationTrack {
  type: 'secretariat' | 'chair' | 'delegate';
  title: string;
  description: string;
  icon: string;
}