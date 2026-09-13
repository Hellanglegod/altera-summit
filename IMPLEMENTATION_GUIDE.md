# Altera Summit — Complete MUN Platform Implementation Summary

## 🎯 Project Overview
**Altera Summit: Forging Destiny Among the Stars**

A full-stack Model United Nations web platform featuring:
- Cosmic-themed public landing page with interactive starfield animations
- Secure secretariat admin portal with role-based access control
- Complete CMS for managing committees, applications, secretariat team, and schedule
- Custom form builder system for application portals
- Real-time application status tracking via Supabase

---

## 📁 Project Structure

```
altera-summit/
├── app/
│   ├── page.tsx                          # Main landing page
│   ├── layout.tsx                        # Root layout with global styles
│   ├── apply/[track]/page.tsx            # Public custom form submission pages
│   └── admin/
│       ├── layout.tsx                    # Admin layout with auth wrapper
│       ├── login/page.tsx                # Admin login (dual route support)
│       ├── dashboard/page.tsx            # Admin dashboard overview
│       ├── settings/page.tsx             # Master portal toggle dashboard
│       ├── applications/page.tsx         # Submissions management (NEW)
│       ├── committees/page.tsx           # Committees CMS (NEW)
│       ├── secretariat/page.tsx          # Secretariat team CMS (NEW)
│       ├── schedule/page.tsx             # Schedule CMS (NEW)
│       └── forms/page.tsx                # Custom form builder (NEW)
├── components/
│   ├── sections/
│   │   ├── Hero.tsx                      # Starfield hero with countdown
│   │   ├── About.tsx                     # Summit stats & vision
│   │   ├── Committees.tsx                # Filterable committee grid
│   │   ├── Applications.tsx              # 3-track application hub with Realtime
│   │   ├── Secretariat.tsx               # Team cards
│   │   └── Schedule.tsx                  # 3-day interactive timeline
│   ├── admin/
│   │   ├── AdminLayout.tsx               # Sidebar navigation
│   │   ├── AdminGuard.tsx                # Client-side auth wrapper
│   │   └── AuthProvider.tsx              # Supabase auth context
│   └── ui/
│       └── StarfieldCanvas.tsx           # HTML5 Canvas starfield
├── supabase/
│   ├── schema.sql                        # Complete database schema
│   ├── COMPLETE-FIX-all-tables.sql       # RLS policy fixes
│   ├── set-admin-role.sql                # Admin role assignment script
│   ├── sample-committees.sql             # Sample committee data
│   ├── sample-secretariat.sql            # Sample team data
│   ├── sample-schedule.sql               # Sample 3-day schedule
│   └── sample-applications.sql           # Sample applicant submissions (NEW)
├── types/
│   └── index.ts                          # TypeScript interfaces
├── lib/
│   ├── supabase.ts                       # Supabase client
│   └── utils.ts                          # Utility functions (formatDate, cn, etc.)
├── styles/
│   └── globals.css                       # Tailwind + custom CSS variables
└── next.config.ts                        # Route rewrites for obfuscated admin path
```

---

## 🎨 Design System

### Color Palette (CSS Variables)
```css
--bg-void: #06080c              /* Deep space background */
--nebula-purple-1: #1a1625      /* Dark nebula */
--nebula-purple-2: #2d1b3d      /* Medium nebula */
--gold-primary: #d4af37         /* Stellar gold accent */
--text-stardust: #e8e6e3        /* Primary text */
--border-cosmic-blue: #2c3e50   /* Borders & dividers */
```

### Typography
- **Display**: Space Grotesk (headings, hero)
- **Heading**: Inter (section titles)
- **Body**: System fonts (content)

### Components
- `card-cosmic`: Glassmorphism cards with glow effects
- `btn-primary`: Gold gradient buttons with hover animations
- `btn-secondary`: Outlined buttons
- `input-cosmic`: Dark input fields with cosmic borders
- `badge-active/closed/waitlist/full`: Status badges

---

## 🔐 Authentication & Authorization

### Admin Roles
1. **super_admin**: Full access (all CRUD operations, portal settings, event config)
2. **director_registrations**: Applications + submissions management
3. **committee_director**: Committee CMS access

### Dual Route Support
Both routes work identically:
- `/admin/*` — Public-facing admin URL
- `/stellar-gateway-x7k2m9/*` — Obfuscated secret route

Configured via `next.config.ts` rewrites.

### Auth Flow
1. User signs in at `/admin/login` (or obfuscated path)
2. `AuthProvider.tsx` checks `app_metadata.role` OR `user_metadata.role`
3. `AdminGuard.tsx` protects routes client-side (prevents server redirect loops)
4. Session persists across page reloads via `supabase.auth.getSession()`

### Setting Admin Role
Run `supabase/set-admin-role.sql` after replacing `your-email@example.com`:
```sql
UPDATE auth.users
SET
  raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || '{"role": "super_admin"}'::jsonb,
  raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || '{"role": "super_admin"}'::jsonb
WHERE email = 'your-email@example.com';
```

---

## 📊 Database Schema

### Tables

#### `committees`
- Council information (name, abbreviation, agenda, category, status)
- Chair assignments (chair_name, cochair_name, photo URLs)
- Study guide & matrix URLs
- Display order & visibility (`is_active`)
- **RLS**: Public read (active only), authenticated write (super_admin)

#### `secretariat_members`
- Team profiles (name, designation, bio, photo, LinkedIn, email)
- Display order & visibility
- **RLS**: Public read (active only), authenticated write (super_admin)

#### `schedule_items`
- 3-day summit schedule (day, time, title, description, location)
- Display order & visibility
- **RLS**: Public read (active only), authenticated write (super_admin)

#### `portal_settings`
- Application track toggles (delegate, chair, secretariat)
- Form mode selection (`google_form`, `external_link`, `custom_builder`)
- Form URL & closed messages
- **RLS**: Public read, authenticated write (super_admin, director_registrations)

#### `form_submissions`
- Applicant submissions (name, email, phone, submission_data JSONB)
- Status pipeline: `Submitted → In Review → Shortlisted → Accepted → Confirmed | Rejected`
- Internal reviewer notes
- **RLS**: Anonymous insert (public submissions), authenticated read/update (admins)

#### `custom_forms`
- Custom form builder configurations per portal track
- Fields array (JSONB): label, type, required, options, display_order
- **RLS**: Authenticated only (super_admin)

#### `event_config`
- Global summit metadata (name, tagline, dates, venue, stats)
- Announcement banner
- **RLS**: Public read, authenticated write (super_admin)

---

## 🛠️ Admin Portal Features

### 1. Dashboard (`/admin/dashboard`)
- Quick stats overview
- Recent submissions
- System status

### 2. Portal Settings (`/admin/settings`)
**Master Toggle Dashboard**
- Enable/disable each application track (Delegate, Chair, Secretariat)
- Switch form mode per track:
  - **Google Form**: External Google Form URL
  - **External Link**: Any custom URL
  - **Custom Builder**: Use built-in form builder
- Set custom closed messages
- Real-time sync to public site

### 3. Applications Management (`/admin/applications`) ✨ NEW
**Comprehensive Submissions Dashboard**
- View all applicant submissions across all tracks
- Filter by:
  - Track (delegate, chair, secretariat)
  - Status (Submitted, In Review, Shortlisted, Accepted, Confirmed, Rejected)
  - Search by name/email/phone
- Status pipeline with dropdown selectors
- Applicant detail modal:
  - Contact information
  - Form response data
  - Status pipeline selector
  - Internal reviewer notes (save/edit)
- Bulk export to CSV
- Delete submissions (with confirmation)
- Permission: `super_admin`, `director_registrations`

### 4. Committees CMS (`/admin/committees`) ✨ NEW
**Council Configuration Manager**
- Grid view of all committees
- Filter by category (Flagship, Crisis, Conventional, Regional)
- Search by name/agenda
- Create/Edit committee form:
  - Name, abbreviation, agenda
  - Category & allocation status (Active, Full, Waitlist)
  - Chair & Co-Chair assignments
  - Study guide & matrix URLs
  - Display order
  - Visibility toggle
- Inline status dropdown (Active, Allocation Full, Waitlist Only)
- Show/hide on public site
- Delete committees
- Permission: `super_admin`, `committee_director`

### 5. Secretariat Team CMS (`/admin/secretariat`) ✨ NEW
**Team Profile Manager**
- List view of all secretariat members
- Create/Edit member profiles:
  - Name & designation (e.g., Secretary-General)
  - Bio (optional)
  - Photo URL
  - Email & LinkedIn URL
  - Display order
  - Visibility toggle
- Reorder members (up/down arrows)
- Show/hide on public site
- Delete members
- Permission: `super_admin`

### 6. Schedule CMS (`/admin/schedule`) ✨ NEW
**Event Timeline Builder**
- Day tabs (Day 1, 2, 3)
- Timeline view with chronological events
- Create/Edit schedule items:
  - Day & time (HH:MM)
  - Event title & description
  - Location
  - Display order
  - Visibility toggle
- Show/hide on public timeline
- Delete events
- Permission: `super_admin`

### 7. Custom Form Builder (`/admin/forms`) ✨ NEW
**Drag-and-Drop Form Designer**
- Build custom application forms per track
- Field types supported:
  - Short Text
  - Long Text (Textarea)
  - Dropdown
  - Radio Choice
  - Checkbox (multi-select)
  - Date
  - File Upload (placeholder with email fallback)
- Field configuration:
  - Label & placeholder
  - Required toggle
  - Options (for dropdown/radio/checkbox)
  - Display order (reorderable)
- Form metadata (title, description)
- Publish toggle (activate form on public site)
- Forms saved to `custom_forms` table
- Permission: `super_admin`

---

## 🌐 Public Site Features

### 1. Hero Section
- **Interactive Starfield Canvas** (HTML5 Canvas)
  - 300 animated stars with parallax effect
  - Constellation lines with glow effects
  - Mouse proximity glow on hover
- Event countdown timer (live to March 15, 2027)
- Primary CTA button
- Summit tagline: "Forging Destiny Among the Stars"

### 2. About Section
- Summit vision statement
- Live statistics (delegate count, committee count, prize pool)
- Scroll-triggered entrance animations (Framer Motion)

### 3. Committees Hub
- Filterable grid by category (All, Flagship, Crisis, Conventional, Regional)
- Committee cards:
  - Abbreviation & full name
  - Agenda description
  - Chair & Co-Chair names
  - Status badges (Active, Full, Waitlist)
  - Study Guide & Matrix links (external)
- Data fetched from `committees` table

### 4. Applications Portal
- **3-Track Application System**:
  - **Delegate**: Blue accent
  - **Chair**: Purple accent
  - **Secretariat**: Gold accent
- Real-time status sync via **Supabase Realtime Channels**
- Dynamic behavior per `portal_settings`:
  - **Open**: "Apply Now" button
    - Google Form/External Link: Opens in new tab
    - Custom Builder: Navigates to `/apply/[track]`
  - **Closed**: Shows custom closed message
- Badge indicators (Open/Closed)

### 5. Custom Application Forms (`/apply/[track]`) ✨ NEW
- Dynamic form rendering based on `custom_forms` configuration
- Supports all field types from Form Builder
- Client-side validation (required fields)
- Form submission to `form_submissions` table
- Success confirmation with auto-redirect (5s)
- Error handling & retry
- Cosmic-themed design matching main site
- Back to Applications link

### 6. Secretariat Section
- Team member cards with:
  - Photo (or initials fallback)
  - Name & designation
  - Bio excerpt
  - LinkedIn link (external)
- Hover animations & glassmorphism effects

### 7. Schedule Section
- Interactive 3-day timeline
- Day tabs
- Timeline events with:
  - Time indicator
  - Event title & description
  - Location (if provided)
- Visual timeline connector line

---

## 🚀 Deployment Checklist

### Environment Variables
Create `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### Supabase Setup
1. Create new Supabase project
2. Run SQL scripts in order:
   ```
   supabase/schema.sql
   supabase/COMPLETE-FIX-all-tables.sql
   supabase/set-admin-role.sql (replace email)
   supabase/sample-committees.sql
   supabase/sample-secretariat.sql
   supabase/sample-schedule.sql
   supabase/sample-applications.sql (optional)
   ```
3. Enable Realtime for `portal_settings` table:
   - Supabase Dashboard → Database → Replication → Enable for `portal_settings`

### Admin User Setup
1. Sign up a user via Supabase Dashboard or Auth UI
2. Run `set-admin-role.sql` with your email
3. Verify role assignment:
   ```sql
   SELECT id, email, 
          raw_app_meta_data->>'role' as app_role, 
          raw_user_meta_data->>'role' as user_role
   FROM auth.users;
   ```

### Build & Deploy
```bash
npm run build
```

Deploy to **Vercel**:
1. Connect GitHub repository
2. Add environment variables (Supabase URL & key)
3. Deploy
4. Verify both `/admin` and `/stellar-gateway-x7k2m9` routes work

### Post-Deployment
1. Test admin login at both routes
2. Verify RLS policies (public can read active committees, but not submissions)
3. Test Realtime sync (toggle portal status in admin → see change on public site)
4. Test custom form submission flow
5. Configure custom domain (optional)

---

## 🧪 Testing the System

### Test Admin Portal
1. Navigate to `/admin/login` or `/stellar-gateway-x7k2m9/login`
2. Sign in with super_admin account
3. **Settings**: Toggle delegate portal on/off → verify public site updates in real-time
4. **Committees**: Add a new committee → verify it appears on public site
5. **Secretariat**: Add a team member → verify profile appears
6. **Schedule**: Add Day 1 event → verify timeline shows it
7. **Form Builder**: Create custom delegate form with 5 fields → publish it
8. **Settings**: Switch delegate portal to "Custom Builder" mode

### Test Public Site
1. Visit homepage → verify starfield animation & countdown
2. Scroll to Committees → filter by "Crisis"
3. Scroll to Applications → verify delegate portal shows "Open" badge
4. Click "Apply Now" on delegate → should navigate to `/apply/delegate`
5. Fill out custom form → submit
6. Return to admin → Applications page → verify submission appears
7. Change status to "In Review" → add reviewer notes → save

### Test Realtime Sync
1. Open public site in one tab
2. Open admin settings in another tab
3. Toggle chair portal to "Closed" in admin
4. Watch public site update instantly (no refresh needed)

---

## 📦 Tech Stack Summary

### Frontend
- **Next.js 16** (App Router, React 19, Turbopack)
- **TypeScript** (strict mode)
- **Tailwind CSS v4** (custom CSS variables)
- **Framer Motion** (scroll animations, modals)
- **Lucide React** (icons)

### Backend & Database
- **Supabase** (PostgreSQL, Auth, Realtime)
- **Row Level Security (RLS)** for data protection
- **Postgres Functions** for auth checks

### Hosting & Deployment
- **Vercel** (recommended)
- Serverless functions via Next.js API routes (future)

### Key Libraries
- `@supabase/supabase-js` — Supabase client
- `clsx` — Conditional class merging
- `next/navigation` — App Router navigation

---

## 🎯 Next Steps (Optional Enhancements)

### Task #12: Deploy to Vercel ⏳
- Connect GitHub repository
- Configure environment variables
- Set up custom domain
- Configure production Supabase instance

### Future Features
1. **Email Notifications**
   - Send confirmation emails on application submission
   - Notify applicants of status changes
   - Implement via Supabase Edge Functions + Resend/SendGrid

2. **Applicant Dashboard**
   - Let applicants check their status via unique link
   - Upload additional documents
   - Accept/decline offers

3. **Advanced Analytics**
   - Application funnel visualization
   - Geographic distribution maps
   - Committee allocation dashboard

4. **Payment Integration**
   - Delegate registration fees (Stripe)
   - Early bird discount system
   - Refund management

5. **Multi-Language Support**
   - i18n for public site
   - Arabic/French translations (common in MUN)

6. **WhatsApp Integration**
   - Status notifications via WhatsApp API
   - Bot for common queries

---

## 🐛 Troubleshooting

### "Access denied. You do not have admin privileges."
- Run `set-admin-role.sql` with correct email
- Verify role is set in `auth.users` table
- Check both `app_metadata` and `user_metadata`

### Committees/Schedule/Secretariat not showing on public site
- Run `COMPLETE-FIX-all-tables.sql` to fix RLS policies
- Verify `is_active = true` for items
- Check Supabase logs for permission errors

### Realtime not syncing
- Enable Realtime for `portal_settings` table in Supabase Dashboard
- Check browser console for WebSocket errors
- Verify Supabase URL is correct in `.env.local`

### 404 on `/stellar-gateway-x7k2m9/login`
- Verify `next.config.ts` has correct rewrites
- Rebuild app: `npm run build`
- Clear `.next` cache and restart dev server

### Custom form not appearing at `/apply/[track]`
- Verify form `is_active = true` in `custom_forms` table
- Check `portal_type` matches URL parameter (delegate/chair/secretariat)
- Verify RLS policy allows anonymous read of active forms

---

## 📄 License & Credits

Built for **Altera Summit** MUN Conference.

### Design Inspiration
- Cosmic/space theme
- Glassmorphism UI trends
- Modern MUN conference websites

### Technologies
- Next.js by Vercel
- Supabase (open-source Firebase alternative)
- Tailwind CSS
- Framer Motion

---

## 📞 Support

For technical questions or deployment assistance, refer to:
- Next.js Documentation: https://nextjs.org/docs
- Supabase Documentation: https://supabase.com/docs
- This implementation guide

**Built with Claude Code** 🤖
