# 📸 Instruksi Penggantian Logo DecoQ

## Lokasi File Logo

Letakkan file logo Anda di folder ini: **`public/logo.svg`**

## Format yang Didukung

- ✅ **SVG** (Rekomendasi - scalable dan ringan)
- ✅ **PNG** (Dengan background transparan)
- ✅ **JPG/JPEG** (Jika tidak perlu transparansi)
- ✅ **WebP** (Format modern, ukuran kecil)

## Spesifikasi Logo

### Ukuran Rekomendasi
- **Minimal**: 120x120 pixels
- **Optimal**: 256x256 pixels atau 512x512 pixels
- **Rasio**: 1:1 (persegi)

### Kualitas
- **Resolusi**: Minimal 72 DPI untuk web
- **Background**: Transparan (untuk PNG/SVG)
- **Format warna**: RGB untuk web

## Cara Mengganti Logo

### Opsi 1: Ganti File Langsung (Termudah)
1. Hapus file `logo.svg` yang ada di folder `public/`
2. Letakkan file logo baru Anda dengan nama **`logo.svg`**
3. Refresh browser - logo baru akan langsung muncul!

### Opsi 2: Gunakan Nama File Berbeda
Jika logo Anda memiliki nama berbeda (misal: `my-logo.png`):

1. Letakkan file di folder `public/`
2. Update import di file-file berikut:

**File yang perlu diupdate:**
- `pages/index.tsx` (baris ~60 dan ~70)
- `pages/verify.tsx` (baris ~50)
- `pages/admin.tsx` (baris ~130 dan ~200)

**Contoh perubahan:**
```tsx
// Dari:
<Image src="/logo.svg" alt="DecoQ" width={80} height={80} />

// Menjadi:
<Image src="/my-logo.png" alt="DecoQ" width={80} height={80} />
```

## Tips Desain Logo

### Untuk Hasil Terbaik:
1. **Kontras Tinggi**: Logo harus terlihat jelas di background gelap
2. **Sederhana**: Hindari detail terlalu rumit untuk ukuran kecil
3. **Warna**: Gunakan warna yang match dengan tema (#fff985 - kuning brand)
4. **Padding**: Beri sedikit ruang kosong di sekitar logo

### Contoh Warna yang Cocok:
- Kuning brand: `#fff985` atau `#ffe940`
- Putih: `#ffffff`
- Hitam: `#12120a`
- Kombinasi gradient kuning

## Lokasi Logo Muncul

Logo akan muncul di:
- ✅ Halaman utama (index) - Logo besar dengan animasi
- ✅ Halaman verifikasi - Logo kecil di header
- ✅ Panel admin - Logo di header dan halaman login
- ✅ Browser tab (favicon) - Otomatis dari logo

## Troubleshooting

### Logo tidak muncul?
1. Pastikan nama file benar: `logo.svg` (huruf kecil semua)
2. Pastikan file ada di folder `public/` (bukan subfolder)
3. Clear cache browser (Ctrl+Shift+R atau Cmd+Shift+R)
4. Restart development server (`npm run dev`)

### Logo terlalu besar/kecil?
Edit ukuran di komponen:
```tsx
// Ubah width dan height sesuai kebutuhan
<Image src="/logo.svg" alt="DecoQ" width={100} height={100} />
```

### Logo tidak transparan?
- Gunakan format PNG atau SVG dengan background transparan
- Jika JPG, pastikan background match dengan tema (#12120a)

## Contoh Logo SVG Sederhana

Jika Anda ingin membuat logo SVG sederhana, gunakan template ini:

```svg
<svg width="120" height="120" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
  <!-- Background circle -->
  <circle cx="60" cy="60" r="55" fill="#fff985"/>
  
  <!-- Your logo content here -->
  <text x="60" y="75" font-size="48" font-weight="bold" 
        text-anchor="middle" fill="#12120a">DQ</text>
</svg>
```

---

**Butuh bantuan?** Buka issue di repository atau hubungi tim development.

**Happy branding! 🎨**
