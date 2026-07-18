# Revisi PRD v2.1

## Perbaikan (Bug Fix)

### Admin

#### 1. Data Orang Tua

- Memperbaiki error **Invalid API Key** ketika menambahkan data orang tua.
- Memastikan proses Create, Update, dan Delete data orang tua berjalan normal.

---

#### 2. Paket Bimbel

Menyederhanakan struktur data Paket Bimbel.

Perubahan:

- Mata Pelajaran digabung ke dalam Paket Bimbel.
- Menu Mata Pelajaran dapat dihilangkan karena sudah diwakili oleh Paket Bimbel.

Contoh:

| Paket Bimbel | Mata Pelajaran |
|--------------|----------------|
| Paket Reguler SD | Matematika |
| Paket IPA SMP | IPA |
| Paket Semua Mapel | Semua |

---

#### 3. Pembayaran

Menu **Pembayaran** dihapus.

Seluruh data pembayaran akan langsung tercatat pada **Laporan Keuangan**.

Alur baru:

```
Invoice SPP
      ↓
Laporan Keuangan
```

Laporan Keuangan menjadi pusat seluruh transaksi pembayaran.

---

### Mentor

#### 1. Dashboard Mentor

Menghubungkan data Dashboard dengan database.

Perbaikan:

- Total Kelas yang Diampu.
- Total Siswa.
- Jadwal Mengajar.

Seluruh data ditampilkan secara real-time.

---

### Orang Tua

Melakukan integrasi data:

- Paket Bimbel.
- Kelas Anak.

Data yang ditampilkan berasal dari jadwal dan penempatan siswa.

---

# Penyempurnaan UI/UX

## 1. Data Siswa

Mengubah tampilan tabel.

Sebelumnya

| Nama | Kode Siswa | No HP Orang Tua |

Menjadi

| Nama Siswa | No HP Orang Tua |

Format tampilan:

```
Aisyah Putri
STD-000012
```

Nomor HP Orang Tua juga menggunakan tampilan dua baris.

Contoh:

```
081234567890
Ibu Siti
```

Kolom Kode Siswa dihapus karena sudah ditampilkan di bawah nama siswa.

---

## 2. Paket Bimbel

Menghapus caption/deskripsi pendek yang berada di bawah judul halaman agar tampilan lebih bersih.

---

## 3. Invoice & Slip Gaji

Merapikan tampilan:

- Header.
- Informasi pembayaran.
- Layout cetak.
- Nomor dokumen.
- Format nominal Rupiah.

Agar siap digunakan sebagai dokumen cetak (PDF).

---

## 4. URL Halaman

Menghilangkan prefix:

```
/pages/dashboard
```

Menjadi

```
/dashboard
```

atau sesuai routing Next.js App Router.

---

## 5. Jadwal Mentor

Mengubah konsep halaman **Jadwal Saya**.

Sebelumnya:

Menampilkan satu jadwal per halaman.

Menjadi:

Rekap jadwal mengajar berdasarkan hari.

Contoh:

### Senin

08.00 - 10.00

Matematika

Siswa:
Aisyah Putri

---

10.30 - 12.00

IPA

Siswa:
Budi Santoso

---

### Selasa

...

Halaman ini berfungsi sebagai daftar aktivitas mengajar mentor.

---

## 6. Kalender Mentor

Kalender digunakan sebagai rekap jadwal bulanan.

Setiap tanggal menampilkan:

- Mata Pelajaran.
- Jam Mengajar.
- Nama Siswa.

Contoh:

```
22 Juli

08.00
Matematika

Aisyah
```

Kalender tidak lagi digunakan sebagai halaman utama jadwal, tetapi sebagai tampilan bulanan.

---

# Integrasi Data

Perbaikan integrasi antar modul:

- Paket Bimbel ↔ Jadwal
- Jadwal ↔ Mentor
- Jadwal ↔ Siswa
- Jadwal ↔ Orang Tua
- Invoice SPP ↔ Laporan Keuangan
- Payroll ↔ Slip Gaji
- Dashboard ↔ Database

Seluruh dashboard menggunakan data real-time dari database.

---

# Target Versi

Versi: **v2.1**

Fokus pembaruan:

- Bug Fix
- Integrasi Data
- Penyederhanaan Modul
- Penyempurnaan UI/UX
- Optimasi Dashboard Mentor
- Penyempurnaan Jadwal Mentor
- Penyempurnaan Invoice dan Slip Gaji