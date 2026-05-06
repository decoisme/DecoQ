# 📊 Dashboard Admin Guide - DecoQ

## 🚀 Cara Mengakses Dashboard

### 1. Jalankan Development Server
```bash
npm run dev
```

### 2. Buka Dashboard
- **URL**: `http://localhost:3000/dashboard`
- **Atau dari homepage**: Klik card "Dashboard Admin"

### 3. Login
Gunakan salah satu credentials:

| Role | Key | Akses |
|------|-----|-------|
| **Admin** | `admin123` | View Only - Hanya lihat data |
| **Superadmin** | `superadmin123` | Full Access - Semua fitur |

---

## 🎯 Fitur Dashboard

### 📈 **1. Overview Tab**

Dashboard utama dengan statistik real-time:

#### Statistics Cards:
- **Total QRIS** 
  - Jumlah QRIS aktif
  - Total keseluruhan (termasuk nonaktif)
  - Icon: Database (biru)

- **Total Verifikasi**
  - Total scan yang dilakukan
  - Verifikasi hari ini
  - Icon: Activity (ungu)

- **Success Rate**
  - Persentase verifikasi berhasil
  - Jumlah verifikasi sukses
  - Icon: TrendingUp (hijau)

- **Minggu Ini**
  - Verifikasi 7 hari terakhir
  - Trend mingguan
  - Icon: Users (kuning)

#### Quick Actions:
- View QRIS Database
- View Verification Logs
- View Audit Logs

---

### 🗄️ **2. QRIS Database Tab**

Kelola semua QRIS yang terdaftar:

#### Fitur:
- ✅ **Search** - Cari merchant atau ID
- ✅ **View Details** - Lihat info lengkap QRIS
- ✅ **Edit** (Superadmin only) - Edit data merchant
- ✅ **Activate/Deactivate** (Superadmin only) - Toggle status
- ✅ **Delete** (Superadmin only) - Hapus permanen

#### Informasi yang Ditampilkan:
- Nama Merchant
- Status (Aktif/Nonaktif)
- Kategori
- Merchant ID
- Tanggal Registrasi
- Notes (jika ada)
- SHA-256 Hash (collapsible)

#### Aksi Menu (Three-dot):
- **Edit Data** - Ubah info merchant
- **Aktifkan/Nonaktifkan** - Toggle status
- **Hapus Permanen** - Delete dengan konfirmasi

---

### 📝 **3. Verification Logs Tab**

Tracking setiap scan QRIS yang dilakukan user:

#### Fitur:
- ✅ **Search** - Cari by merchant, ID, atau hash
- ✅ **Filter Status** - Verified / Failed / All
- ✅ **Pagination** - 20 entries per page
- ✅ **Export CSV** - Download log ke file CSV

#### Kolom Tabel:
| Kolom | Deskripsi |
|-------|-----------|
| **Status** | ✓ Verified / ✗ Failed |
| **Merchant** | Nama merchant (jika verified) |
| **Merchant ID** | NMID merchant |
| **Hash** | SHA-256 hash (16 char preview) |
| **Waktu** | Timestamp scan |
| **IP Address** | IP user yang scan |

#### Export CSV:
- Klik tombol "Export CSV"
- File otomatis download
- Format: `verification-logs-YYYY-MM-DD.csv`
- Includes: ID, Hash, Status, Merchant, Timestamp, IP, Error

---

### 🔒 **4. Audit Logs Tab**

Tracking semua aksi admin:

#### Fitur:
- ✅ **Filter Action** - CREATE / UPDATE / DELETE / ACTIVATE / DEACTIVATE
- ✅ **Filter Role** - Admin / Superadmin
- ✅ **Pagination** - 20 entries per page
- ✅ **Export CSV** - Download audit log

#### Kolom Tabel:
| Kolom | Deskripsi |
|-------|-----------|
| **Admin** | Nama & role admin |
| **Action** | Jenis aksi (color-coded) |
| **Resource** | Type & ID resource |
| **Details** | JSON details (expandable) |
| **Waktu** | Timestamp aksi |
| **IP Address** | IP admin |

#### Action Colors:
- 🟢 **CREATE** - Hijau
- 🔵 **UPDATE** - Biru
- 🔴 **DELETE** - Merah
- 🟢 **ACTIVATE** - Hijau muda
- 🟡 **DEACTIVATE** - Kuning

---

## 🎨 UI Components

### Sidebar Navigation
- **Logo & Brand** - DecoQ branding
- **Admin Info Card** - Role badge & name
- **Menu Items**:
  - 📊 Overview
  - 🗄️ QRIS Database
  - 📝 Verification Logs
  - 🔒 Audit Logs
- **Logout Button** - Keluar dari dashboard

### Responsive Design
- **Desktop**: Sidebar fixed di kiri (280px)
- **Mobile**: Hamburger menu, sidebar slide-in
- **Tablet**: Adaptive layout

---

## 🔐 Role-Based Access Control

### Admin (View Only)
**Dapat:**
- ✅ Lihat dashboard statistics
- ✅ Lihat QRIS database
- ✅ Lihat verification logs
- ✅ Lihat audit logs
- ✅ Export CSV

**Tidak Dapat:**
- ❌ Edit QRIS
- ❌ Activate/Deactivate QRIS
- ❌ Delete QRIS
- ❌ Register QRIS baru

**Restriction Modal:**
Jika Admin mencoba aksi terlarang, muncul modal:
- Icon: Shield dengan X
- Pesan: "Akses Terbatas"
- Info: Fitur hanya untuk Superadmin

### Superadmin (Full Access)
**Dapat:**
- ✅ Semua yang Admin bisa
- ✅ Edit QRIS
- ✅ Activate/Deactivate QRIS
- ✅ Delete QRIS
- ✅ Register QRIS baru

---

## 📥 Export CSV Features

### Verification Logs CSV
**Kolom:**
- ID
- Hash
- Verified (Yes/No)
- Merchant Name
- Merchant ID
- Validated At (ISO timestamp)
- IP Address
- User Agent
- Error Message

**Filter:**
- Status: All / Verified / Failed
- Date Range (coming soon)

### Audit Logs CSV
**Kolom:**
- ID
- Admin Role
- Admin Name
- Action
- Resource Type
- Resource ID
- Created At (ISO timestamp)
- IP Address
- Details (JSON)

**Filter:**
- Action type
- Admin role
- Date range (coming soon)

---

## 🔧 API Endpoints

### Dashboard Stats
```
GET /api/dashboard-stats
Headers: x-admin-key: <admin_key>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "total_qris": 10,
    "total_active_qris": 8,
    "total_verifications": 150,
    "successful_verifications": 145,
    "verifications_today": 12,
    "verifications_week": 89,
    "success_rate": 96.67
  }
}
```

### Verification Logs
```
GET /api/verification-logs?page=1&limit=20&status=all&search=merchant
Headers: x-admin-key: <admin_key>
```

### Audit Logs
```
GET /api/audit-logs?page=1&limit=20&action=CREATE&adminRole=superadmin
Headers: x-admin-key: <admin_key>
```

### Export CSV
```
GET /api/export-logs?type=verification&status=all
GET /api/export-logs?type=audit
Headers: x-admin-key: <admin_key>
```

---

## 🗄️ Database Schema

### Tables Created:

#### 1. `qris_registry` (existing)
- Menyimpan QRIS yang terdaftar

#### 2. `verification_logs` (new)
- Tracking setiap scan
- Fields: hash, qris_id, is_verified, merchant_name, merchant_id, scanned_data, validated_at, user_agent, ip_address, error_message

#### 3. `audit_logs` (new)
- Tracking admin actions
- Fields: admin_role, admin_name, action, resource_type, resource_id, details (JSONB), ip_address, user_agent, created_at

#### 4. `dashboard_stats` (view)
- Aggregated statistics
- Auto-calculated dari tables lain

---

## 🚀 Setup Instructions

### 1. Update Database Schema
Jalankan SQL di Supabase SQL Editor:
```bash
# File: supabase-schema.sql
```

### 2. Environment Variables
Pastikan `.env.local` sudah ada:
```env
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key
ADMIN_KEY=admin123
SUPERADMIN_KEY=superadmin123
```

### 3. Install & Run
```bash
npm install
npm run dev
```

### 4. Access Dashboard
```
http://localhost:3000/dashboard
```

---

## 📱 Mobile Responsive

### Breakpoints:
- **Desktop**: > 768px - Sidebar fixed
- **Mobile**: ≤ 768px - Hamburger menu

### Mobile Features:
- Hamburger menu button (top-left)
- Slide-in sidebar with backdrop
- Responsive tables (horizontal scroll)
- Touch-friendly buttons
- Optimized spacing

---

## 🎯 Best Practices

### Security:
1. **Ganti default keys** di production
2. Gunakan HTTPS untuk production
3. Rate limit API endpoints
4. Validate semua input
5. Sanitize CSV exports

### Performance:
1. Pagination untuk large datasets
2. Lazy load components
3. Debounce search inputs
4. Cache statistics (coming soon)
5. Index database columns

### UX:
1. Loading states untuk semua async operations
2. Error messages yang jelas
3. Confirmation dialogs untuk destructive actions
4. Toast notifications (coming soon)
5. Keyboard shortcuts (coming soon)

---

## 🐛 Troubleshooting

### Dashboard tidak muncul stats
- Cek Supabase connection
- Pastikan view `dashboard_stats` sudah dibuat
- Cek console untuk errors

### Export CSV gagal
- Cek admin key valid
- Pastikan ada data untuk di-export
- Cek browser console

### Sidebar tidak muncul di mobile
- Clear browser cache
- Cek responsive CSS loaded
- Test di browser lain

---

## 🔮 Coming Soon

- [ ] Real-time updates (WebSocket)
- [ ] Advanced filters (date range picker)
- [ ] Chart visualizations
- [ ] Email notifications
- [ ] Bulk operations
- [ ] API rate limiting UI
- [ ] User management
- [ ] Custom reports
- [ ] Dark/Light theme toggle
- [ ] Keyboard shortcuts

---

## 📞 Support

Jika ada masalah atau pertanyaan:
1. Cek dokumentasi ini
2. Cek `ADMIN_CREDENTIALS.md`
3. Cek console browser untuk errors
4. Cek Supabase logs

---

**Happy Monitoring! 🎉**
