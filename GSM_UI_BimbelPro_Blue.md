# GSM UI BimbelPro Cobalt Dashboard

## Arah Visual

BimbelPro memakai gaya professional dashboard yang terinspirasi dari Framer/Behance: layout operasional normal, sidebar rapi, topbar clean, card compact, dan aksen cobalt yang tegas. Sistem aplikasi tidak berubah; GSM ini hanya mengatur visual, spacing, komponen, dan motion.

## Palet Warna

- Primary Blue: `#3947FF`
- Primary Hover: `#2432D8`
- Accent Blue: `#6D5DFF`
- Background: `#F2F2F3`
- Surface Soft: `#EEF0FF`
- Border: `#ECEEF5`
- Text Primary: `#111827`
- Text Muted: `#64748B`
- Card: `#FFFFFF`

Status boleh tetap memakai warna fungsional, tetapi harus soft:

- Success: hijau hanya untuk status lunas/hadir.
- Warning: amber hanya untuk pending/terlambat.
- Danger: merah hanya untuk error/belum lunas/tidak hadir.

## Layout

- Desktop canvas: background abu terang full page tanpa frame aplikasi berlebihan.
- Sidebar desktop: putih, fixed full-height seperti layout awal, tetapi spacing dan active state lebih premium.
- Active navigation: background `#EEF0FF`, teks cobalt, tanpa dekorasi berlebihan.
- Topbar: putih, sticky, breadcrumb kecil, search pill, avatar soft cobalt.
- Main content: padding normal `24-32px` desktop, `16px` mobile.
- Card: putih, border halus, radius `16px`, tanpa shadow. Kedalaman visual dibuat dari border, spacing, background band, dan kontras warna.
- Jangan memakai frame aplikasi besar, hero, atau banner global. Halaman harus terasa normal seperti layout awal, hanya visualnya lebih rapi.

## Komponen

- Button primary: cobalt solid, teks putih, tanpa shadow, hover pakai warna lebih gelap atau border state.
- Input/search/select: background putih, border slate muda, focus ring cobalt transparan.
- Table: header `#FAFAFB`, border halus, row hover `#FAFAFB`.
- Summary card: putih polos, label kecil, angka besar semibold, aksen biru sangat tipis.
- Empty state: card putih dengan border dashed biru muda.
- KPI card: putih compact, icon bulat kecil di kiri atas, label muted, angka besar tebal, chip growth kecil di kanan bawah. KPI boleh memakai variasi icon color, tapi brand cobalt tetap jadi warna utama.
- Dashboard page: susun konten sebagai KPI row, panel analitik utama, panel status/finance kanan, lalu workflow/list di bawah. Jangan menumpuk kartu tanpa hierarki visual.
- Chart card: header memakai icon tile kecil, judul tebal, subtitle muted, badge periode/count di kanan. Chart harus memakai grid horizontal halus, axis tanpa garis tebal, rounded bars/lines, gradient lembut, custom tooltip, dan legend pill.

## Tipografi

- Font: system sans.
- Heading: semibold/bold secukupnya, tracking normal agar terasa editorial.
- Label kecil: uppercase seperlunya, tracking ringan, warna slate muted.
- Jangan memakai headline terlalu besar di halaman operasional.

## Motion

- Page content masuk dengan fade dan rise kecil.
- Card hover naik maksimal `2px`.
- Logo/sidebar memakai motion sangat halus dan lambat.
- Ilustrasi auth memakai motion real-time: floating tablet, chart drawing, live pulse, blink karakter.
- Semua motion wajib mati saat `prefers-reduced-motion: reduce`.

## Aturan Implementasi

- Jangan ubah query, action, route, role, auth, Supabase, atau struktur data hanya untuk redesign.
- Prioritaskan update token dan shared component sebelum mengedit halaman individual.
- Gunakan cobalt sebagai aksen utama. Hindari warna pucat tanpa kontras, gradient berlebihan, dekorasi ramai, dan shadow. Jangan pakai `shadow-*`, `drop-shadow`, atau `box-shadow` untuk UI utama.
- Tambahkan fitur visual hanya jika tidak membuat tombol palsu atau action yang tidak bekerja.
- Jangan memakai banner/hero besar pada halaman input data, presensi, jadwal, dashboard, atau tabel kerja kecuali ada kebutuhan konten spesifik.
