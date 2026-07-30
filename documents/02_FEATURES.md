# Features - LaporRuta

## Authentication & Authorization

### 1. Register User

Warga mendaftar dengan nama lengkap, email, dan password (minimal 8 karakter). Password di-hash secara aman menggunakan bcrypt. Setelah sukses, sistem otomatis membuat user dengan `role = 'user'` dan mengembalikan token autentikasi (access token + refresh token). Jika email sudah terdaftar, sistem menampilkan pesan error generik tanpa membeberkan apakah email tersebut benar-benar ada di sistem.

**Tech Stack Context:** Backend Express.js. JWT custom (jsonwebtoken). Refresh token disimpan di tabel `refresh_tokens`. Tidak ada RLS - semua keamanan di middleware Express.

### 2. Login User

Verifikasi kombinasi email dan password. Sistem menerbitkan access token (berlaku 15 menit) dan refresh token (berlaku 7 hari). Refresh token disimpan di database PostgreSQL. Saat berhasil, pengguna diarahkan ke halaman terakhir yang dikunjungi atau ke peta publik. Saat gagal, muncul pesan generik "Kredensial tidak valid". Sesi bertahan di seluruh refresh browser sampai logout eksplisit atau kedaluwarsa.

**Tech Stack Context:** Frontend React + Vite SPA. Token disimpan di memory (access) dan httpOnly cookie / secure storage (refresh). TanStack Query untuk state management.

### 3. Role-Based Access Control (RBAC)

Terdapat tiga peran: `user` (publik), `admin_wilayah`, dan `admin_pusat`. Akses ditegakkan di level backend Express melalui middleware autentikasi dan otorisasi. **RLS Supabase dinonaktifkan sepenuhnya** - semua query ke database dari backend menggunakan Service Role Key. Tidak mengandalkan mekanisme keamanan bawaan database.

### 4. Role-Based Routing

Setelah login, sistem memeriksa peran dan zona tugas pengguna melalui endpoint `GET /auth/me`. Admin Wilayah langsung diarahkan ke dashboard wilayahnya (`/admin/wilayah`) dengan data yang sudah terfilter. Admin Pusat diarahkan ke dashboard pusat (`/admin/pusat`) dengan akses penuh. User biasa yang mencoba akses halaman admin akan diarahkan ke peta publik dengan pesan akses ditolak (403).

**Tech Stack Context:** React Router v6 di frontend. Route guard berdasarkan role dari context/auth state.

---

## Exploring Public Maps

### 1. Public Interactive Map

Peta menggunakan Leaflet.js + OpenStreetMap (tanpa API key). Menampilkan hanya laporan dengan status `verified`, `in_progress`, atau `resolved`. Setiap penanda (marker) berkode warna berdasarkan kategori infrastruktur (didefinisikan di tabel `categories.color`) dan berkode bentuk berdasarkan status penanganan.

**Tech Stack Context:** React-Leaflet di frontend. Data awal di-fetch via REST API (`GET /reports/public`). Update real-time via Socket.io room `public:reports`.

### 2. Marker Clustering

Di area dengan banyak laporan, penanda otomatis dikelompokkan dengan lencana jumlah. Mengklik kelompok akan memperbesar peta untuk membuka pengelompokan tersebut. Fungsi ini mencegah tampilan peta berantakan di lokasi padat.

**Tech Stack Context:** Leaflet.markercluster plugin. Murni client-side, tidak memerlukan HTTP service khusus.

### 3. Map Filters

Panel filter multi-select untuk kategori dan status. Filter diterapkan secara instan tanpa memuat ulang halaman. URL diperbarui secara dinamis untuk mencerminkan filter aktif sehingga bisa dibagikan.

**Tech Stack Context:** React Router untuk sync URL query params. TanStack Query untuk fetch data dengan filter params.

### 4. Tag Details Card

Mengklik penanda membuka popup/kartu yang menampilkan: judul laporan, kategori, status, jumlah upvote, gambar thumbnail, dan tanggal terakhir diperbarui.

---

## Geo-tagged Reporting

### 1. Reporting Form

Field wajib: Judul (maks. 100 karakter), Deskripsi (maks. 500), Kategori (pilih dari data master), Alamat Spesifik (maks. 200), dan Lokasi Administrasi (dropdown bertingkat). Field opsional: Penanda Pin pada peta & Unggah Gambar (1–3 file, maks. 5MB, format JPG/PNG).

### 2. Multi-level Location Selector

Dropdown hierarki: Provinsi → Kota → Kecamatan → Kelurahan (kelurahan opsional). Data lokasi diisi secara manual di tabel `wilayah`. Setelah memilih kecamatan, mini peta otomatis memperbesar ke area distrik tersebut.

### 3. Mini Map with Pins

Setelah memilih kecamatan, muncul mini peta. Pengguna bisa meletakkan pin untuk menyempurnakan lokasi laporan. Koordinat disimpan jika tersedia; jika pengguna tidak meletakkan pin, laporan tetap diterima dengan lokasi administrasi saja. Bonus koordinat (`+2`) masuk ke perhitungan Priority Score untuk memberikan insentif akurasi lokasi.

### 4. Upload Image (Backend Proxy)

Client mengirim gambar ke backend Express sebagai multipart/form-data. Backend melakukan validasi (JPG/PNG, ≤5MB), kompresi (target ≤500KB), lalu mengunggah ke Supabase Storage menggunakan **Service Role Key**. Backend mengembalikan URL publik ke client. **Service Role Key tidak pernah expose ke client.**

Jika salah satu gambar gagal diunggah, seluruh pengiriman laporan dibatalkan (atomic transaction). Gambar yang sudah terupload ke Storage namun gagal insert DB harus di-cleanup secara async.

**Tech Stack Context:** Express + multer untuk handle multipart. sharp untuk kompresi gambar. Supabase Storage SDK di backend.

### 5. Moderation Queue

Laporan baru masuk dengan status `pending_verification`. Laporan ini tidak muncul di peta publik sampai diverifikasi oleh admin. Penugasan otomatis ke Admin Wilayah berdasarkan `wilayah_id`. Jika zona tidak memiliki admin aktif, fallback ke antrian Admin Pusat.

### 6. The "My Reports" Page

Menampilkan semua laporan yang pernah dikirim oleh pengguna yang sedang login, diurutkan terbaru dulu. Setiap item menampilkan: judul, ikon kategori, lencana status, tanggal pengiriman, thumbnail, dan jumlah upvote.

**Unread Indicator (Global MVP):** Ada indikator visual "Pembaruan Baru" jika laporan diperbarui sejak kunjungan terakhir pengguna. Pendekatan MVP menggunakan `users.last_seen_at` (global per user). Lencana hilang setelah page load berikutnya saat `last_seen_at` diperbarui. Tidak ada tracking per laporan di MVP.

---

## Community Upvote System

### 1. Upvote / Toggle

Hanya laporan dengan status `verified`, `in_progress`, atau `resolved` yang bisa di-upvote. Satu upvote per pengguna per laporan. Mengklik lagi akan membatalkan upvote (perilaku toggle). UI menggunakan optimistic update (jumlah berubah segera di frontend sebelum respons backend).

Backend menegakkan keunikan melalui composite unique constraint `(report_id, user_id)` pada tabel `upvotes`.

### 2. Real-time Upvote Sync

Perubahan jumlah upvote di-broadcast ke semua client yang sedang melihat laporan atau peta tersebut via Socket.io, sehingga semua pengguna melihat angka terkini tanpa refresh.

### 3. Logging Upvote

Setiap tindakan memberikan atau mencabut upvote tercatat dalam audit trail (`activity_logs`) untuk transparansi. Event upvote diagregasi di timeline (misal "+5 upvote minggu ini") untuk mencegah spam.

---

## Report Lifecycle Management (Admin)

### 1. Verification / Rejection of Reports

Admin Wilayah hanya dapat melihat laporan menunggu verifikasi yang masuk ke zona tugasnya (`wilayah_id = assigned_wilayah_id`). Klik "Verifikasi" mengubah status menjadi `verified` dan laporan langsung muncul di peta publik. Klik "Tolak" mengubah status menjadi `rejected` dengan wajib menyertakan alasan (minimal 10 karakter). Laporan yang ditolak tidak pernah muncul di peta publik.

Kedua tindakan direkam di `activity_logs` dan memicu broadcast real-time.

### 2. Repair Status Update

Admin Wilayah dapat memperbarui status maju: `verified` → `in_progress` → `resolved`. Perubahan mundur tidak diizinkan (kecuali oleh Admin Pusat via override). Saat menandai `resolved`, admin bisa mengunggah gambar "sesudah" perbaikan (maks. 3 gambar). Gambar ini ditandai `is_after = true` dan hanya dapat diunggah oleh admin.

Perubahan status memicu pembaruan real-time dan menyegarkan timestamp laporan (`updated_at`), yang mempengaruhi unread indicator pelapor.

### 3. Admin Internal Notes

Admin dapat menambahkan catatan internal pada setiap laporan untuk koordinasi internal (misalnya, "Suku cadang dipesan, ETA 3 hari"). Catatan ini disimpan di tabel `report_admin_notes` dan hanya terlihat oleh admin. Tidak muncul di timeline publik.

### 4. Zone Reallocation

Admin Pusat dapat memindahkan laporan dari satu zona administratif ke zona lain (mengubah `wilayah_id`). Laporan otomatis pindah dari antrian admin lama ke antrian admin baru secara real-time. Jika zona baru tidak memiliki Admin Wilayah, laporan tersebut masuk ke antrian Admin Pusat.

### 5. Override Central Admin

Admin Pusat dapat mengubah status laporan ke arah mana pun (termasuk mengembalikan status `resolved` ke `in_progress` atau `verified`), menolak laporan yang sudah diverifikasi, serta mengedit metadata laporan. Semua tindakan override dicatat khusus dalam audit trail dengan penanda `is_override = true`.

### 6. Priority Scoring Algorithm

Sistem menghitung skor prioritas untuk setiap laporan berdasarkan formula final:

```
Score = (Upvotes × 3) + (Category_Urgensi_Weight × 5) + (Has_Coordinate ? 2 : 0) − (Report_Age_in_Days × 0.5)
```

Dashboard admin secara default mengurutkan laporan berdasarkan skor prioritas tertinggi untuk membantu admin menentukan mana yang ditangani duluan. Skor dihitung saat read oleh API backend atau via generated column PostgreSQL.

---

## Real-Time Data Synchronisation

### 1. Real-time Public Map

Client publik berlangganan ke channel Socket.io: `public:reports`. Ketika laporan diverifikasi, penanda baru muncul di peta pada koordinat yang benar (atau titik tengah distrik jika tidak ada koordinat). Ketika status berubah, warna/bentuk penanda diperbarui segera. Payload yang dikirim lengkap sehingga client tidak perlu melakukan panggilan API tambahan.

### 2. Real-time Dashboard Admin

Admin Wilayah berlangganan ke channel Socket.io: `admin:{wilayah_id}`. Admin Pusat berlangganan ke channel global: `admin:pusat`. Laporan baru dan perubahan status muncul secara instan di dashboard dengan animasi sorot halus pada item baru selama 3 detik.

### 3. Reconnection Handler

Jika koneksi real-time terputus, client menampilkan indikator "Menyambungkan kembali..." dan mencoba menyambung ulang secara otomatis tanpa perlu intervensi pengguna.

---

## Activities & Transparency

### 1. Audit Trail / Log Aktivitas

Setiap tindakan (pembuatan laporan, upvote, verifikasi, perubahan status, penolakan, penugasan ulang, override) tercatat lengkap dengan nama aktor dan waktu kejadian di tabel `activity_logs`. Timeline ini ditampilkan di halaman detail laporan, diurutkan dari terbaru ke terlama, dan bersifat immutable (tidak dapat diubah).

Event upvote diagregasi (misalnya "+5 upvote minggu ini") untuk mencegah timeline terlalu panjang.

### 2. Unread Indicator (Pull-based - Global MVP)

Saat halaman dimuat, sistem memperbarui `users.last_seen_at` ke waktu saat ini. Di halaman "Laporan Saya", laporan yang diperbarui sejak kunjungan terakhir (`updated_at > last_seen_at`) ditandai dengan lencana titik merah atau label "Diperbarui". Lencana hilang setelah page load berikutnya saat `last_seen_at` diperbarui.

**Trade-off MVP:** Pendekatan global ini tidak bisa tracking per laporan individual. Untuk tracking per laporan yang lebih akurat, diperlukan tabel `user_report_views` (post-MVP).

---

## Administrative Hierarchy

### 1. Admin Account Management

Admin Pusat dapat mengundang admin baru melalui email. Sistem membuat entri di tabel `invitations` dengan token unik dan batas waktu (24 jam). Email undangan dikirim (atau token dibagikan manual jika email service belum tersedia). Saat membuat Admin Wilayah, harus menetapkan tepat satu `wilayah_id`.

Admin Pusat juga dapat menonaktifkan/mengaktifkan kembali akun admin, menugaskan ulang Admin Wilayah ke zona berbeda, dan menghapus akun admin (dengan proteksi: akun Admin Pusat terakhir tidak dapat dihapus).

### 2. Fallback Zone Without an Administrator

Saat laporan dibuat, sistem memeriksa apakah zona yang dipilih memiliki Admin Wilayah aktif (`is_active = true` dan `role = 'admin_wilayah'`). Jika tidak ada, laporan otomatis masuk ke antrian Admin Pusat dengan penanda khusus "Zona Tanpa Admin". Admin Pusat kemudian bisa menangani langsung atau menugaskan admin ke zona tersebut.

Logika ini ditegakkan sepenuhnya di lapisan aplikasi Express, bukan di RLS database.

---

_End of Document_
