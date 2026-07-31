# Dashboard Admin UI Direction

Dokumen ini menjadi arahan desain untuk tampilan `Dashboard Admin` BimbelPro. Referensi visual utama adalah dashboard bergaya modern SaaS: bersih, terang, kartu KPI pastel, tipografi ringan, dan layout yang mudah dipindai.

## Tujuan Tampilan

Dashboard harus terasa seperti panel kerja admin bimbel, bukan landing page. Fokus utamanya:

- Melihat kondisi keuangan: penerimaan, pengeluaran, saldo bersih, payroll bulan ini.
- Melihat aktivitas operasional: siswa, mentor, kelas, absensi.
- Mengetahui status invoice yang perlu tindakan.
- Mengakses workflow penting dengan cepat: laporan, jadwal, invoice, kelas.

## Prinsip Visual

- Gunakan background utama sangat terang: putih dan biru abu muda.
- Hindari warna terlalu pekat kecuali untuk tombol primer dan aksen kecil.
- Kartu memakai border tipis, radius sedang, dan tanpa shadow berat.
- Font tidak boleh terlalu tebal. Gunakan `font-medium` atau `font-semibold` seperlunya, hindari banyak `font-bold`.
- Angka KPI boleh lebih besar, tetapi tetap dengan berat font sedang agar tidak terasa kasar.
- Layout harus padat, rapi, dan tidak banyak ruang kosong besar.

## Layout Dashboard

Struktur layar:

1. Header dashboard ringkas
2. Kartu KPI utama
3. Area konten utama dua kolom
4. Panel workflow cepat atau status invoice

### Header

Header tidak perlu hero besar. Gunakan card putih dengan layout horizontal:

- Kiri:
  - Label kecil: `Overview`
  - Judul: `Dashboard Admin`
  - Deskripsi singkat: `Ringkasan operasional dan keuangan bimbel hari ini.`
- Kanan:
  - Tombol `Laporan`
  - Tombol primer `Jadwal`

Style:

- Background: `#FFFFFF`
- Border: `#E6ECF5`
- Radius: `20px`
- Padding desktop: `24px`
- Padding mobile: `16px`

## KPI Cards

KPI harus mengikuti karakter referensi: pastel, lembut, font tidak terlalu tebal, dan ikon kecil di kanan/kiri.

KPI yang digunakan:

| KPI | Konten | Warna |
| --- | --- | --- |
| Penerimaan | Total kas masuk dari SPP dan kas manual | Biru muda |
| Pengeluaran | Payroll dan kas manual keluar | Ungu muda atau merah muda lembut |
| Saldo Bersih | Penerimaan dikurangi pengeluaran | Hijau mint |
| Payroll Bulan Ini | Total payroll periode berjalan | Kuning/oranye muda |

### Spesifikasi KPI

- Card radius: `16px`
- Border: `1px solid #E7EDF7`
- Padding: `16px`
- Tinggi minimal: `104px` sampai `120px`
- Background card pastel, bukan putih polos semua.
- Ikon kecil dengan container `32px`.
- Label ukuran `12px`, warna muted.
- Angka ukuran `22px` sampai `26px`, berat `font-semibold`.
- Detail ukuran `12px`, warna muted.

Contoh tone:

```tsx
Penerimaan: bg-[#EAF4FF], accent #1688F0
Pengeluaran: bg-[#F3ECFF], accent #8B5CF6
Saldo Bersih: bg-[#E9FBF6], accent #10B981
Payroll Bulan Ini: bg-[#FFF6E8], accent #F59E0B
```

Catatan penting: jangan pakai angka KPI `font-bold` berlebihan. Referensi memakai angka besar yang tetap ringan.

## Area Operasional

Panel `Aktivitas Operasional` harus menjadi area grafik utama.

Isi:

- Judul: `Aktivitas Operasional`
- Subtitle: `Perbandingan data inti bimbel.`
- Badge kecil: `Real-time`
- Chart bar untuk siswa, mentor, kelas, absensi.
- List ringkasan di samping chart.

Style:

- Card putih.
- Border sangat tipis.
- Chart container memakai background `#F8FAFE`.
- Progress kecil di list memakai warna sesuai kategori.
- Jangan terlalu tinggi; chart cukup `180px` sampai `210px`.

## Panel Pendapatan

Panel kanan menampilkan:

- Label kecil: `Pendapatan Bulan Ini`
- Nilai rupiah
- Subtitle hijau: `Total pembayaran diterima`
- Sparkline chart
- Status invoice

Style:

- Card putih.
- Ikon tren pakai biru pastel.
- Chart container biru abu sangat muda.
- Status invoice tetap jelas:
  - Jika ada unpaid: merah lembut.
  - Jika aman: hijau lembut.

## Workflow Cepat

Workflow boleh tetap ada, tapi jangan terlalu dominan.

Item:

- Invoice SPP
- Laporan Keuangan
- Kelola Jadwal
- Manajemen Kelas

Style:

- List vertical.
- Setiap item punya ikon pastel kecil.
- Gunakan hover sangat halus.
- Teks judul `font-medium`, bukan bold.
- Detail kecil warna slate.

## Tipografi

Gunakan sistem font existing project.

Rekomendasi berat font:

- Heading utama: `font-semibold`
- Heading section: `font-semibold`
- Label kecil: `font-medium`
- KPI value: `font-semibold`
- Body/detail: regular atau `font-normal`

Ukuran:

```txt
Page title: 24px - 26px
Section title: 16px - 18px
KPI value: 24px - 26px
KPI label: 12px - 13px
Detail text: 12px
```

## Palet Warna

Warna utama tetap mengikuti BimbelPro biru, tapi dibuat lebih lembut.

```txt
Brand blue: #2563EB
Soft blue bg: #EAF4FF
Page surface: #F6F8FC
Card border: #E7EDF7
Muted text: #8391A8
Ink text: #111827
Mint bg: #E9FBF6
Mint accent: #10B981
Purple bg: #F3ECFF
Purple accent: #8B5CF6
Amber bg: #FFF6E8
Amber accent: #F59E0B
Danger bg: #FEF2F2
Danger accent: #DC2626
```

## Yang Harus Dihindari

- Jangan membuat hero gelap atau terlalu mencolok.
- Jangan mengubah sidebar dan topbar dulu.
- Jangan memakai shadow besar.
- Jangan terlalu banyak `font-bold`.
- Jangan membuat radius terlalu besar seperti `28px` untuk semua container.
- Jangan membuat area dashboard seperti card besar yang membungkus semua isi.
- Jangan menggunakan satu warna biru saja untuk semua KPI.

## Rencana Implementasi

Jika sudah disetujui, implementasi cukup di:

- `app/admin/dashboard/page.tsx`
- Opsional kecil: `components/app/dashboard-charts.tsx` jika tinggi/margin chart perlu disesuaikan.

Tidak perlu mengubah:

- `components/app/top-bar.tsx`
- `components/app/app-shell.tsx`
- `app/globals.css`

Target hasil: KPI dashboard mirip referensi, tapi konten dan warna tetap cocok untuk aplikasi manajemen bimbel.
