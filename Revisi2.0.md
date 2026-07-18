# Update PRD Berdasarkan Review

## 8. User Roles

### Admin

Tambahkan menu berikut:

- Gaji Mentor (Payroll)
- Arus Kas

---

### Mentor

Tambahkan menu berikut:

- Slip Gaji

---

## 9. Modul Sistem

### Manajemen Siswa

Tambahkan fitur:

- Generate Kode Siswa Otomatis.
- Menyimpan Nomor Telepon Orang Tua.
- Menampilkan Kode Siswa di bawah Nama Siswa pada tabel data.

---

### Paket Bimbel

Tambahkan ketentuan:

- Nama menu menjadi **Paket Bimbel**.
- Paket Bimbel menyimpan:
  - Nama Paket
  - Level
  - Mata Pelajaran
  - Jumlah Sesi/Bulan
  - Harga Paket/Bulan
  - Gaji Mentor/Sesi
  - Status
  - Deskripsi
- Jadwal **tidak** disimpan pada Paket Bimbel, tetapi dikelola pada modul Jadwal.

---

### Jadwal

Tambahkan field:

- Nama Siswa
- Mentor
- Paket Bimbel
- Mata Pelajaran
- Hari
- Jam Mulai
- Jam Selesai
- Status

---

### Invoice

Revisi menjadi:

**Invoice SPP**

Tambahkan:

- Generate Nomor Invoice Otomatis (INV-XXXXXX).
- Status Invoice:
  - Belum Dibayar
  - Lunas

---

### Payroll Mentor

Tambahkan modul baru.

Fitur:

- Generate Payroll Bulan Ini.
- Perhitungan otomatis jumlah sesi mengajar.
- Perhitungan gaji mentor berdasarkan tarif per sesi.
- Bonus.
- Potongan.
- Status pembayaran.
- Cetak Slip Gaji.

---

### Arus Kas

Tambahkan modul baru.

Fitur:

- Tambah Transaksi.
- Jenis Transaksi:
  - Pemasukan
  - Pengeluaran
- Kategori.
- Nominal.
- Deskripsi.
- Riwayat transaksi.

---

### Laporan Keuangan

Tambahkan:

Laporan keuangan merupakan rekapitulasi dari:

- Pembayaran SPP
- Payroll Mentor
- Arus Kas

---

## Dashboard Admin

Tambahkan widget:

- Total Kas Masuk
- Total Kas Keluar
- Saldo Kas
- Total Payroll Bulan Ini

---

## Dashboard Mentor

Tambahkan widget:

- Slip Gaji Terbaru
- Total Pendapatan Bulan Ini

---

## Roadmap

### Versi 1 (MVP)

Tambahkan:

- Payroll Mentor
- Slip Gaji
- Arus Kas

---

## Database

Tambahkan atau pastikan tabel berikut tersedia:

```
cash_flows
payrolls
payroll_details
```

---

## Tampilan Data

### Data Siswa

Nama siswa ditampilkan dengan format:

```
Nama Siswa
STD-000001
```

---

### Gaji Mentor

Mengacu pada referensi, halaman Gaji Mentor terdiri dari:

- Generate Payroll Bulan Ini.
- Daftar Payroll.
- Status.
- Tombol Bayar.
- Detail.
- Cetak Slip.

---

### Arus Kas

Halaman Arus Kas terdiri dari:

- Tabel transaksi.
- Tombol Tambah Transaksi.
- Form:
  - Tanggal
  - Tipe
  - Kategori
  - Nominal
  - Deskripsi

---

### Jadwal Mentor

Halaman Jadwal Saya menampilkan:

- Mata Pelajaran
- Nama Siswa
- Jam Mengajar
- Paket
- Lokasi
- Status

---

### Kalender Mentor

Kalender digunakan untuk menampilkan seluruh jadwal mengajar mentor selama satu bulan.