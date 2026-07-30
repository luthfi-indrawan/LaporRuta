# Tech Spec - LaporRuta

## 1. Tech Stack Rationale

### 1.1 Frontend: React + Vite

| Aspek            | Keputusan                    | Alternatif Yang Ditolak           | Alasan Pemilihan                                                                                                                                                                                  |
| ---------------- | ---------------------------- | --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Framework UI** | React                        | Next.js, Vue, Svelte              | PRD secara eksplisit menggunakan React (bukan Next.js). SPA dengan React Router lebih sederhana untuk use case tanpa SSR/SEO requirement.                                                         |
| **Build Tool**   | Vite                         | Create React App, Webpack         | Cold start & HMR lebih cepat; output bundle lebih optimal; konfigurasi minimal.                                                                                                                   |
| **Styling**      | Tailwind CSS + Shadcn UI     | Material UI, Chakra UI, Bootstrap | Shadcn UI memberikan komponen yang tidak terkunci vendor (copy-paste), sepenuhnya customizable dengan Tailwind, dan sesuai filosofi desain minimalis untuk admin dengan tech-skill rendah-sedang. |
| **State Server** | TanStack Query (React Query) | Redux Toolkit, Zustand, SWR       | Caching, background refetch, optimistic updates, dan deduplication request built-in; mengurangi boilerplate state management untuk data remote.                                                   |
| **Peta**         | Leaflet.js + React-Leaflet   | Mapbox GL JS, Google Maps         | OpenStreetMap (via Leaflet) tidak memerlukan API key berbayar; markercluster plugin matang untuk handling kepadatan laporan.                                                                      |
| **Icons**        | Lucide React                 | FontAwesome, Heroicons            | Konsistensi dengan Shadcn UI; bundle size tree-shakeable.                                                                                                                                         |

### 2.2 Backend: Node.js + Express.js

| Aspek                | Keputusan  | Alternatif Yang Ditolak     | Alasan Pemilihan                                                                                                                            |
| -------------------- | ---------- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| **Runtime**          | Node.      | Deno, Bun, Python (FastAPI) | Ekosistem npm terbesar; tim familiaritas tinggi; non-blocking I/O cocok untuk I/O-bound app (real-time + file upload).                      |
| **Framework**        | Express.js | NestJS, Fastify, Koa        | Konsistensi dengan tech stack yang sudah didefinisikan di PRD; fleksibel, middleware ecosystem matang, learning curve rendah untuk tim.     |
| **File Upload**      | Multer     | Formidable, Busboy          | Standar de-facto untuk Express; integrasi multer-memory-storage → Sharp → Supabase Storage seamless.                                        |
| **Image Processing** | Sharp      | Jimp, ImageMagick           | Performa native libvips; kompresi dan resize sangat cepat; cocok untuk pipeline upload gambar real-time.                                    |
| **Real-time**        | Socket.io  | WS (raw websocket), SSE     | Fallback transport otomatis (long-polling → websocket); room management built-in untuk broadcast granular (public vs admin vs per-wilayah). |

### 2.3 Database & Storage: Supabase

| Aspek          | Keputusan                    | Alternatif Yang Ditolak            | Alasan Pemilikan                                                                                                                                                                                         |
| -------------- | ---------------------------- | ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Database**   | Supabase (PostgreSQL)        | MongoDB, MySQL, Firebase Firestore | PostgreSQL mendukung JSONB (metadata activity_logs), CTE recursive (hierarki wilayah), dan generated columns. Supabase menyediakan managed PostgreSQL dengan dashboard gratis-tier yang cukup untuk MVP. |
| **Storage**    | Supabase Storage             | AWS S3, Cloudinary, MinIO          | Terintegrasi dengan Supabase Auth/RLS (meskipun kita bypass via Service Role Key); URL public sederhana; tidak ada biaya tambahan untuk tier awal.                                                       |
| **RLS Policy** | **Dinonaktifkan sepenuhnya** | Mengandalkan RLS Supabase          | Keputusan arsitektural eksplisit dari PRD. Semua keamanan ditegakkan di middleware Express untuk menghindari logic split antara DB dan app layer.                                                        |

### 2.4 Authentication: Custom JWT

| Aspek              | Keputusan                                                      | Alternatif Yang Ditolak             | Alasan Pemilihan                                                                                                                                                       |
| ------------------ | -------------------------------------------------------------- | ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Auth Mechanism** | Custom JWT (jsonwebtoken)                                      | Supabase Auth, Auth0, Firebase Auth | PRD mensyaratkan custom auth dengan bcrypt + JWT. Menghindari vendor lock-in dan kompleksitas OAuth2 untuk MVP yang target user-nya warga lokal dengan email/password. |
| **Token Storage**  | Access: Memory (React Context/State); Refresh: httpOnly Cookie | localStorage (both tokens)          | Mitigasi XSS: access token di memory tidak bisa di-steal via XSS script injection. Refresh token di httpOnly cookie tidak accessible via JavaScript.                   |

---

## 3. Security & Authentication Strategy

### 3.1 Data Encryption

| Lapisan                     | Mekanisme                | Detail                                                                                                                                                      |
| --------------------------- | ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **In Transit**              | TLS 1.3                  | Seluruh komunikasi client-server dan server-database dilindungi HTTPS/WSS. Strict Transport Security (HSTS) diaktifkan di reverse proxy (nginx/Cloudflare). |
| **At Rest - Password**      | bcrypt (cost factor 12)  | Password user di-hash satu arah sebelum disimpan ke `users.password_hash`. Tidak pernah ada plain text password di log atau database.                       |
| **At Rest - Refresh Token** | SHA-256 Hash             | Raw refresh token tidak disimpan di database; yang disimpan adalah `token_hash` untuk validasi.                                                             |
| **At Rest - File Storage**  | Supabase Storage Default | Enkripsi at rest dijamin oleh penyedia infrastruktur Supabase (AES-256).                                                                                    |

### 3.2 Session & Token Architecture

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────────┐
│   Client SPA    │         │  Express Server  │         │  PostgreSQL DB  │
│                 │         │                  │         │                 │
│  Access Token   │◄───────►│  JWT Verify      │         │  refresh_tokens │
│  (Memory/State) │  (15m)  │  (Stateless)     │         │  (Stateful)     │
│                 │         │                  │         │                 │
│  Refresh Token  │◄───────►│  Compare Hash    │◄────────┤  token_hash     │
│  (httpOnly Cookie) (7d)   │  + Rotate        │         │  expires_at     │
└─────────────────┘         └──────────────────┘         └─────────────────┘
```

**Flow Autentikasi:**

1. **Login:** Client kirim `email` + `password` → Express verifikasi bcrypt → generate `access_token` (JWT, 15 menit, payload: `{ userId, role, assignedWilayahId }`) dan `refresh_token` (random string 256-bit) → hash refresh token → simpan ke DB → kirim access token ke body response, refresh token ke `httpOnly` cookie (`Secure`, `SameSite=Strict`).
2. **Token Refresh:** Saat access token expired, client otomatis hit `POST /auth/refresh` dengan refresh token dari cookie → server verifikasi hash di DB → issue access token baru + rotate refresh token (invalidate old, issue new) → kirim kembali.
3. **Logout:** Server menghapus refresh token record dari DB (blacklist) dan menghapus cookie client-side. Access token di client dihapus dari memory.
4. **Session Expiry:** Refresh token expired setelah 7 hari; user harus login ulang.

### 3.3 Route Protection & RBAC

**Akses Matriks:**

| Endpoint Pattern            | `user` | `admin_wilayah`    | `admin_pusat` |
| --------------------------- | ------ | ------------------ | ------------- |
| `GET /reports/public`       | ✅     | ✅                 | ✅            |
| `POST /reports`             | ✅     | ❌                 | ❌            |
| `POST /upvotes`             | ✅     | ❌                 | ❌            |
| `GET /admin/wilayah/*`      | ❌     | ✅ (own zone only) | ✅            |
| `GET /admin/pusat/*`        | ❌     | ❌                 | ✅            |
| `PUT /reports/:id/override` | ❌     | ❌                 | ✅            |
| `POST /admin/invitations`   | ❌     | ❌                 | ✅            |

**Zone Isolation (Admin Wilayah):**

- Middleware `authorizeZone` memeriksa `req.user.assigned_wilayah_id === report.wilayah_id` untuk setiap operasi write pada laporan.
- Query read untuk admin wilayah selalu difilter: `WHERE wilayah_id = $1` di level aplikasi Express.

### 3.4 File Upload Security

| Langkah                   | Implementasi                                                                                            |
| ------------------------- | ------------------------------------------------------------------------------------------------------- |
| **MIME Type Validation**  | Multer filter hanya menerima `image/jpeg` dan `image/png`.                                              |
| **Magic Number Check**    | Validasi file signature (FF D8 FF untuk JPEG, 89 50 4E 47 untuk PNG) di backend setelah multer parsing. |
| **Size Limit**            | Maksimum 5MB per file di multer; Sharp kompres ke target ≤500KB.                                        |
| **Filename Sanitization** | Original filename tidak digunakan; generate UUID + timestamp untuk nama file di Supabase Storage.       |
| **Path Restriction**      | Backend menentukan folder path (`reports/{report_id}/{uuid}.jpg`); client tidak bisa mengontrol path.   |
| **Service Role Key**      | Hanya backend yang memegang key. Client mengunggah ke Express → Express mengunggah ke Supabase.         |

### 3.5 JWT Token Architecture

```
Header:    { "alg": "RS256", "typ": "JWT" }
Payload:   {
             "sub": "user_uuid",
             "role": "owner|cashier",
             "iat": 1718900000,
             "exp": 1718986400,
             "jti": "unique_token_id"
           }
Signature: RSASHA256(base64url(header) + "." + base64url(payload), private_key)
```

---

_End of Document_

```

```
