# Usability Heuristics & Responsive Guide — Manajemen Bimbel

> Dua hal dalam satu dokumen: (1) 10 heuristik usability Nielsen sebagai checklist tiap kali menambah/mengubah UI, dan (2) aturan responsive tablet/mobile yang sudah diimplementasikan di `globals.css`. AI agent wajib cek dokumen ini sebelum menganggap sebuah halaman "selesai".

---

## Bagian 1 — 10 Usability Heuristics (Nielsen), dikontekstualisasikan

### 1. Visibility of system status
Sistem harus selalu kasih tahu apa yang sedang terjadi.
- ✅ Sudah ada: banner "1 invoice belum lunas" di dashboard
- ⚠️ Perbaiki: saat data sedang loading (fetch API), jangan tampilkan angka `0`/kosong begitu saja — pakai skeleton loader. Ini yang dulu bikin kasus "Rp 50" nyasar ke tampilan final.
- Aturan: setiap aksi (simpan invoice, tandai lunas, hapus siswa) wajib ada feedback — toast/notifikasi, bukan diam saja.

### 2. Match between system and the real world
Bahasa & istilah harus sesuai dunia nyata pengguna (admin bimbel), bukan istilah teknis sistem.
- Gunakan "Belum Lunas", "Jatuh Tempo", "Siswa Aktif" — bukan istilah database seperti "status: 0" atau "is_active: true"
- Urutan informasi ikuti alur kerja admin bimbel: cek keuangan → cek siswa/mentor → jadwal, bukan urutan tabel database

### 3. User control and freedom
Selalu ada jalan keluar kalau salah aksi.
- Setiap form (tambah siswa, buat invoice) butuh tombol "Batal" yang jelas, bukan cuma klik di luar modal
- Aksi destruktif (hapus siswa, hapus invoice) wajib ada konfirmasi, dan idealnya bisa di-undo minimal beberapa detik

### 4. Consistency and standards
Ini yang paling relevan dengan kerja kita sejauh ini — makanya ada `DESIGN_SYSTEM.md`.
- Satu sistem warna status di semua modul (lunas/pending/batal warnanya sama persis di Invoice, Absensi, dan Jadwal — jangan beda-beda per halaman)
- Satu pola tombol primary/secondary di semua halaman
- Icon yang sama artinya harus konsisten (icon kalender selalu untuk "jadwal", bukan kadang untuk "buat", kadang untuk "lihat")

### 5. Error prevention
Lebih baik cegah error daripada kasih pesan error bagus.
- Input nominal invoice: validasi tidak boleh negatif/kosong sebelum submit, bukan setelah
- Kalau siswa mau dihapus tapi masih punya invoice aktif, cegah dari awal dengan pesan jelas, jangan biarkan lalu error di backend

### 6. Recognition rather than recall
Jangan bikin admin harus mengingat-ingat.
- Breadcrumb selalu tampilkan posisi saat ini (`Bimbel / Invoice / Detail`)
- Filter/tab yang terakhir dipilih di tabel sebaiknya persist saat balik ke halaman itu
- Nama siswa/mentor tampil sebagai teks, jangan cuma ID

### 7. Flexibility and efficiency of use
Untuk admin yang tiap hari pakai app ini, sediakan jalan pintas.
- Search global di topbar (sudah ada) — pastikan bisa cari siswa/invoice/mentor sekaligus, bukan cuma 1 modul
- Aksi yang sering dipakai (tandai lunas, absen cepat) sebaiknya bisa langsung dari tabel tanpa buka halaman detail

### 8. Aesthetic and minimalist design
Ini alasan kenapa kita bersihkan token warna & bobot font kemarin.
- Setiap elemen di layar harus punya alasan ada di sana — kalau cuma dekorasi, buang (sudah kita terapkan: hapus animasi ala-AI)
- Informasi sekunder (metadata, timestamp) dibuat lebih kecil/muted, bukan bersaing visual dengan data utama

### 9. Help users recognize, diagnose, and recover from errors
Pesan error dalam bahasa manusia, bukan bahasa sistem.
- ❌ "Error 422: validation failed"
- ✅ "Nominal invoice tidak boleh kosong. Isi dulu ya."
- Error selalu kasih tahu apa yang salah DAN apa yang harus dilakukan

### 10. Help and documentation
Untuk aplikasi internal begini, bantuan idealnya kontekstual, bukan manual tebal.
- Tooltip singkat di field yang butuh penjelasan (misal "Saldo Bersih = Penerimaan − Pengeluaran")
- Empty state (misal "Belum ada siswa terdaftar") diberi CTA jelas — "Tambah Siswa Baru", bukan cuma teks kosong

---

## Bagian 2 — Responsive (Tablet & Mobile)

Sudah diimplementasikan di `globals.css`. Breakpoint ikut standar Tailwind supaya selaras dengan class di JSX:

| Breakpoint | Lebar | Perilaku |
|---|---|---|
| Mobile | `< 768px` | Sidebar jadi off-canvas drawer (tersembunyi, muncul lewat toggle), grid card/chart 1 kolom, tabel scroll horizontal dengan kolom pertama sticky |
| Tablet | `768px – 1023px` | Sidebar menyusut jadi icon-rail (72px, label disembunyikan), grid card/chart turun ke 2 kolom |
| Desktop | `≥ 1024px` | Sidebar penuh 240px, grid sampai 4 kolom sesuai halaman |

### Yang sudah beres di CSS
- `.gsm-sidebar` — otomatis icon-rail di tablet, off-canvas di mobile
- `.gsm-content .grid[class*="grid-cols-4/3/2"]` — otomatis turun kolom sesuai breakpoint
- Tabel — kolom pertama `position: sticky` di mobile supaya tetap terbaca saat scroll ke samping
- Touch target minimum `44px` untuk semua tombol/nav item di perangkat `pointer: coarse`
- Padding tier terpisah untuk tablet (1.25rem) vs mobile (1rem) — sebelumnya lompat langsung dari desktop ke mobile

### ⚠️ Yang PERLU dikerjakan di komponen (bukan cuma CSS)
CSS di atas menyiapkan visualnya, tapi buka/tutup sidebar di mobile butuh **state di komponen React**, bukan CSS murni. AI agent perlu:

1. Tambah tombol hamburger di `.gsm-topbar`, class `gsm-sidebar-toggle` (sudah otomatis tampil hanya di mobile via CSS), `onClick` toggle state `sidebarOpen`
2. Render elemen `<div className="gsm-sidebar-overlay" data-open={sidebarOpen} onClick={() => setSidebarOpen(false)} />` sebagai backdrop
3. Set `data-open={sidebarOpen}` di elemen `.gsm-sidebar`
4. Tutup sidebar otomatis setelah user klik salah satu nav item di mobile (`onNavigate` → `setSidebarOpen(false)`)

### Aturan grid di JSX
Supaya rule CSS tablet/mobile di atas jalan otomatis, pastikan komponen pakai class Tailwind standar, bukan grid custom:

```jsx
// Stat card row — 4 kolom desktop, 2 tablet (otomatis via CSS), 1 mobile (otomatis)
<div className="grid grid-cols-4 gap-6">

// Chart row (bar + line) — sebaiknya eksplisit di JSX karena butuh urutan stack tertentu
<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
```

### Checklist responsive sebelum halaman dianggap selesai
- [ ] Dicoba di lebar 375px (mobile kecil), 768px (tablet), 1024px+ (desktop)
- [ ] Sidebar bisa dibuka/ditutup di mobile tanpa elemen lain ikut geser aneh
- [ ] Tidak ada horizontal scroll yang tidak disengaja di body (hanya tabel yang boleh scroll-x)
- [ ] Semua tombol/nav item minimal 44×44px di mode sentuh
- [ ] Teks tidak terpotong/overflow di lebar 375px
- [ ] Chart tetap terbaca (tidak gepeng) saat di-stack 1 kolom di mobile