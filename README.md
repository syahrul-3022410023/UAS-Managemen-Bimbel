# Aplikasi Manajemen Bimbel

Implementasi Sprint 1 dari PRD: Authentication & Role Management.

## Fitur Sprint 1

- Login dan logout menggunakan Supabase Auth.
- Forgot password dan reset password.
- Middleware protected route untuk `/admin`, `/mentor`, dan `/orang-tua`.
- Validasi role `admin`, `mentor`, dan `parent`.
- Dashboard awal per role sebagai target redirect setelah login.
- Migrasi Supabase untuk tabel `profiles` dan RLS dasar.

## Menjalankan Lokal

1. Salin `.env.example` menjadi `.env.local`.
2. Isi `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, dan `NEXT_PUBLIC_SITE_URL`.
3. Jalankan migrasi `supabase/migrations/0001_auth_profiles.sql` di Supabase.
4. Buat user di Supabase Auth dan isi metadata role:

```json
{
  "role": "admin"
}
```

Role yang didukung:

- `admin`
- `mentor`
- `parent`

5. Install dependency dan jalankan aplikasi:

```bash
npm install
npm run dev
```

## Rute Uji

- `/login`
- `/forgot-password`
- `/reset-password`
- `/admin/dashboard`
- `/mentor/dashboard`
- `/orang-tua/dashboard`

User hanya boleh mengakses dashboard sesuai role. Jika role tidak sesuai, aplikasi mengarahkan user ke dashboard role miliknya.
