# 🚀 Quick Start Guide - DecoQ

## 5-Minute Setup

### Step 1: Install Dependencies (1 min)
```bash
npm install
```

### Step 2: Setup Supabase (2 min)

1. **Create Supabase Project**
   - Go to [supabase.com](https://app.supabase.com)
   - Click "New Project"
   - Wait for setup to complete

2. **Run Database Schema**
   - Open **SQL Editor** in Supabase
   - Choose the correct file:
     - **Fresh database**: Copy-paste `supabase-schema.sql`
     - **Existing database**: Copy-paste `supabase-schema-update.sql`
   - Click **Run**

3. **Get API Keys**
   - Go to **Settings > API**
   - Copy:
     - Project URL
     - `anon` `public` key
     - `service_role` key

### Step 3: Configure Environment (1 min)

```bash
# Copy example file
cp .env.example .env.local
```

Edit `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
ADMIN_KEY=admin123
SUPERADMIN_KEY=superadmin123
```

### Step 4: Run Development Server (1 min)
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 🎯 First Steps

### 1. Login to Dashboard
- Go to `/dashboard`
- Enter: `superadmin123`
- You're in! 🎉

### 2. Register Your First QRIS
**Option A: Via Dashboard**
- Currently: Use legacy admin panel
- Go to `/admin`
- Enter: `superadmin123`
- Fill form and scan/upload QRIS
- Click "Daftarkan QRIS"

**Option B: Via API**
```bash
curl -X POST http://localhost:3000/api/register \
  -H "Content-Type: application/json" \
  -H "x-admin-key: superadmin123" \
  -d '{
    "qrisString": "00020101021126...",
    "merchantName": "Warung Pak Budi",
    "merchantId": "MERCH001",
    "category": "F&B",
    "notes": "Test merchant"
  }'
```

### 3. Test Verification
- Go to `/verify`
- Click "Buka Kamera" or "Upload Gambar"
- Scan the QRIS you just registered
- See result: ✅ Terverifikasi!

### 4. Check Dashboard
- Go to `/dashboard`
- **Overview Tab**: See statistics update
- **QRIS Database Tab**: See your registered QRIS
- **Verification Logs Tab**: See the scan you just did
- **Audit Logs Tab**: See the registration action

---

## 🔑 Default Credentials

| Role | Key | Access |
|------|-----|--------|
| **Admin** | `admin123` | View Only |
| **Superadmin** | `superadmin123` | Full Access |

⚠️ **IMPORTANT**: Change these in production!

---

## 📊 Dashboard Features

### Overview Tab
- Total QRIS (active + inactive)
- Total Verifications
- Success Rate (%)
- Weekly Verifications

### QRIS Database Tab
- Search by merchant name or ID
- View all QRIS details
- Edit (Superadmin only)
- Activate/Deactivate (Superadmin only)
- Delete Permanent (Superadmin only)

### Verification Logs Tab
- See all scan history
- Filter by status (Verified/Failed)
- Search by merchant, ID, or hash
- Export to CSV

### Audit Logs Tab
- Track all admin actions
- Filter by action type
- Filter by admin role
- Export to CSV

---

## 🎨 Pages Overview

| URL | Purpose | Access |
|-----|---------|--------|
| `/` | Homepage | Public |
| `/verify` | Verify QRIS | Public |
| `/admin` | Legacy admin panel | Admin/Superadmin |
| `/dashboard` | Main dashboard | Admin/Superadmin |

---

## 🔧 Common Tasks

### Add New QRIS
1. Go to `/admin`
2. Login with `superadmin123`
3. Fill form:
   - Merchant Name
   - Merchant ID
   - Category
   - Notes (optional)
4. Scan or upload QRIS image
5. Click "Daftarkan QRIS"

### Edit QRIS
1. Go to `/dashboard`
2. Click "QRIS Database" tab
3. Find QRIS in list
4. Click three-dot menu (⋮)
5. Click "Edit Data"
6. Update fields
7. Save

### Deactivate QRIS
1. Go to `/dashboard`
2. Click "QRIS Database" tab
3. Find QRIS in list
4. Click three-dot menu (⋮)
5. Click "Nonaktifkan"
6. Confirm

### Export Logs
1. Go to `/dashboard`
2. Click "Verification Logs" or "Audit Logs" tab
3. Apply filters if needed
4. Click "Export CSV"
5. File downloads automatically

### View Statistics
1. Go to `/dashboard`
2. Click "Overview" tab
3. See real-time statistics cards

---

## 🐛 Troubleshooting

### Build Errors
```bash
# Clear cache and rebuild
rm -rf .next
npm run build
```

### Database Connection Issues
1. Check `.env.local` has correct Supabase URL and keys
2. Verify Supabase project is running
3. Check SQL schema was executed successfully

### Admin Login Not Working
1. Verify `ADMIN_KEY` and `SUPERADMIN_KEY` in `.env.local`
2. Restart dev server after changing env vars
3. Clear browser cache

### QRIS Not Verifying
1. Check QRIS is registered in database
2. Verify QRIS is active (not deactivated)
3. Check hash matches exactly
4. View verification logs for error details

### Stats Not Showing
1. Verify `dashboard_stats` view exists in Supabase
2. Check SQL Editor for errors
3. Ensure tables have data

---

## 📱 Mobile Testing

### Test on Mobile Device
1. Find your local IP: `ipconfig` (Windows) or `ifconfig` (Mac/Linux)
2. Update dev server to listen on all interfaces:
   ```bash
   npm run dev -- -H 0.0.0.0
   ```
3. Open `http://YOUR_IP:3000` on mobile
4. Test:
   - Homepage navigation
   - QR scanner (camera access)
   - Dashboard sidebar (hamburger menu)
   - All responsive layouts

---

## 🚀 Deploy to Production

### Vercel Deployment
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Follow prompts
# Set environment variables in Vercel dashboard
```

### Environment Variables in Vercel
1. Go to Vercel dashboard
2. Select your project
3. Go to **Settings > Environment Variables**
4. Add all variables from `.env.local`
5. Redeploy

### Post-Deployment Checklist
- [ ] Change `ADMIN_KEY` to strong password
- [ ] Change `SUPERADMIN_KEY` to strong password
- [ ] Test all pages work
- [ ] Test admin login
- [ ] Test QRIS verification
- [ ] Test dashboard features
- [ ] Test CSV export
- [ ] Check mobile responsiveness
- [ ] Monitor Supabase usage
- [ ] Setup custom domain (optional)

---

## 📚 Documentation

| File | Purpose |
|------|---------|
| `README.md` | Project overview |
| `QUICK_START.md` | This file - quick setup |
| `DASHBOARD_GUIDE.md` | Complete dashboard guide |
| `SUPABASE_SETUP.md` | Database setup details |
| `ADMIN_CREDENTIALS.md` | Admin credentials info |
| `PROJECT_STATUS.md` | Project completion summary |

---

## 💡 Tips

### Development
- Use `npm run dev` for hot reload
- Check browser console for errors
- Use React DevTools for debugging
- Monitor Supabase logs for API errors

### Performance
- Images are optimized with Next.js Image
- API routes are cached where appropriate
- Database queries use indexes
- Pagination limits large datasets

### Security
- Never commit `.env.local` to git
- Change default admin keys in production
- Use HTTPS in production
- Monitor audit logs regularly
- Review verification logs for suspicious activity

---

## 🎉 You're Ready!

Your DecoQ installation is complete and ready to use.

**Next Steps:**
1. ✅ Register some QRIS codes
2. ✅ Test verification flow
3. ✅ Explore dashboard features
4. ✅ Customize branding (logo, colors)
5. ✅ Deploy to production

**Need Help?**
- Check `DASHBOARD_GUIDE.md` for detailed features
- Check `SUPABASE_SETUP.md` for database issues
- Check browser console for errors
- Check Supabase logs for API issues

---

**Happy Verifying! 🎊**
