# Admin Credentials & Role-Based Access

## 🔐 Tingkatan Admin

DecoQ memiliki 2 tingkatan admin dengan hak akses yang berbeda:

### 1. **Admin** (View Only)
- **Hak Akses**: Hanya dapat melihat database QRIS
- **Tidak Dapat**:
  - Mendaftarkan QRIS baru
  - Mengedit data QRIS
  - Mengaktifkan/menonaktifkan QRIS
  - Menghapus QRIS
- **Default Key**: `admin123`
- **Environment Variable**: `ADMIN_KEY`

### 2. **Superadmin** (Full Access)
- **Hak Akses**: Dapat melakukan semua operasi
- **Dapat**:
  - Melihat database QRIS
  - Mendaftarkan QRIS baru
  - Mengedit data QRIS
  - Mengaktifkan/menonaktifkan QRIS
  - Menghapus QRIS secara permanen
- **Default Key**: `superadmin123`
- **Environment Variable**: `SUPERADMIN_KEY`

---

## 🚀 Cara Menggunakan

### 1. **Setup Environment Variables**

Tambahkan ke file `.env.local`:

```env
# Admin (View Only)
ADMIN_KEY=your_admin_key_here

# Superadmin (Full Access)
SUPERADMIN_KEY=your_superadmin_key_here
```

### 2. **Login ke Dashboard**

1. Buka halaman: `/dashboard`
2. Masukkan kunci admin sesuai role yang diinginkan
3. Sistem akan otomatis mendeteksi role berdasarkan kunci yang dimasukkan

---

## 🛡️ Restriction System

Ketika **Admin** (view only) mencoba melakukan aksi yang memerlukan hak Superadmin, sistem akan:

1. Menampilkan **Restriction Modal** dengan pesan:
   - "Akses Terbatas"
   - Informasi aksi yang tidak diizinkan
   - Penjelasan bahwa fitur hanya tersedia untuk Superadmin

2. **Tidak mengeksekusi** aksi tersebut

3. API akan mengembalikan response `403 Forbidden` dengan detail:
   ```json
   {
     "error": "Akses ditolak. Hanya Superadmin yang dapat...",
     "requiredRole": "superadmin",
     "currentRole": "admin"
   }
   ```

---

## 📋 Aksi yang Dibatasi untuk Admin

| Aksi | Admin | Superadmin |
|------|-------|------------|
| View Database | ✅ | ✅ |
| Daftarkan QRIS Baru | ❌ | ✅ |
| Edit Data QRIS | ❌ | ✅ |
| Aktifkan QRIS | ❌ | ✅ |
| Nonaktifkan QRIS | ❌ | ✅ |
| Hapus Permanen | ❌ | ✅ |

---

## 🔧 API Endpoints dengan Role Check

### `/api/auth-admin` (POST)
Autentikasi admin dan mendapatkan role.

**Request:**
```json
{
  "adminKey": "admin123"
}
```

**Response:**
```json
{
  "success": true,
  "role": "admin",
  "name": "Admin",
  "authenticated": true
}
```

### `/api/list` (GET, DELETE, PATCH, PUT)
- **GET**: Semua role dapat mengakses
- **DELETE, PATCH, PUT**: Hanya Superadmin

### `/api/register` (POST)
- Hanya Superadmin yang dapat mendaftarkan QRIS baru

---

## 🎨 UI Indicators

### Badge Role
Dashboard menampilkan badge role di header:

- **Admin**: Badge abu-abu dengan icon 👁️ "Admin (View Only)"
- **Superadmin**: Badge hijau dengan icon 👑 "Superadmin"

### Tab Restrictions
Tab "Daftarkan QRIS" akan:
- Menampilkan icon 🔒 untuk Admin
- Opacity 50% untuk Admin
- Menampilkan Restriction Modal saat diklik oleh Admin

---

## 🔄 Migration dari Admin Lama

Halaman `/admin` masih tersedia untuk backward compatibility, namun:
- Menggunakan sistem autentikasi lama (single admin key)
- Tidak memiliki role-based access control
- Disarankan untuk migrasi ke `/dashboard`

---

## 🚨 Security Notes

1. **Ganti default keys** di production!
2. Gunakan keys yang kuat dan unik
3. Jangan commit `.env.local` ke repository
4. Simpan keys dengan aman (gunakan password manager)
5. Berikan akses Admin (view only) untuk staff yang hanya perlu monitoring
6. Berikan akses Superadmin hanya untuk personel yang dipercaya

---

## 📝 Testing Credentials

Untuk testing, gunakan default credentials:

```
Admin (View Only):
Key: admin123

Superadmin (Full Access):
Key: superadmin123
```

**⚠️ PENTING**: Ganti credentials ini di production!
