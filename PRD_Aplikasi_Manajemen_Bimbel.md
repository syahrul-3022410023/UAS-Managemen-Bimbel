# Product Requirements Document (PRD)

# Aplikasi Manajemen Bimbingan Belajar

**Versi:** 1.0\
**Status:** Draft

------------------------------------------------------------------------

# 1. Latar Belakang

Banyak lembaga bimbingan belajar masih mengelola operasional menggunakan
Microsoft Excel, WhatsApp, atau pencatatan manual. Kondisi tersebut
menyebabkan beberapa permasalahan, antara lain:

-   Data siswa tersebar di berbagai file.
-   Penjadwalan kelas sulit dikelola.
-   Kehadiran siswa dan mentor belum terdokumentasi dengan baik.
-   Orang tua kesulitan memantau perkembangan belajar anak.
-   Pengelolaan pembayaran masih dilakukan secara manual.
-   Penyusunan laporan administrasi membutuhkan waktu yang lama.

Untuk mengatasi permasalahan tersebut diperlukan sebuah aplikasi
berbasis web yang mampu mengintegrasikan seluruh proses bisnis bimbingan
belajar ke dalam satu sistem.

------------------------------------------------------------------------

# 2. Tujuan Produk

-   Mengelola data akademik bimbingan belajar.
-   Mengelola operasional kelas.
-   Mengelola pembayaran.
-   Memudahkan komunikasi antara admin, mentor, dan orang tua.
-   Menyediakan laporan secara real-time.

------------------------------------------------------------------------

# 3. Target Pengguna

## Admin

-   Mengelola siswa
-   Mengelola mentor
-   Mengelola kelas
-   Mengelola pembayaran
-   Mengelola jadwal
-   Melihat laporan

## Mentor

-   Melihat jadwal
-   Mengisi absensi
-   Menginput evaluasi belajar
-   Melihat data kelas

## Orang Tua

-   Melihat jadwal
-   Melihat absensi
-   Melihat nilai
-   Melihat invoice
-   Melakukan pembayaran

------------------------------------------------------------------------

# 4. Scope Produk

## MVP

-   Authentication
-   Role Management
-   Dashboard
-   Manajemen Siswa
-   Manajemen Mentor
-   Manajemen Kelas
-   Penempatan Siswa
-   Penugasan Mentor
-   Jadwal
-   Absensi
-   Invoice
-   Pembayaran
-   Laporan

------------------------------------------------------------------------

# 5. Success Metrics

-   100% data siswa tersimpan dalam sistem.
-   100% invoice dibuat melalui sistem.
-   Waktu pembuatan laporan turun minimal 70%.
-   Kehadiran siswa tercatat secara digital.
-   Orang tua dapat memantau perkembangan anak secara online.

------------------------------------------------------------------------

# 6. Teknologi

  Komponen          Teknologi
  ----------------- -------------------------------------
  Frontend          Next.js + TypeScript + Tailwind CSS
  Backend           Next.js API Routes / Server Actions
  Database          Supabase PostgreSQL
  Authentication    Supabase Auth
  Storage           Supabase Storage
  Hosting           Vercel
  Version Control   GitHub
  Validation        Zod
  Form              React Hook Form
  Table             TanStack Table
  Calendar          FullCalendar
  Chart             Recharts

------------------------------------------------------------------------

# 7. Arsitektur Sistem

``` text
Browser
   │
Next.js
   │
API Routes / Server Actions
   │
Supabase
├── Auth
├── PostgreSQL
├── Storage
└── Row Level Security
```

------------------------------------------------------------------------

# 8. User Roles

## Admin

-   Dashboard
-   Manajemen Siswa
-   Manajemen Mentor
-   Manajemen Orang Tua
-   Manajemen Paket
-   Manajemen Mata Pelajaran
-   Manajemen Kelas
-   Penempatan Siswa
-   Penugasan Mentor
-   Jadwal
-   Absensi
-   Invoice
-   Pembayaran
-   Payroll
-   Laporan
-   Pengaturan

## Mentor

-   Dashboard
-   Jadwal
-   Kelas
-   Absensi
-   Evaluasi
-   Payroll
-   Profil

## Orang Tua

-   Dashboard
-   Jadwal Anak
-   Absensi
-   Evaluasi
-   Invoice
-   Pembayaran
-   Profil

------------------------------------------------------------------------

# 9. Modul Sistem

## Authentication

**Fitur** - Login - Logout - Forgot Password - Reset Password - Role
Validation - Session Management

## Dashboard

### Admin

-   Jumlah siswa
-   Jumlah mentor
-   Jumlah kelas
-   Invoice belum dibayar
-   Pendapatan bulan ini
-   Grafik pembayaran

### Mentor

-   Jadwal hari ini
-   Kelas aktif
-   Absensi hari ini
-   Evaluasi belum diisi

### Orang Tua

-   Status pembayaran
-   Jadwal anak
-   Kehadiran anak
-   Nilai terbaru

## Modul Lain

-   Manajemen Siswa
-   Manajemen Orang Tua
-   Manajemen Mentor
-   Paket Bimbel
-   Mata Pelajaran
-   Kelas
-   Penempatan Siswa
-   Penugasan Mentor
-   Jadwal
-   Absensi
-   Evaluasi
-   Invoice
-   Pembayaran
-   Payroll
-   Laporan

------------------------------------------------------------------------

# 10. Database

``` text
roles
users
students
parents
mentors
packages
subjects
classes
mentor_assignments
student_classes
schedules
student_attendance
mentor_attendance
evaluations
invoices
payments
transactions
payrolls
```

------------------------------------------------------------------------

# 11. Security

-   Supabase Authentication
-   Role Based Access Control
-   Row Level Security (RLS)
-   Audit Log
-   Soft Delete

Hak akses: - Admin → seluruh data - Mentor → hanya kelas yang diajar -
Orang tua → hanya data anak sendiri

------------------------------------------------------------------------

# 12. Non Functional Requirements

  Kebutuhan         Target
  ----------------- ----------------------------
  Availability      99%
  Response Time     \< 3 detik
  Authentication    JWT Supabase
  Authorization     RLS
  Backup            Harian
  Responsive        Desktop, Tablet, Mobile
  Scalability       Hingga ±100 siswa aktif
  Maintainability   Modular Architecture
  Reliability       Konsistensi data transaksi

------------------------------------------------------------------------

# 13. Roadmap

## Versi 1 (MVP)

-   Authentication
-   Dashboard
-   Manajemen Siswa
-   Mentor
-   Orang Tua
-   Paket
-   Mata Pelajaran
-   Kelas
-   Penempatan Siswa
-   Jadwal
-   Absensi
-   Invoice
-   Pembayaran
-   Laporan

## Versi 2

-   Evaluasi Belajar
-   Payroll
-   Export PDF
-   Export Excel
-   Riwayat Paket
-   Dashboard Analitik

## Versi 3

-   QR Code Absensi
-   Notifikasi

------------------------------------------------------------------------

# 14. Risiko

  Risiko                 Mitigasi
  ---------------------- ------------------------------
  Bentrok jadwal         Validasi konflik jadwal
  Pembayaran ganda       Validasi invoice
  Kebocoran data         RLS dan RBAC
  Kehilangan data        Soft Delete & Backup
  Batas layanan gratis   Monitoring kuota dan upgrade

------------------------------------------------------------------------

# Kesimpulan

PRD ini menjadi acuan pengembangan aplikasi manajemen bimbingan belajar
berbasis **Next.js**, **Supabase**, **Vercel**, dan **GitHub** dengan
pendekatan MVP sehingga mudah dikembangkan secara bertahap menuju sistem
yang siap digunakan oleh lembaga bimbingan belajar.
