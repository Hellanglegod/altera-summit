# Altera Summit - MUN Web Platform

> **Forging Destiny Among the Stars**
>
> An elite Model United Nations conference platform blending cosmology with classical antiquity.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Supabase account (free tier works great)
- Git

### 1. Setup Environment Variables

```bash
cp .env.local.example .env.local
```

Then fill in your Supabase credentials:

```
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
ADMIN_ROUTE=
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 2. Initialize Supabase Database

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Create a new project
3. Go to SQL Editor and run the script from `supabase/schema.sql`
4. Create Storage buckets:
   - `committee-docs`
   - `secretariat-photos`
   - `committee-emblem`
   - `submissions`

### 3. Install Dependencies

```bash
npm install
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📁 Project Structure

```
altera-summit/
├── app/                          # Next.js App Router
│   ├── page.tsx                 # Home page
│   ├── layout.tsx               # Root layout with fonts
│   ├── globals.css              # Design system & global styles
│   └── [admin-route]/           # Admin portal (dynamic route)
│
├── components/
│   ├── layout/                  # Global layout components
│   │   ├── Header.tsx
│   │   └── Footer.tsx
│   ├── sections/                # Page sections
│   │   ├── Hero.tsx
│   │   ├── About.tsx
│   │   ├── Committees.tsx
│   │   ├── Applications.tsx
│   │   ├── Secretariat.tsx
│   │   └── Schedule.tsx
│   ├── ui/                      # Reusable UI components
│   │   ├── StarfieldCanvas.tsx
│   │   ├── CountdownTimer.tsx
│   │   └── ...
│   └── admin/                   # Admin portal components
│       ├── AuthGuard.tsx
│       ├── Dashboard.tsx
│       ├── FormBuilder.tsx
│       └── ...
│
├── lib/
│   ├── supabase.ts             # Supabase client
│   └── utils.ts                # Utility functions
│
├── types/
│   └── index.ts                # TypeScript type definitions
│
├── supabase/
│   └── schema.sql              # Database schema
│
├── public/                      # Static assets
└── .env.local                  # Environment variables (local)
```

---

## 🎨 Design System

### Color Palette (CSS Variables)

```css
--bg-void: #06080c /* Primary background */ --nebula-purple-1: #130d2a
  /* Section overlay */ --nebula-purple-2: #231847 /* Card backgrounds */
  --gold-primary: #d4af37 /* Headings & accents */ --bronze-accent: #9a7b38
  /* Hover states */ --text-stardust: #e2e8f0 /* Body text */
  --border-cosmic-blue: #1e293b /* Borders */;
```

### Typography

- **Display/Headings:** Cinzel Decorative (decorative, use sparingly)
- **Secondary Headings:** Cormorant Garamond (elegant serif)
- **Body/UI:** Inter (clean, modern sans-serif)

### Utility Classes

- `.btn-primary` - Primary button
- `.btn-secondary` - Secondary button
- `.card-cosmic` - Card component
- `.glass` / `.glass-dark` - Glassmorphism effect
- `.glow-gold` - Gold glow effect
- `.badge-active` / `.badge-closed` - Status badges

---

## 🔐 Admin Portal

The admin portal is accessible at a **non-guessable route** (default: `/stellar-gateway-x7k2m9`).

### Features

- 🔑 Authentication with Supabase Auth
- 👥 Role-Based Access Control (Super Admin, Director of Registrations, Committee Director)
- 🎚️ Master application toggle switches
- 🏗️ Custom form builder with conditional logic
- 📊 Application submissions management
- 📥 CSV/XLSX/PDF export
- 📝 Content CMS (committees, roster, announcements)

### Creating Admin Users

1. In Supabase, go to **Authentication > Users**
2. Invite a new user (or create manually)
3. After they sign up, go to their user profile
4. Add to `raw_app_meta_data`:
   ```json
   {
     "role": "super_admin"
   }
   ```

---

## 📱 Responsive Design

- **Mobile:** 360px+
- **Tablet:** 768px+
- **Desktop:** 1024px+

All components are mobile-first and fully responsive.

---

## ♿ Accessibility

- ✅ WCAG 2.1 Level AA compliant
- ✅ `prefers-reduced-motion` support (disables animations)
- ✅ Semantic HTML structure
- ✅ ARIA labels where needed
- ✅ Color contrast ratios 4.5:1+
- ✅ Keyboard navigation support

---

## 🚢 Deployment to Vercel

### 1. Connect GitHub Repository

```bash
git init
git add .
git commit -m "Initial commit"
git push -u origin main
```

### 2. Connect to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your GitHub repository
4. Add environment variables (same as `.env.local`)
5. Deploy!

### 3. Configure Custom Domain

In Vercel project settings > Domains, add your custom domain.

---

## 📊 Database Schema

### Key Tables

- **portal_settings** - Application track configuration (ON/OFF, form mode)
- **committees** - Committee info, chairs, agendas
- **secretariat_members** - Team roster
- **form_submissions** - Application submissions with status pipeline
- **event_config** - Event settings (dates, counters, announcements)
- **custom_forms** - Form builder configurations
- **schedule_items** - Conference schedule by day

All tables have:

- ✅ UUID primary keys
- ✅ Row-Level Security (RLS) policies
- ✅ Automatic `updated_at` triggers
- ✅ Timestamps for auditing

---

## 🛠️ Development Scripts

```bash
# Start dev server with hot reload
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Type check
npx tsc --noEmit

# Format code
npm run format
```

---

## 🔑 Environment Variables Reference

| Variable                        | Description                   | Required |
| ------------------------------- | ----------------------------- | -------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | Supabase project URL          | ✅       |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key        | ✅       |
| `SUPABASE_SERVICE_ROLE_KEY`     | Supabase service role key     | ✅       |
| `ADMIN_ROUTE`                   | Obfuscated admin portal route | ✅       |
| `NEXT_PUBLIC_SITE_URL`          | Site URL (for redirects)      | ✅       |

---

## 📚 Key Features Implemented

### Phase 1: Foundation ✅

- [x] Design system with cosmic palette
- [x] TypeScript types
- [x] Supabase schema
- [x] Header & Footer components
- [x] Interactive starfield canvas
- [x] Hero section with countdown timer

### Phase 2: Public Site (In Progress)

- [ ] About section with video/poster
- [ ] Committees hub with filterable grid
- [ ] Applications hub (3-track system)
- [ ] Secretariat roster
- [ ] Schedule & venue

### Phase 3: Admin Portal (Pending)

- [ ] Authentication & authorization
- [ ] Master toggle dashboard
- [ ] Custom form builder
- [ ] Submissions management
- [ ] CMS modules

### Phase 4: Testing & Launch (Pending)

- [ ] Mobile responsiveness testing
- [ ] Security audit
- [ ] Performance optimization
- [ ] Vercel deployment

---

## 📞 Support & Questions

For issues or questions:

1. Check the documentation in `/docs`
2. Review the database schema in `/supabase/schema.sql`
3. Check Supabase documentation: https://supabase.com/docs

---

## 📄 License

This project is proprietary software created for Altera Summit.

---

**Last Updated:** September 13, 2026  
**Version:** 0.1.0 (Foundation Phase Complete)
