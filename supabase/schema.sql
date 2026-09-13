-- ============================================
-- ALTERA SUMMIT MUN - SUPABASE DATABASE SETUP
-- Run this in your Supabase SQL Editor
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLE: portal_settings
-- Controls application track status and form configuration
-- ============================================
CREATE TABLE IF NOT EXISTS portal_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    portal_type VARCHAR(50) NOT NULL UNIQUE CHECK (portal_type IN ('secretariat', 'chair', 'delegate')),
    is_active BOOLEAN DEFAULT false,
    form_mode VARCHAR(20) DEFAULT 'google_form' CHECK (form_mode IN ('google_form', 'custom_builder', 'external_link')),
    form_url TEXT,
    closed_message TEXT DEFAULT 'Applications are currently closed.',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- TABLE: committees
-- Committee information and configuration
-- ============================================
CREATE TABLE IF NOT EXISTS committees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    abbreviation VARCHAR(20) NOT NULL,
    agenda TEXT NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('Flagship', 'Crisis', 'Conventional', 'Regional')),
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'allocation_full', 'waitlist_only')),
    emblem_url TEXT,
    chair_name VARCHAR(100),
    chair_photo_url TEXT,
    cochair_name VARCHAR(100),
    cochair_photo_url TEXT,
    study_guide_url TEXT,
    matrix_url TEXT,
    is_active BOOLEAN DEFAULT true,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- TABLE: secretariat_members
-- Secretariat team roster
-- ============================================
CREATE TABLE IF NOT EXISTS secretariat_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(150) NOT NULL,
    designation VARCHAR(100) NOT NULL,
    bio TEXT,
    photo_url TEXT,
    linkedin_url TEXT,
    email TEXT,
    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- TABLE: form_submissions
-- Application form submissions
-- ============================================
CREATE TABLE IF NOT EXISTS form_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    portal_type VARCHAR(50) NOT NULL CHECK (portal_type IN ('secretariat', 'chair', 'delegate')),
    applicant_name VARCHAR(150) NOT NULL,
    applicant_email VARCHAR(150) NOT NULL,
    applicant_phone VARCHAR(50),
    submission_data JSONB NOT NULL DEFAULT '{}',
    status VARCHAR(50) DEFAULT 'Submitted' CHECK (status IN ('Submitted', 'In Review', 'Shortlisted', 'Accepted', 'Confirmed', 'Rejected')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- TABLE: event_config
-- Event configuration and settings
-- ============================================
CREATE TABLE IF NOT EXISTS event_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_name VARCHAR(200) DEFAULT 'Altera Summit',
    event_tagline VARCHAR(500) DEFAULT 'Forging Destiny Among the Stars',
    event_start_at TIMESTAMP WITH TIME ZONE,
    event_end_at TIMESTAMP WITH TIME ZONE,
    venue_name VARCHAR(200),
    venue_address TEXT,
    venue_map_url TEXT,
    delegate_count INT DEFAULT 0,
    committee_count INT DEFAULT 0,
    days_of_debate INT DEFAULT 3,
    prize_pool_display VARCHAR(200),
    announcement_banner_text TEXT,
    announcement_banner_active BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- TABLE: custom_forms
-- Custom form builder configurations
-- ============================================
CREATE TABLE IF NOT EXISTS custom_forms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    portal_type VARCHAR(50) NOT NULL UNIQUE CHECK (portal_type IN ('secretariat', 'chair', 'delegate')),
    title VARCHAR(200) NOT NULL DEFAULT 'Application Form',
    description TEXT,
    fields JSONB NOT NULL DEFAULT '[]',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- TABLE: schedule_items
-- Conference schedule items
-- ============================================
CREATE TABLE IF NOT EXISTS schedule_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    day INT NOT NULL CHECK (day IN (1, 2, 3)),
    time TIME NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    location VARCHAR(200),
    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE portal_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE committees ENABLE ROW LEVEL SECURITY;
ALTER TABLE secretariat_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_items ENABLE ROW LEVEL SECURITY;

-- Portal Settings - Public read, Auth write
CREATE POLICY "Public can read portal settings" ON portal_settings
    FOR SELECT USING (true);

CREATE POLICY "Admins can update portal settings" ON portal_settings
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE email = auth.jwt() ->> 'email'
            AND raw_app_meta_data ->> 'role' IN ('super_admin', 'director_registrations')
        )
    );

-- Committees - Public read, Auth write
CREATE POLICY "Public can read active committees" ON committees
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage committees" ON committees
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE email = auth.jwt() ->> 'email'
            AND raw_app_meta_data ->> 'role' IN ('super_admin', 'committee_director')
        )
    );

-- Secretariat Members - Public read, Auth write
CREATE POLICY "Public can read secretariat" ON secretariat_members
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage secretariat" ON secretariat_members
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE email = auth.jwt() ->> 'email'
            AND raw_app_meta_data ->> 'role' IN ('super_admin')
        )
    );

-- Form Submissions - Auth read/write only
CREATE POLICY "Admins can manage submissions" ON form_submissions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE email = auth.jwt() ->> 'email'
            AND raw_app_meta_data ->> 'role' IN ('super_admin', 'director_registrations')
        )
    );

-- Event Config - Public read, Auth write
CREATE POLICY "Public can read event config" ON event_config
    FOR SELECT USING (true);

CREATE POLICY "Admins can update event config" ON event_config
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE email = auth.jwt() ->> 'email'
            AND raw_app_meta_data ->> 'role' IN ('super_admin')
        )
    );

-- Custom Forms - Auth read/write
CREATE POLICY "Admins can manage custom forms" ON custom_forms
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE email = auth.jwt() ->> 'email'
            AND raw_app_meta_data ->> 'role' IN ('super_admin')
        )
    );

-- Schedule Items - Public read, Auth write
CREATE POLICY "Public can read schedule" ON schedule_items
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage schedule" ON schedule_items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE email = auth.jwt() ->> 'email'
            AND raw_app_meta_data ->> 'role' IN ('super_admin')
        )
    );

-- ============================================
-- INSERT DEFAULT DATA
-- ============================================

-- Default portal settings (all closed by default)
INSERT INTO portal_settings (portal_type, is_active, form_mode, closed_message) VALUES
    ('secretariat', false, 'google_form', 'Secretariat applications are currently closed. Stay tuned for the next cycle!'),
    ('chair', false, 'google_form', 'Chair applications are currently closed. Check back soon!'),
    ('delegate', false, 'custom_builder', 'Delegate registrations are not yet open. Register your interest to be notified!')
ON CONFLICT (portal_type) DO NOTHING;

-- Default event configuration
INSERT INTO event_config (event_start_at, delegate_count, committee_count) VALUES
    (NOW() + INTERVAL '90 days', 500, 12)
ON CONFLICT DO NOTHING;

-- Sample committees (delete or modify as needed)
INSERT INTO committees (name, abbreviation, agenda, category, status, display_order) VALUES
    ('United Nations Security Council', 'UNSC', 'Addressing Global Security Challenges in the 21st Century', 'Flagship', 'active', 1),
    ('United Nations General Assembly', 'UNGA', 'Sustainable Development Goals: Progress and Challenges', 'Flagship', 'active', 2),
    ('Historic Crisis Committee', 'HCC', 'The Fall of Constantinople, 1453', 'Crisis', 'active', 3),
    ('World Health Organization', 'WHO', 'Pandemic Preparedness and Global Health Security', 'Conventional', 'active', 4)
ON CONFLICT DO NOTHING;

-- Sample secretariat members
INSERT INTO secretariat_members (name, designation, display_order) VALUES
    ('Secretary-General Name', 'Secretary-General', 1),
    ('Director-General Name', 'Director-General', 2),
    ('Under-Secretary-General Name', 'USG of Technical Operations', 3)
ON CONFLICT DO NOTHING;

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_committees_category ON committees(category);
CREATE INDEX IF NOT EXISTS idx_committees_status ON committees(status);
CREATE INDEX IF NOT EXISTS idx_form_submissions_portal_type ON form_submissions(portal_type);
CREATE INDEX IF NOT EXISTS idx_form_submissions_status ON form_submissions(status);
CREATE INDEX IF NOT EXISTS idx_schedule_items_day ON schedule_items(day);

-- ============================================
-- TRIGGER FOR UPDATED_AT
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_portal_settings_updated_at
    BEFORE UPDATE ON portal_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_committees_updated_at
    BEFORE UPDATE ON committees
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_secretariat_members_updated_at
    BEFORE UPDATE ON secretariat_members
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_form_submissions_updated_at
    BEFORE UPDATE ON form_submissions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_event_config_updated_at
    BEFORE UPDATE ON event_config
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_custom_forms_updated_at
    BEFORE UPDATE ON custom_forms
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_schedule_items_updated_at
    BEFORE UPDATE ON schedule_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- STORAGE BUCKETS (Run in Supabase Dashboard)
-- ============================================
/*
Go to Supabase Dashboard > Storage and create:
1. 'committee-docs' - For study guides, matrices, etc.
2. 'secretariat-photos' - For secretariat member photos
3. 'committee-emblem' - For committee emblems
4. 'submissions' - For uploaded files (CVs, etc.)
*/

-- ============================================
-- COMPLETION MESSAGE
-- ============================================
SELECT 'Database setup complete! Remember to:' as message,
       '1. Create Storage buckets in Supabase Dashboard' as step1,
       '2. Set up Authentication providers (Email/Password)' as step2,
       '3. Create admin user accounts manually' as step3,
       '4. Add your environment variables to .env.local' as step4;