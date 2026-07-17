# Sprint Planning Aplikasi Manajemen Bimbingan Belajar (MVP)

## Metode Pengembangan

-   **Framework:** Scrum
-   **Durasi Sprint:** 2 minggu
-   **Total Sprint:** 6 Sprint (±12 minggu)

------------------------------------------------------------------------

# Sprint 0 -- Persiapan Lingkungan Pengembangan

## Tujuan

Menyiapkan seluruh kebutuhan pengembangan agar tim dapat mulai
mengembangkan aplikasi.

## Backlog

### Project Setup

-   Membuat repository GitHub
-   Inisialisasi project Next.js + TypeScript
-   Konfigurasi Tailwind CSS
-   Konfigurasi ESLint dan Prettier
-   Menyusun struktur folder project (feature-based architecture)

### Database & Backend

-   Membuat project Supabase
-   Menghubungkan Next.js dengan Supabase
-   Membuat seluruh tabel database sesuai PRD
-   Menyiapkan relasi antar tabel
-   Konfigurasi Supabase Storage

### Authentication

-   Konfigurasi Supabase Auth
-   Menyiapkan Role Based Access Control (Admin, Mentor, Orang Tua)
-   Menyiapkan Row Level Security (RLS)

### Deployment

-   Konfigurasi Vercel
-   Konfigurasi Environment Variables
-   Setup Continuous Deployment dari GitHub ke Vercel

### Landing Page

-   Halaman Landing Page
-   Navigasi ke Login
-   Navigasi ke Sign Up

## Testing

-   Koneksi Supabase berhasil
-   Deployment berhasil
-   Landing page dapat diakses

## Acceptance Criteria

-   Project berhasil dijalankan secara lokal
-   Deployment berhasil ke Vercel
-   Landing Page tampil dengan baik
-   Database berhasil terkoneksi

------------------------------------------------------------------------

# Sprint 1 -- Authentication & Role Management

## Tujuan

Membangun sistem autentikasi dan manajemen hak akses pengguna.

## Backlog

### Authentication

-   Login
-   Logout
-   Forgot Password
-   Reset Password

### Session Management

-   Protected Route
-   Middleware Authentication
-   Session Management

### Role Management

-   Role Admin
-   Role Mentor
-   Role Orang Tua
-   Validasi hak akses setiap halaman

## Testing

-   Login berhasil
-   Login gagal
-   Logout
-   Reset Password
-   Validasi akses setiap role

## Acceptance Criteria

-   Pengguna dapat login sesuai role
-   Hak akses berjalan sesuai role
-   Session tetap aktif selama pengguna login

------------------------------------------------------------------------

# Sprint 2 -- Master Data

## Tujuan

Membangun seluruh modul data utama.

## Backlog

### Manajemen Siswa

-   Tambah siswa
-   Edit siswa
-   Hapus siswa
-   Detail siswa

### Manajemen Mentor

-   Tambah mentor
-   Edit mentor
-   Hapus mentor
-   Detail mentor

### Manajemen Orang Tua

-   Tambah orang tua
-   Edit orang tua
-   Hapus orang tua

### Paket Bimbel

-   CRUD Paket

### Mata Pelajaran

-   CRUD Mata Pelajaran

## Testing

-   CRUD seluruh data
-   Validasi form
-   Validasi data duplikat

## Acceptance Criteria

-   Seluruh data master dapat dikelola
-   Data tersimpan pada database
-   Tidak ada data invalid yang dapat disimpan

------------------------------------------------------------------------

# Sprint 3 -- Manajemen Kelas & Jadwal

## Tujuan

Mengelola proses akademik.

## Backlog

### Kelas

-   CRUD Kelas

### Penempatan Siswa

-   Tambah siswa ke kelas
-   Hapus siswa dari kelas

### Penugasan Mentor

-   Menentukan mentor pada kelas

### Jadwal

-   CRUD Jadwal
-   Tampilan kalender menggunakan FullCalendar
-   Validasi bentrok jadwal

## Testing

-   Penempatan siswa
-   Penugasan mentor
-   Validasi jadwal bentrok

## Acceptance Criteria

-   Jadwal berhasil dibuat
-   Tidak ada jadwal yang bentrok
-   Kelas memiliki mentor dan siswa

------------------------------------------------------------------------

# Sprint 4 -- Dashboard & Absensi

## Tujuan

Menyediakan dashboard dan pencatatan kehadiran.

## Backlog

### Dashboard Admin

-   Statistik siswa
-   Statistik mentor
-   Statistik kelas
-   Invoice belum dibayar
-   Pendapatan bulan berjalan
-   Grafik pembayaran

### Dashboard Mentor

-   Jadwal hari ini
-   Kelas aktif
-   Absensi hari ini
-   Evaluasi belum diisi

### Dashboard Orang Tua

-   Jadwal anak
-   Kehadiran anak
-   Status pembayaran
-   Nilai terbaru

### Absensi

-   Absensi siswa
-   Absensi mentor
-   Riwayat absensi

## Testing

-   Input absensi
-   Dashboard menampilkan data sesuai role

## Acceptance Criteria

-   Dashboard menampilkan data sesuai pengguna
-   Absensi tersimpan ke database
-   Riwayat absensi dapat ditampilkan

------------------------------------------------------------------------

# Sprint 5 -- Invoice & Pembayaran

## Tujuan

Mengelola administrasi pembayaran.

## Backlog

### Invoice

-   Generate Invoice
-   Detail Invoice
-   Status Invoice

### Pembayaran

-   Input pembayaran
-   Riwayat pembayaran
-   Validasi pembayaran ganda

## Testing

-   Generate invoice
-   Pembayaran
-   Validasi invoice

## Acceptance Criteria

-   Invoice berhasil dibuat
-   Status pembayaran berubah setelah pembayaran
-   Sistem menolak pembayaran ganda

------------------------------------------------------------------------

# Sprint 6 -- Laporan, Pengujian & Deployment

## Tujuan

Menyelesaikan seluruh fitur MVP dan menyiapkan sistem untuk digunakan.

## Backlog

### Laporan

-   Laporan siswa
-   Laporan absensi
-   Laporan pembayaran

### Pengujian

-   Pengujian seluruh fitur
-   Perbaikan bug
-   Pengujian hak akses
-   Pengujian responsif (Desktop, Tablet, Mobile)

### Deployment

-   Deployment versi produksi
-   Konfigurasi environment production
-   Verifikasi database production

## Testing

-   Functional Testing
-   Integration Testing
-   User Acceptance Testing (UAT)

## Acceptance Criteria

-   Seluruh fitur MVP berjalan sesuai PRD
-   Tidak terdapat bug kritis
-   Hak akses berjalan sesuai role
-   Sistem berhasil di-deploy dan dapat digunakan pengguna

------------------------------------------------------------------------

# Ringkasan Sprint

  Sprint     Fokus                           Output
  ---------- ------------------------------- ---------------------------
  Sprint 0   Persiapan Lingkungan            Project siap dikembangkan
  Sprint 1   Authentication & Role           Login dan hak akses
  Sprint 2   Master Data                     Pengelolaan data utama
  Sprint 3   Kelas & Jadwal                  Operasional kelas
  Sprint 4   Dashboard & Absensi             Monitoring aktivitas
  Sprint 5   Invoice & Pembayaran            Administrasi keuangan
  Sprint 6   Laporan, Testing & Deployment   MVP siap digunakan

Pembagian sprint ini mengikuti dependensi modul sehingga setiap sprint
menghasilkan increment yang dapat diuji sebelum melanjutkan ke sprint
berikutnya.
