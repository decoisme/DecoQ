# Fitur Panel Admin DecoQ

Dokumentasi lengkap fitur-fitur yang tersedia di Panel Admin DecoQ.

---

## Fitur Utama

### 1. **Daftarkan QRIS Baru**
Mendaftarkan QRIS merchant baru ke dalam database.

**Cara Menggunakan:**
1. Buka tab "Daftarkan QRIS"
2. Isi form:
   - Nama Merchant (wajib)
   - ID Merchant (wajib)
   - Kategori (pilih dari dropdown)
   - Didaftarkan oleh (opsional)
   - Catatan (opsional)
3. Scan QRIS atau upload gambar QRIS
4. Klik "Daftarkan QRIS"
5. Hash SHA-256 akan otomatis dibuat dan disimpan

**Fitur:**
- Scan kamera langsung
- Upload file gambar
- Paste raw QRIS string
- Validasi duplikasi (hash yang sama tidak bisa didaftar 2x)
- Auto-generate SHA-256 hash

---

### 2. **Edit Data QRIS**
Mengubah informasi merchant tanpa mengubah hash QRIS.

**Cara Menggunakan:**
1. Buka tab "Daftar QRIS"
2. Klik tombol **"Edit"** (biru) pada QRIS yang ingin diubah
3. Modal edit akan muncul dengan data saat ini
4. Ubah data yang diperlukan:
   - Nama Merchant
   - ID Merchant
   - Kategori
   - Catatan
5. Klik "Simpan Perubahan"

**Catatan Penting:**
- Hash SHA-256 **TIDAK DAPAT** diubah (read-only)
- Perubahan langsung tersimpan ke database
- Status aktif/nonaktif tidak berubah saat edit

**Use Case:**
- Memperbaiki typo nama merchant
- Update ID merchant yang berubah
- Menambah/mengubah catatan
- Mengubah kategori merchant

---

### 3. **Nonaktifkan QRIS**
Menonaktifkan QRIS sementara tanpa menghapus dari database (soft delete).

**Cara Menggunakan:**
1. Buka tab "Daftar QRIS"
2. Klik tombol **"Nonaktif"** (kuning) pada QRIS aktif
3. Konfirmasi aksi
4. QRIS akan dinonaktifkan

**Efek:**
- QRIS masih ada di database
- Status berubah menjadi "Nonaktif"
- Verifikasi akan gagal (QRIS tidak dikenali)
- Dapat diaktifkan kembali kapan saja

**Use Case:**
- Merchant sementara tutup
- QRIS sedang dalam maintenance
- Merchant berganti QRIS baru
- Suspend merchant yang bermasalah

---

### 4. **Aktifkan Kembali QRIS**
Mengaktifkan kembali QRIS yang sudah dinonaktifkan.

**Cara Menggunakan:**
1. Buka tab "Daftar QRIS"
2. Cari QRIS dengan status "Nonaktif"
3. Klik tombol **"Aktifkan"** (hijau)
4. Konfirmasi aksi
5. QRIS akan aktif kembali

**Efek:**
- Status berubah menjadi "Aktif"
- Verifikasi akan berhasil lagi
- Semua data tetap sama seperti sebelumnya

**Use Case:**
- Merchant buka kembali
- Maintenance selesai
- Reaktivasi setelah suspend

---

### 5. **Hapus Permanen QRIS**
Menghapus QRIS secara permanen dari database (hard delete).

**Cara Menggunakan:**
1. Buka tab "Daftar QRIS"
2. Klik tombol **"Hapus"** (merah) pada QRIS yang ingin dihapus
3. Prompt konfirmasi akan muncul
4. Ketik **"DELETE_PERMANENT"** (huruf besar semua)
5. Tekan OK untuk konfirmasi
6. QRIS akan dihapus permanen

**PERINGATAN PENTING:**
- **TIDAK DAPAT DIBATALKAN!**
- Data akan hilang selamanya dari database
- Hash tidak dapat dipulihkan
- History verifikasi akan kehilangan referensi

**Konfirmasi Keamanan:**
- Harus mengetik "DELETE_PERMANENT" dengan benar
- Nama merchant ditampilkan untuk memastikan
- Double confirmation untuk mencegah kesalahan

**Use Case:**
- Merchant tutup permanen
- Data duplikat yang salah
- Cleanup database
- Merchant fraud/scam yang perlu dihapus

**Rekomendasi:**
- Gunakan "Nonaktifkan" untuk suspend sementara
- Gunakan "Hapus Permanen" hanya jika benar-benar yakin
- Backup database sebelum hapus permanen

---

## Fitur Pencarian

**Cara Menggunakan:**
1. Buka tab "Daftar QRIS"
2. Ketik di search box
3. Hasil akan difilter secara real-time

**Pencarian berdasarkan:**
- Nama Merchant
- ID Merchant

**Fitur:**
- Real-time filtering
- Case-insensitive
- Partial match

---

## Informasi yang Ditampilkan

Setiap QRIS di list menampilkan:

1. **Nama Merchant** - Nama lengkap merchant
2. **Status Badge** - "Aktif" (hijau) atau "Nonaktif" (merah)
3. **Kategori Badge** - Kategori merchant (F&B, Retail, dll)
4. **ID Merchant** - ID unik merchant
5. **Tanggal Registrasi** - Kapan QRIS didaftarkan
6. **Catatan** - Catatan tambahan (jika ada)
7. **Hash SHA-256** - Hash unik QRIS (truncated)

---

## Tombol Aksi

| Tombol | Warna | Icon | Fungsi | Status QRIS |
|--------|-------|------|--------|-------------|
| **Edit** | Biru | Edit | Edit data merchant | Aktif & Nonaktif |
| **Nonaktif** | Kuning | X | Nonaktifkan QRIS | Hanya Aktif |
| **Aktifkan** | Hijau | Rotate | Aktifkan kembali | Hanya Nonaktif |
| **Hapus** | Merah | Trash | Hapus permanen | Aktif & Nonaktif |

---

## Keamanan

### Autentikasi Admin
- Memerlukan kunci admin untuk akses
- Kunci disimpan di environment variable
- Session tersimpan selama browser terbuka

### Konfirmasi Aksi
- Nonaktifkan: Konfirmasi browser
- Aktifkan: Konfirmasi browser
- Hapus Permanen: Konfirmasi dengan ketik "DELETE_PERMANENT"

### Audit Trail
- Semua perubahan tercatat di database
- Timestamp otomatis
- Info "registered_by" untuk tracking

---

## Tips & Best Practices

### DO (Lakukan)
- Gunakan "Nonaktifkan" untuk suspend sementara
- Edit data jika ada perubahan info merchant
- Backup database sebelum hapus permanen
- Gunakan catatan untuk informasi tambahan
- Cek status sebelum melakukan aksi

### DON'T (Jangan)
- Jangan hapus permanen tanpa backup
- Jangan edit data sembarangan
- Jangan share kunci admin
- Jangan nonaktifkan QRIS yang sedang digunakan
- Jangan hapus QRIS yang masih aktif digunakan merchant

---

## Troubleshooting

### "Unauthorized" saat login
- Pastikan kunci admin benar
- Cek environment variable `ADMIN_SECRET`
- Clear browser cache dan coba lagi

### Tombol tidak muncul
- Refresh halaman
- Pastikan sudah login sebagai admin
- Cek koneksi internet

### Edit tidak tersimpan
- Pastikan semua field wajib terisi
- Cek koneksi ke database
- Lihat console browser untuk error

### Hapus permanen gagal
- Pastikan mengetik "DELETE_PERMANENT" dengan benar
- Huruf besar semua, tanpa spasi
- Cek koneksi database

---

## Responsive Design

Panel admin fully responsive untuk:
- Desktop (optimal)
- Tablet (good)
- Mobile (usable)

**Rekomendasi:** Gunakan desktop/laptop untuk pengalaman terbaik.

---

## Workflow Rekomendasi

### Registrasi Merchant Baru
1. Daftarkan QRIS → Isi form → Scan/Upload → Simpan
2. Verifikasi di tab "Daftar QRIS"
3. Test verifikasi di halaman user

### Update Data Merchant
1. Cari QRIS di list
2. Klik "Edit"
3. Ubah data yang perlu
4. Simpan perubahan

### Suspend Merchant
1. Cari QRIS di list
2. Klik "Nonaktif"
3. Konfirmasi
4. Merchant tidak bisa diverifikasi

### Reaktivasi Merchant
1. Cari QRIS nonaktif
2. Klik "Aktifkan"
3. Konfirmasi
4. Merchant bisa diverifikasi lagi

### Hapus Merchant Permanen
1. **Backup database dulu!**
2. Nonaktifkan QRIS terlebih dahulu (opsional)
3. Klik "Hapus"
4. Ketik "DELETE_PERMANENT"
5. Konfirmasi
6. Data terhapus permanen

---

## Support

Jika ada masalah atau pertanyaan:
1. Cek dokumentasi ini
2. Lihat console browser untuk error
3. Cek log database
4. Hubungi tim development

---

**Dibuat untuk DecoQ Platform**

**Cara Menggunakan:**
1. Buka tab "Daftar QRIS"
2. Ketik di search box
3. Hasil akan difilter secara real-time

**Pencarian berdasarkan:**
- ✅ Nama Merchant
- ✅ ID Merchant

**Fitur:**
- ⚡ Real-time filtering
- 🔤 Case-insensitive
- 🎯 Partial match

---

## 📊 Informasi yang Ditampilkan

Setiap QRIS di list menampilkan:

1. **Nama Merchant** - Nama lengkap merchant
2. **Status Badge** - "● Aktif" (hijau) atau "○ Nonaktif" (merah)
3. **Kategori Badge** - Kategori merchant (F&B, Retail, dll)
4. **ID Merchant** - ID unik merchant
5. **Tanggal Registrasi** - Kapan QRIS didaftarkan
6. **Catatan** - Catatan tambahan (jika ada)
7. **Hash SHA-256** - Hash unik QRIS (truncated)

---

## 🎨 Tombol Aksi

| Tombol | Warna | Icon | Fungsi | Status QRIS |
|--------|-------|------|--------|-------------|
| **Edit** | Biru | ✏️ | Edit data merchant | Aktif & Nonaktif |
| **Nonaktif** | Kuning | ✖️ | Nonaktifkan QRIS | Hanya Aktif |
| **Aktifkan** | Hijau | 🔄 | Aktifkan kembali | Hanya Nonaktif |
| **Hapus** | Merah | 🗑️ | Hapus permanen | Aktif & Nonaktif |

---

## 🔐 Keamanan

### Autentikasi Admin
- ✅ Memerlukan kunci admin untuk akses
- ✅ Kunci disimpan di environment variable
- ✅ Session tersimpan selama browser terbuka

### Konfirmasi Aksi
- ✅ Nonaktifkan: Konfirmasi browser
- ✅ Aktifkan: Konfirmasi browser
- ✅ Hapus Permanen: Konfirmasi dengan ketik "DELETE_PERMANENT"

### Audit Trail
- ✅ Semua perubahan tercatat di database
- ✅ Timestamp otomatis
- ✅ Info "registered_by" untuk tracking

---

## 💡 Tips & Best Practices

### ✅ DO (Lakukan)
- Gunakan "Nonaktifkan" untuk suspend sementara
- Edit data jika ada perubahan info merchant
- Backup database sebelum hapus permanen
- Gunakan catatan untuk informasi tambahan
- Cek status sebelum melakukan aksi

### ❌ DON'T (Jangan)
- Jangan hapus permanen tanpa backup
- Jangan edit data sembarangan
- Jangan share kunci admin
- Jangan nonaktifkan QRIS yang sedang digunakan
- Jangan hapus QRIS yang masih aktif digunakan merchant

---

## 🐛 Troubleshooting

### "Unauthorized" saat login
- Pastikan kunci admin benar
- Cek environment variable `ADMIN_SECRET`
- Clear browser cache dan coba lagi

### Tombol tidak muncul
- Refresh halaman
- Pastikan sudah login sebagai admin
- Cek koneksi internet

### Edit tidak tersimpan
- Pastikan semua field wajib terisi
- Cek koneksi ke database
- Lihat console browser untuk error

### Hapus permanen gagal
- Pastikan mengetik "DELETE_PERMANENT" dengan benar
- Huruf besar semua, tanpa spasi
- Cek koneksi database

---

## 📱 Responsive Design

Panel admin fully responsive untuk:
- 💻 Desktop (optimal)
- 📱 Tablet (good)
- 📱 Mobile (usable)

**Rekomendasi:** Gunakan desktop/laptop untuk pengalaman terbaik.

---

## 🔄 Workflow Rekomendasi

### Registrasi Merchant Baru
1. Daftarkan QRIS → Isi form → Scan/Upload → Simpan
2. Verifikasi di tab "Daftar QRIS"
3. Test verifikasi di halaman user

### Update Data Merchant
1. Cari QRIS di list
2. Klik "Edit"
3. Ubah data yang perlu
4. Simpan perubahan

### Suspend Merchant
1. Cari QRIS di list
2. Klik "Nonaktif"
3. Konfirmasi
4. Merchant tidak bisa diverifikasi

### Reaktivasi Merchant
1. Cari QRIS nonaktif
2. Klik "Aktifkan"
3. Konfirmasi
4. Merchant bisa diverifikasi lagi

### Hapus Merchant Permanen
1. **Backup database dulu!**
2. Nonaktifkan QRIS terlebih dahulu (opsional)
3. Klik "Hapus"
4. Ketik "DELETE_PERMANENT"
5. Konfirmasi
6. Data terhapus permanen

---

## 📞 Support

Jika ada masalah atau pertanyaan:
1. Cek dokumentasi ini
2. Lihat console browser untuk error
3. Cek log database
4. Hubungi tim development

---

**Dibuat dengan ❤️ untuk DecoQ Platform**
