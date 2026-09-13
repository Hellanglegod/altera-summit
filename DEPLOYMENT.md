# Altera Summit — Deployment Guide for Vercel

## 🚀 Quick Deployment Steps

### Prerequisites

- [x] GitHub account
- [x] Vercel account (free tier works)
- [x] Supabase project running
- [x] Admin user created with `super_admin` role

---

## Step 1: Prepare Supabase

### 1.1 Create Supabase Project

1. Go to https://supabase.com/dashboard
2. Click **New Project**
3. Fill in:
   - **Name**: `altera-summit-prod`
   - **Database Password**: (generate strong password — save it!)
   - **Region**: Choose closest to your users
4. Wait for provisioning (~2 minutes)

### 1.2 Run Database Migrations

1. Go to **SQL Editor** in Supabase Dashboard
2. Run these scripts **in order**:

**Script 1**: `supabase/schema.sql` (entire file)

- Creates all tables, types, and initial RLS policies

**Script 2**: `supabase/admin-roles.sql` (entire file)

- Creates permission-based admin roles and assignments

**Script 3**: `supabase/committee-assignments.sql` (entire file)

- Adds committee assignment support and permission-based RLS policies

**Script 4**: `supabase/secretariat-portal-ids.sql` (entire file)

- Adds short unique reference codes to admin portals

**Script 5**: `supabase/set-admin-role.sql` (MODIFY FIRST!)

```sql
-- Replace 'your-email@example.com' with YOUR actual admin email
UPDATE auth.users
SET
  raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || '{"role": "super_admin"}'::jsonb,
  raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || '{"role": "super_admin"}'::jsonb
WHERE email = 'admin@alterasummit.com'; -- <-- CHANGE THIS
```

Add your production committees, Secretariat members, schedule, and portal settings
through the admin panel or directly in Supabase after the migrations complete.

### 1.3 Enable Realtime

1. Go to **Database** → **Replication** in Supabase Dashboard
2. Find `portal_settings` table
3. Toggle **Realtime** to ON
4. Click **Save**

### 1.4 Create Admin User

**Option A: Via Supabase Dashboard**

1. Go to **Authentication** → **Users**
2. Click **Add User**
3. Enter email & password
4. Click **Create User**
5. Run `set-admin-role.sql` with this email (Step 1.2, Script 3)

**Option B: Via Signup (after deployment)**

1. Deploy site first
2. Sign up at `/admin/login`
3. Get user ID from Supabase → Authentication → Users
4. Run `set-admin-role.sql` via SQL Editor

### 1.5 Get API Credentials

1. Go to **Settings** → **API** in Supabase Dashboard
2. Copy these values:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon/public key**: `eyJhbGc...` (long string)
3. Save them for Step 2.3

---

## Step 2: Deploy to Vercel

### 2.1 Push Code to GitHub

```bash
cd "C:\Users\Jihan\Documents\MUN\Altera Summit\altera-summit"

# Initialize git (if not done)
git init
git add .
git commit -m "Initial commit: Altera Summit MUN platform"

# Create GitHub repo and push
# (Follow GitHub instructions to create new repo first)
git remote add origin https://github.com/YOUR_USERNAME/altera-summit.git
git branch -M main
git push -u origin main
```

### 2.2 Connect to Vercel

1. Go to https://vercel.com/new
2. Click **Import Git Repository**
3. Select your `altera-summit` repo
4. Click **Import**

### 2.3 Configure Environment Variables

**Before clicking "Deploy"**, add these environment variables:

| Name                            | Value                       | Notes                    |
| ------------------------------- | --------------------------- | ------------------------ |
| `NEXT_PUBLIC_SUPABASE_URL`      | `https://xxxxx.supabase.co` | From Step 1.5            |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGc...`                | From Step 1.5 (anon key) |

**How to add:**

1. In Vercel import screen, expand **Environment Variables**
2. Add each variable with **Name** and **Value**
3. Leave **Target** as "Production, Preview, Development"

### 2.4 Deploy

1. Click **Deploy**
2. Wait 2-3 minutes for build
3. Once complete, you'll see:
   - **Production URL**: `https://altera-summit.vercel.app`
   - Visit site to verify

---

## Step 3: Post-Deployment Verification

### 3.1 Test Public Site

1. Visit your Vercel URL: `https://your-project.vercel.app`
2. Verify:
   - [x] Starfield animation loads
   - [x] Countdown timer shows (to March 15, 2027)
   - [x] Committees section loads data
   - [x] Applications section shows portals
   - [x] Secretariat team loads
   - [x] Schedule timeline loads

**If sections are empty:**

- Run sample data scripts (Step 1.2, Scripts 4-7)
- Refresh page

### 3.2 Test Admin Login (Public Route)

1. Visit: `https://your-project.vercel.app/admin/login`
2. Sign in with your admin credentials
3. Should redirect to `/admin/dashboard`
4. Verify sidebar shows all menu items

**If login fails "Access denied":**

- Verify role is set: Run this in Supabase SQL Editor:
  ```sql
  SELECT id, email,
         raw_app_meta_data->>'role' as app_role,
         raw_user_meta_data->>'role' as user_role
  FROM auth.users;
  ```
- Should show `super_admin` in one of the role columns
- If not, re-run `set-admin-role.sql`

### 3.3 Test Admin Login (Obfuscated Route)

1. Visit: `https://your-project.vercel.app/stellar-gateway-x7k2m9/login`
2. Sign in (should work identically)
3. Note: URL in browser stays as `/stellar-gateway-x7k2m9/*`

### 3.4 Test Admin Portal Features

Visit each admin page and verify functionality:

| Page         | URL                   | Test Actions                                             |
| ------------ | --------------------- | -------------------------------------------------------- |
| Dashboard    | `/admin/dashboard`    | View stats overview                                      |
| Settings     | `/admin/settings`     | Toggle delegate portal ON → verify public site updates   |
| Applications | `/admin/applications` | View submissions (should have samples if you ran script) |
| Form Builder | `/admin/forms`        | Create custom delegate form → publish it                 |
| Committees   | `/admin/committees`   | Add new committee → verify public site shows it          |
| Secretariat  | `/admin/secretariat`  | Add team member → verify public site shows profile       |
| Schedule     | `/admin/schedule`     | Add Day 1 event → verify timeline shows it               |

### 3.5 Test Realtime Sync

**This is the coolest feature — test it!**

1. Open **two browser tabs**:
   - Tab 1: `https://your-project.vercel.app/#applications` (public site)
   - Tab 2: `https://your-project.vercel.app/admin/settings` (admin portal)

2. In **Tab 2 (Admin)**:
   - Toggle "Chair Applications" from Open → Closed
   - Click **Save Changes**

3. Watch **Tab 1 (Public)**:
   - Within 1-2 seconds, the Chair card badge should change from "Open" to "Closed"
   - **No page refresh needed!** ✨

4. Try toggling back and forth — it should sync instantly

**If Realtime doesn't work:**

- Verify Realtime is enabled for `portal_settings` (Step 1.3)
- Check browser console for WebSocket errors
- Verify Supabase URL in environment variables is correct

### 3.6 Test Custom Form Flow (End-to-End)

**Admin Side:**

1. Go to `/admin/forms`
2. Click **Build Form** on Delegate card
3. Add fields:
   - Full Name (text, required)
   - Email (text, required)
   - Why MUN? (textarea, required)
   - Experience Level (dropdown: Beginner, Intermediate, Advanced)
4. Click **Save Form**
5. Go to `/admin/settings`
6. Set Delegate portal to **Custom Builder** mode
7. Enable Delegate portal
8. Click **Save Changes**

**Public Side:**

1. Visit public site: `/#applications`
2. Click **Apply Now** on Delegate card
3. Should navigate to `/apply/delegate`
4. Fill out the custom form
5. Click **Submit Application**
6. Should see success message

**Verify Submission:**

1. Go back to `/admin/applications`
2. Your test submission should appear
3. Change status to "In Review"
4. Add reviewer notes: "Test submission - looks good!"
5. Click **Save Notes**

---

## Step 4: Custom Domain (Optional)

### 4.1 Buy Domain

Buy domain from:

- Namecheap
- GoDaddy
- Cloudflare Registrar
- Google Domains

Example: `alterasummit.com`

### 4.2 Add to Vercel

1. In Vercel Dashboard, go to your project
2. Click **Settings** → **Domains**
3. Enter your domain: `alterasummit.com`
4. Click **Add**

### 4.3 Configure DNS

Vercel will show DNS records to add. In your domain registrar:

**For root domain (`alterasummit.com`):**

```
Type: A
Name: @
Value: 76.76.21.21
```

**For www subdomain:**

```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

### 4.4 Verify

- Wait 5-60 minutes for DNS propagation
- Visit `https://alterasummit.com`
- Vercel auto-provisions SSL certificate
- Both `http` and `https` will work (http redirects to https)

### 4.5 Update Supabase Redirect URLs

1. Go to Supabase Dashboard → **Authentication** → **URL Configuration**
2. Add your custom domain to **Site URL**:
   ```
   https://alterasummit.com
   ```
3. Add to **Redirect URLs**:
   ```
   https://alterasummit.com/**
   https://alterasummit.com/admin/**
   ```
4. Click **Save**

---

## Step 5: Production Checklist

### Security

- [x] Admin route obfuscated (`/stellar-gateway-x7k2m9`)
- [x] RLS policies active on all tables
- [x] Only authenticated admins can modify data
- [x] Anonymous users can only insert to `form_submissions`
- [x] Environment variables set in Vercel (not committed to git)

### Content

- [ ] Replace sample data with real content:
  - Committees (run DELETE then custom INSERT)
  - Secretariat team (add real team members)
  - Schedule (configure actual event dates)
  - Event config (update venue, dates, delegate count)

### SEO (Future Enhancement)

- [ ] Add `metadata` export to `app/layout.tsx`:
  ```typescript
  export const metadata = {
    title: "Altera Summit | Model United Nations Conference",
    description:
      "Forging Destiny Among the Stars - Join us for an elite MUN experience",
    openGraph: {
      images: ["/og-image.png"],
    },
  };
  ```
- [ ] Add OG image at `public/og-image.png`
- [ ] Add `robots.txt` and `sitemap.xml`

### Analytics (Optional)

- [ ] Add Vercel Analytics (built-in, free)
- [ ] Or add Google Analytics via `<Script>` tag

### Performance

- [ ] Verify Lighthouse score > 90
- [ ] Enable Vercel Image Optimization for uploaded photos
- [ ] Consider CDN for large media files

---

## 🐛 Common Deployment Issues

### Build fails: "Module not found: Can't resolve '@/types'"

**Fix:** Verify `tsconfig.json` has correct paths:

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

### Admin login works locally but not on Vercel

**Issue:** Environment variables not set
**Fix:**

1. Go to Vercel Dashboard → Project → Settings → Environment Variables
2. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Redeploy (Deployments tab → ⋯ → Redeploy)

### "Network request failed" on public site

**Issue:** Supabase RLS policies blocking anonymous access
**Fix:** Confirm `schema.sql` and `committee-assignments.sql` were run in order.

### Committees/Schedule/Secretariat show loading forever

**Issue:** No data in tables OR RLS blocking access
**Fix:**

1. Check data exists: `SELECT COUNT(*) FROM committees;`
2. If 0, add the production records through Supabase or the admin panel
3. Verify RLS: `SET ROLE anon; SELECT * FROM committees;`
4. Should return rows (not permission error)

### Realtime not working in production

**Issue:** Realtime not enabled for `portal_settings`
**Fix:** Supabase Dashboard → Database → Replication → Enable for `portal_settings`

---

## 📊 Monitoring & Maintenance

### Vercel Dashboard

Monitor via https://vercel.com/dashboard:

- **Deployment logs**: See build errors
- **Function logs**: See server-side errors
- **Analytics**: Page views, performance

### Supabase Dashboard

Monitor via https://supabase.com/dashboard:

- **Database → Tables**: View/edit data directly
- **Authentication → Users**: Manage admin users
- **Logs**: See API requests, SQL queries
- **Reports**: Database size, API usage

### Regular Tasks

**Weekly:**

- Check `/admin/applications` for new submissions
- Respond to applicants (update status, add notes)

**Monthly:**

- Review Supabase database size (free tier: 500MB)
- Clean up old form submissions if needed
- Update event dates/countdown in `event_config`

**Before Conference:**

- Update schedule with final agenda
- Finalize committee allocations
- Disable application portals (close submissions)

---

## 🎯 Success Metrics

After deployment, you should have:

- ✅ Public landing page live with starfield animation
- ✅ Committees loading from database
- ✅ Application portals with real-time status sync
- ✅ Admin portal accessible via both routes
- ✅ Full CRUD operations on all CMS modules
- ✅ Custom form builder functional
- ✅ End-to-end application submission flow working
- ✅ SSL certificate (https) active
- ✅ Mobile-responsive on all pages

---

## 🆘 Need Help?

If you encounter issues during deployment:

1. **Check Vercel Build Logs**
   - Vercel Dashboard → Deployments → Click on failed deployment → View Logs

2. **Check Browser Console**
   - Open DevTools (F12) → Console tab
   - Look for red errors

3. **Check Supabase Logs**
   - Supabase Dashboard → Logs Explorer
   - Filter by error level

4. **Test Locally First**

   ```bash
   npm run dev
   ```

   - If it works locally but not in production → environment variable issue

5. **Common Commands**

   ```bash
   # Rebuild
   npm run build

   # Clear cache
   rm -rf .next
   npm run dev

   # Verify environment
   node -e "console.log(process.env.NEXT_PUBLIC_SUPABASE_URL)"
   ```

---

## 🎉 You're Live!

Once deployed, share your site:

- Landing page: `https://your-domain.com`
- Admin portal: `https://your-domain.com/stellar-gateway-x7k2m9/login`
- Applications: `https://your-domain.com/#applications`

**Next Steps:**

- Customize content (replace sample data)
- Test with real users (send test application)
- Share with your MUN team
- Promote on social media

**Pro Tip:** Keep the obfuscated admin URL (`/stellar-gateway-x7k2m9`) secret. Share only with trusted secretariat members. The public `/admin` route can be used for general staff.

---

**Deployment Complete!** 🚀✨

Built with Next.js, Supabase, and Claude Code.
