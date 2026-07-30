# Product Requirements Document (PRD) - LaporRuta

## Daftar Isi

1. [Pernyataan Masalah & Tujuan Produk](#1-pernyataan-masalah--tujuan-produk)
2. [Persona Pengguna Target](#2-persona-pengguna-target)
3. [Matriks Ruang Lingkup Fitur (Metode MoSCoW)](#3-matriks-ruang-lingkup-fitur-metode-moscow)
4. [User Story & Kriteria Penerimaan](#4-user-story--kriteria-penerimaan)
5. [Lampiran A: Referensi Tech Stack Final](#lampiran-a-referensi-tech-stack-final)
6. [Lampiran B: Mesin Status State Machine](#lampiran-b-mesin-status-state-machine)
7. [Lampiran C: Formula Skor Prioritas (v2.0 Final)](#lampiran-c-formula-skor-prioritas-v20-final)
8. [Lampiran D: Ringkasan Skema Database (Adjusted)](#lampiran-d-ringkasan-skema-database-adjusted)
9. [Lampiran E: Architecture Decision Records (ADR)](#lampiran-e-architecture-decision-records-adr)

---

## 1. Problem Statement & Goals

### 1.1 Problem Statement

Warga menghadapi ambiguitas dan friksi saat melaporkan fasilitas publik yang rusak (misalnya jalan berlubang, lampu penerangan mati, drainase tersumbat). Platform yang ada seringkali tidak transparan, tidak interaktif, dan kekurangan _feedback loop_. Di sisi lain, pihak berwenang setempat kekurangan data real-time berbasis _crowdsourcing_ untuk memprioritaskan perbaikan secara efisien. Belum ada platform terpadu yang menjembatani pelaporan warga dengan tindakan administratif secara transparan dan berbasis lokasi.

**Poin-Poin Utama:**

- **Bagi Warga:** Tidak ada cara mudah untuk melaporkan kerusakan infrastruktur dengan konteks lokasi yang presisi; tidak ada visibilitas mengenai apakah laporan mereka ditindaklanjuti.
- **Bagi Pihak Berwenang:** Laporan masuk melalui kanal yang terfragmentasi (media sosial, telepon, kertas); tidak ada sistem prioritas objektif untuk menentukan masalah mana yang harus diperbaiki terlebih dahulu.
- **Bagi Komunitas:** Tidak ada mekanisme untuk secara kolektif mendukung (upvote) masalah kritis sebagai sinyal urgensi secara demokratis.

### 1.2 Product Goals

| ID Tujuan | Deskripsi Tujuan                                                                                                             | Metrik Keberhasilan                                                                                          |
| --------- | ---------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| PG-01     | Menyediakan antarmuka berbasis peta yang transparan bagi warga untuk melaporkan dan memantau kerusakan infrastruktur publik. | ≥80% laporan yang masuk menyertakan data lokasi yang valid (koordinat atau area administrasi yang dipilih).  |
| PG-02     | Memungkinkan prioritisasi berbasis komunitas melalui sistem upvote terverifikasi.                                            | 10% laporan teratas berdasarkan upvote terselesaikan ≤30% lebih cepat dibanding laporan tanpa upvote.        |
| PG-03     | Memberdayakan administrator dengan dasbor real-time untuk memverifikasi, menugaskan, dan memantau progress perbaikan.        | Rata-rata waktu admin dari laporan masuk hingga tindakan pertama (verifikasi) ≤48 jam selama pilot.          |
| PG-04     | Memastikan integritas data dan mencegah penyalahgunaan melalui autentikasi wajib dan antrian moderasi.                       | <5% laporan publik ditolak karena spam/hoax setelah moderasi.                                                |
| PG-05     | Mendukung hierarki administrasi yang skalabel (admin pusat vs. admin regional) untuk deployment multi-area.                  | Platform mendukung ≥2 zona administratif berbeda dengan akses admin yang terisolasi secara _out-of-the-box_. |

### 1.3 Alignment

- **SDG 9:** Industri, Inovasi, dan Infrastruktur - inovasi digital dalam pemantauan infrastruktur.
- **SDG 11:** Kota dan Permukiman Berkelanjutan - tata kelola urban partisipatif dan penyampaian layanan publik yang transparan.

---

## 2. User Personas

### Persona 1: Warga / Public User

| Atribut                         | Detail                                                                                                                                                                                                 |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Nama**                        | Budi Santoso                                                                                                                                                                                           |
| **Usia**                        | 28                                                                                                                                                                                                     |
| **Pekerjaan**                   | Karyawan kantoran / pengguna transportasi umum                                                                                                                                                         |
| **Tingkat Kecakapan Teknologi** | Sedang - menggunakan ponsel pintar untuk tugas harian, familiar dengan peta dan media sosial.                                                                                                          |
| **Tujuan**                      | Dengan cepat melaporkan jalan rusak atau lampu publik mati di rute perjalanannya; melihat apakah orang lain sudah melaporkan masalah yang sama; memantau apakah pemerintah benar-benar memperbaikinya. |
| **Frustrasi**                   | Melapor via Twitter terkubur; menelepon hotline memakan waktu lama dan tidak pernah mendapat tindak lanjut; tidak tahu apakah ada orang lain yang peduli dengan lampu mati yang sama.                  |
| **Preferensi Perangkat**        | _Mobile-first_ (ponsel pintar), sesekali memeriksa di desktop saat di kantor.                                                                                                                          |
| **Motivasi**                    | Tanggung jawab sosial + kepentingan pribadi (perjalanan yang lebih aman).                                                                                                                              |

### Persona 2: Admin Wilayah (Regional Administrator)

| Atribut                         | Detail                                                                                                                                                                               |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Nama**                        | Ibu Rina                                                                                                                                                                             |
| **Usia**                        | 42                                                                                                                                                                                   |
| **Pekerjaan**                   | Petugas dinas pekerjaan umum tingkat kecamatan / manajer fasilitas kampus                                                                                                            |
| **Tingkat Kecakapan Teknologi** | Rendah-sedang - nyaman dengan dasbor web tetapi membutuhkan UI yang jelas dan sederhana.                                                                                             |
| **Tujuan**                      | Melihat semua laporan yang ditugaskan ke area spesifiknya; memverifikasi laporan yang sahih; memperbarui status perbaikan; memprioritaskan berdasarkan upvote komunitas dan urgensi. |
| **Frustrasi**                   | Menerima laporan melalui grup WhatsApp tanpa presisi lokasi; tidak tahu masalah mana yang lebih urgensi; tidak ada cara menunjukkan ke warga bahwa pekerjaan sedang dilakukan.       |
| **Preferensi Perangkat**        | Desktop selama jam kantor, pengecekan ponsel sesekali.                                                                                                                               |
| **Batasan Ruang Lingkup**       | Hanya BISA melihat dan mengelola laporan di dalam zona administrasi yang ditugaskan kepadanya.                                                                                       |

### Persona 3: Admin Pusat (Central Administrator / Super Admin)

| Atribut                         | Detail                                                                                                                                                                                       |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Nama**                        | Pak Dedi                                                                                                                                                                                     |
| **Usia**                        | 50                                                                                                                                                                                           |
| **Pekerjaan**                   | Koordinator IT municipal / ketua tim kompetisi                                                                                                                                               |
| **Tingkat Kecakapan Teknologi** | Sedang - mengelola sistem dan pengguna, membutuhkan visibilitas penuh.                                                                                                                       |
| **Tujuan**                      | Mengawasi semua laporan di semua zona; mengelola akun admin dan penugasan zona; menugaskan ulang laporan antar-zona; mengakses statistik agregat dan mengekspor data.                        |
| **Frustrasi**                   | Tidak ada _single source of truth_ untuk masalah infrastruktur di seluruh kota; tidak ada cara untuk meminta pertanggungjawaban admin regional; tidak ada ekspor data untuk laporan bulanan. |
| **Preferensi Perangkat**        | Desktop secara eksklusif.                                                                                                                                                                    |
| **Batasan Ruang Lingkup**       | Akses baca/tulis penuh di semua zona dan semua fungsi admin.                                                                                                                                 |

---

## 3. Matriks Ruang Lingkup Fitur (Metode MoSCoW)

### Must-Have (Garis Dasar MVP)

| ID   | Fitur                                               | Deskripsi                                                                                                                                                                                                                                                                           | Pemilik            |
| ---- | --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------ |
| M-01 | **Autentikasi Pengguna**                            | Sistem autentikasi custom via backend Express: registrasi dengan email/password (bcrypt hashing), login mengembalikan JWT token (access token + refresh token), validasi email, dan session management manual. Login wajib untuk pelaporan dan upvote.                              | Backend / Frontend |
| M-02 | **Kontrol Akses Berbasis Peran (RBAC)**             | Tiga peran: Public User, Admin Wilayah, Admin Pusat. **RLS Supabase dinonaktifkan sepenuhnya.** Akses ditegakkan via middleware Express (auth middleware + role middleware) dan query filtering manual di setiap endpoint.                                                          | Backend            |
| M-03 | **Eksplorasi Peta Interaktif**                      | Peta yang menghadap publik dengan penanda berkode warna berdasarkan kategori laporan dan status penyelesaian.                                                                                                                                                                       | Frontend           |
| M-04 | **Pengelompokan Penanda (Marker Clustering)**       | Pengelompokan otomatis penanda peta di area padat untuk mencegah kekacauan UI.                                                                                                                                                                                                      | Frontend           |
| M-05 | **Pemilih Lokasi Bertingkat**                       | Pemilihan lokasi berbasis form: Provinsi → Kota → Kecamatan → Kelurahan (opsional). Mendukung entri data master manual.                                                                                                                                                             | Frontend / Backend |
| M-06 | **Penanda Pin pada Mini Peta**                      | Setelah memilih kecamatan, mini peta memperbesar ke area tersebut memungkinkan pengguna menyempurnakan lokasi pin. Koordinat disimpan bersama data administrasi.                                                                                                                    | Frontend           |
| M-07 | **Formulir Pelaporan Berbasis Geo-Tag**             | Menangkap: judul, deskripsi, kategori, teks alamat spesifik, area administrasi yang dipilih, koordinat (opsional tetapi dianjurkan), dan unggah gambar.                                                                                                                             | Frontend / Backend |
| M-08 | **Unggah Gambar via Backend Proxy**                 | Client mengunggah gambar ke backend Express (multipart/form-data), backend melakukan validasi & kompresi, lalu backend mengunggah ke Supabase Storage menggunakan Service Role Key. Backend mengembalikan URL publik ke client. **Service Role Key tidak pernah expose ke client.** | Backend / Frontend |
| M-09 | **Antrian Moderasi**                                | Laporan baru memasuki status `Pending Verification`. Tidak terlihat di peta publik sampai diverifikasi oleh admin.                                                                                                                                                                  | Backend            |
| M-10 | **Sistem Upvote Komunitas**                         | Pengguna terverifikasi dapat memberikan upvote pada laporan terverifikasi. Satu upvote per pengguna per laporan. Pencegahan duplikat via ID pengguna terverifikasi.                                                                                                                 | Backend            |
| M-11 | **Siklus Hidup Status Laporan**                     | Mesin status tetap: `Pending Verification` → `Verified` → `In Progress` → `Resolved`. Status terminal tambahan: `Rejected`.                                                                                                                                                         | Backend            |
| M-12 | **Dasbor Admin Wilayah**                            | Tampilan terfilter hanya menampilkan laporan di dalam zona yang ditugaskan ke admin. Kemampuan untuk memverifikasi, menolak, mengubah status, dan menambahkan catatan internal.                                                                                                     | Frontend           |
| M-13 | **Dasbor Admin Pusat**                              | Tampilan penuh semua laporan di semua zona. Kemampuan untuk mengesampingkan tindakan admin regional mana pun, menugaskan ulang laporan antar-zona, dan mengelola akun admin.                                                                                                        | Frontend           |
| M-14 | **Penugasan Otomatis & Fallback**                   | Laporan secara otomatis ditugaskan ke Admin Wilayah berdasarkan distrik yang dipilih pada laporan. Jika tidak ada admin untuk zona tersebut, _fallback_ otomatis ke antrian Admin Pusat.                                                                                            | Backend            |
| M-15 | **Pembaruan Peta Publik Real-Time**                 | Socket.io pada server Express menyiarkan event: `report:verified`, `report:status_changed`, `report:new` ke room `public:reports`.                                                                                                                                                  | Backend / Frontend |
| M-16 | **Pembaruan Dasbor Admin Real-Time**                | Socket.io pada server Express menyiarkan event ke room `admin:{wilayah_id}` untuk admin wilayah dan `admin:pusat` untuk admin pusat.                                                                                                                                                | Backend / Frontend |
| M-17 | **Log Aktivitas / Audit Trail**                     | Linimasa tak terubah per laporan menampilkan setiap tindakan: pembuatan, upvote, verifikasi, perubahan status, penolakan, dengan aktor dan stempel waktu.                                                                                                                           | Backend            |
| M-18 | **Indikator Belum Dibaca (Berbasis Pull - Global)** | Lencana indikator pada menu "Laporan Saya" ketika `updated_at` laporan lebih baru dari `users.last_seen_at` pengguna. **Pendekatan MVP: global per user.** Tidak ada notifikasi _push_.                                                                                             | Frontend           |
| M-19 | **Algoritma Peringkat Prioritas**                   | Skor terhitung yang ditampilkan pada dasbor admin untuk membantu prioritisasi. Formula final: `Score = (Upvotes × 3) + (Category_Urgency_Weight × 5) + (Has_Coordinate ? 2 : 0) − (Report_Age_in_Days × 0.5)`. Bobot kategori didefinisikan di data master.                         | Backend            |
| M-20 | **Desain Responsif**                                | Tata letak _mobile-first_ dengan kompatibilitas desktop penuh. Tailwind CSS + Shadcn UI.                                                                                                                                                                                            | Frontend           |

### Should-Have (Prioritas Tinggi)

| ID   | Fitur                                  | Deskripsi                                                                                                                                                                                   |
| ---- | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| S-01 | **Deteksi Laporan Duplikat**           | Ketika pengguna membuat laporan, sistem memeriksa laporan yang sudah ada dalam radius 100m, kategori sama, usia < 7 hari, dan menyarankan untuk meng-upvote laporan yang sudah ada.         |
| S-02 | **Sistem Komentar**                    | Pengguna terverifikasi dapat menambahkan komentar teks ke laporan yang sudah ada untuk memberikan konteks tambahan (misalnya, "Masih rusak sampai hari ini").                               |
| S-03 | **Catatan Internal Admin**             | Bidang catatan pribadi pada setiap laporan yang hanya terlihat oleh admin, untuk koordinasi internal (misalnya, "Suku cadang dipesan, ETA 3 hari"). Disimpan di tabel `report_admin_notes`. |
| S-04 | **Kompresi Gambar**                    | Kompresi gambar sisi klien sebelum unggah ke backend (target: ≤500KB per gambar) untuk menghemat bandwidth dan storage.                                                                     |
| S-05 | **Tampilan Heatmap (Admin Only)**      | Tombol _toggle_ pada dasbor admin untuk melihat _overlay heatmap_ kepadatan laporan alih-alih penanda individual. Berguna untuk mengidentifikasi zona kegagalan infrastruktur sistemik.     |
| S-06 | **Pencarian & Filter**                 | Antarmuka publik dan admin mendukung penyaringan berdasarkan: kategori, status, rentang tanggal, kecamatan, dan pencarian kata kunci dalam judul/deskripsi.                                 |
| S-07 | **Antrian Admin yang Dapat Diurutkan** | Dasbor admin memungkinkan pengurutan laporan berdasarkan: skor prioritas, terbaru dulu, terlama dulu, jumlah upvote.                                                                        |
| S-08 | **Pembukaan Ulang Laporan / Dispute**  | Pengguna dapat meminta peninjauan ulang jika mereka yakin laporan `Resolved` belum benar-benar diperbaiki. Membuat _flag_ untuk Admin Pusat.                                                |

### Could-Have (Bagus untuk Dimiliki)

| ID   | Fitur                               | Deskripsi                                                                                                                                   |
| ---- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| C-01 | **Gamifikasi / Lencana**            | Lencana ringan untuk pengguna: "Pelapor Pertama", "Warga Aktif" (3 laporan terverifikasi), "Suara Komunitas" (10 upvote diberikan).         |
| C-02 | **Papan Peringkat**                 | Papan peringkat publik top reporter dan top upvoter per bulan.                                                                              |
| C-03 | **Ekspor ke CSV / PDF**             | Admin Pusat dapat mengekspor data laporan terfilter ke CSV untuk pelaporan eksternal. Ringkasan PDF dengan grafik.                          |
| C-04 | **PWA / Service Worker**            | Kemampuan offline dasar: mengantrekan pengiriman laporan saat offline, sinkronisasi otomatis saat koneksi kembali.                          |
| C-05 | **Blur Wajah Otomatis pada Gambar** | ML ringan sisi klien atau heuristik untuk mendeteksi dan mengaburkan potensi wajah/plat nomor dalam gambar yang diunggah demi privasi.      |
| C-06 | **Dukungan Multi-Bahasa**           | _Toggle_ Bahasa Indonesia (default) dan Bahasa Inggris.                                                                                     |
| C-07 | **Halaman Statistik Publik**        | Dasbor agregat publik menampilkan: total laporan, tingkat resolusi, rata-rata waktu penyelesaian, kategori teratas, tanpa memerlukan login. |

### Won't-Have (Dikecualikan Secara Eksplisit untuk Iterasi Saat Ini)

| ID       | Fitur                                                     | Alasan Pengecualian                                                                                                                                                                                           |
| -------- | --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| W-01     | **Notifikasi Push (Email/SMS/Web Push)**                  | Di luar ruang lingkup. Produk menggunakan model _pull-based_ (pengguna memeriksa secara manual). Ini mengurangi kompleksitas infrastruktur dan menghindari ketergantungan pada penyedia notifikasi eksternal. |
| W-02     | **Validasi Gambar AI / Auto-Kategorisasi**                | _Over-engineering_ untuk timeline saat ini. Pemilihan kategori manual oleh pengguna dan verifikasi admin sudah cukup.                                                                                         |
| W-03     | **Aplikasi Mobile Native (iOS/Android)**                  | Produk adalah aplikasi web. Port native app atau React Native tidak direncanakan untuk iterasi ini.                                                                                                           |
| W-04     | **Blockchain / Smart Contract untuk Transparansi**        | Kompleksitas yang tidak perlu. Audit trail database dengan log tak terubah sudah cukup untuk kebutuhan transparansi.                                                                                          |
| W-05     | **Kepatuhan Aksesibilitas (WCAG AAA)**                    | Secara eksplisit diprioritaskan rendah sesuai keputusan stakeholder. HTML semantik dasar diharapkan, tetapi optimasi _screen reader_ penuh dan mode kontras tinggi dikecualikan.                              |
| W-06     | **Integrasi API Eksternal (API Pemerintah, Google Maps)** | Tidak ada integrasi dengan API pelaporan pemerintah eksternal atau penyedia peta berbayar. OpenStreetMap + Leaflet saja.                                                                                      |
| ~~W-07~~ | ~~**Server Backend Express.js Terpisah**~~                | ~~**DIHAPUS / DIREVISI.** Arsitektur final menggunakan Express.js terpisah sebagai backend utama. Alasan: frontend menggunakan React (bukan Next.js), sehingga API Routes tidak tersedia.~~                   |
| W-08     | **Berbagi Sosial / Mekanik Viral**                        | Tidak ada tombol berbagi bawaan Twitter/Facebook/WhatsApp. Fokus tetap pada mekanik komunitas internal platform.                                                                                              |

---

## 4. User Story & Kriteria Penerimaan

### 4.1 Autentikasi & Otorisasi

#### US-AUTH-01: Registrasi Pengguna

> **Sebagai seorang** warga,  
> **Saya ingin** mendaftar akun menggunakan email dan password,  
> **Sehingga** saya dapat mengirimkan laporan dan memberikan upvote secara aman.

**Kriteria Penerimaan:**

- [ ] KP1: Pengguna dapat mengakses formulir registrasi dengan bidang: nama lengkap, email, password (min. 8 karakter), dan konfirmasi password.
- [ ] KP2: Backend Express menerima payload registrasi, validasi input, hash password dengan bcrypt, insert ke tabel `users`, generate JWT token, kirim response ke client.
- [ ] KP3: Setelah registrasi berhasil, profil pengguna dibuat di tabel `users` dengan `role = 'user'`.
- [ ] KP4: Pengguna secara otomatis login dan diarahkan ke peta publik.
- [ ] KP5: Jika email sudah ada, sistem menampilkan pesan error yang jelas tanpa mengungkapkan apakah email tersebut ada di database.

#### US-AUTH-02: Login Pengguna

> **Sebagai seorang** pengguna terdaftar,  
> **Saya ingin** login dengan email dan password,  
> **Sehingga** saya dapat mengakses dasbor pribadi dan fitur pelaporan.

**Kriteria Penerimaan:**

- [ ] KP1: Pengguna dapat mengakses formulir login dengan bidang email dan password.
- [ ] KP2: Backend Express memverifikasi email dan password (bcrypt compare), generate JWT access token (15 menit) dan refresh token (7 hari), simpan refresh token di database, kembalikan ke client.
- [ ] KP3: Saat berhasil, pengguna diarahkan ke halaman terakhir yang dikunjungi atau ke peta publik.
- [ ] KP4: Saat gagal, sistem menampilkan pesan "Kredensial tidak valid" secara generik.
- [ ] KP5: Sesi bertahan di seluruh _refresh_ browser sampai logout eksplisit atau kedaluwarsa sesi.

#### US-AUTH-03: Login Admin & Perutean Peran

> **Sebagai seorang** administrator (Wilayah atau Pusat),  
> **Saya ingin** login dan diarahkan ke dasbor masing-masing berdasarkan peran saya,  
> **Sehingga** saya langsung melihat laporan yang relevan dengan wewenang saya.

**Kriteria Penerimaan:**

- [ ] KP1: Admin login menggunakan formulir autentikasi yang sama dengan pengguna publik.
- [ ] KP2: Pasca-autentikasi, sistem memeriksa `users.role` dan `users.assigned_wilayah_id`.
- [ ] KP3: Jika `role = 'admin_wilayah'`, pengguna diarahkan ke `/admin/wilayah` dengan data yang sudah terfilter ke zona yang ditugaskan.
- [ ] KP4: Jika `role = 'admin_pusat'`, pengguna diarahkan ke `/admin/pusat` dengan akses data penuh.
- [ ] KP5: Pengguna publik (`role = 'user'`) yang mencoba mengakses URL `/admin/*` diarahkan ke peta publik dengan pesan 403.
- [ ] KP6: Admin Pusat dapat mengakses semua rute admin. Admin Wilayah yang mengakses `/admin/pusat` ditolak.

---

### 4.2 Eksplorasi Peta Publik

#### US-MAP-01: Menjelajahi Peta Publik

> **Sebagai seorang** pengunjung (terautentikasi maupun tidak),  
> **Saya ingin** melihat peta interaktif yang menampilkan semua laporan infrastruktur terverifikasi,  
> **Sehingga** saya dapat melihat masalah apa yang ada di area saya tanpa perlu akun.

**Kriteria Penerimaan:**

- [ ] KP1: Peta dimuat dengan tampilan default yang berpusat pada lokasi default yang dapat dikonfigurasi (misalnya pusat kota).
- [ ] KP2: Hanya laporan dengan `status IN ('verified', 'in_progress', 'resolved')` yang ditampilkan.
- [ ] KP3: Setiap penanda berkode warna berdasarkan kategori (misalnya Jalan = merah, Lampu = kuning, Trotoar = biru) dan berkode bentuk berdasarkan status.
- [ ] KP4: Mengklik penanda membuka kartu detail yang menampilkan: judul, kategori, status, jumlah upvote, gambar thumbnail, dan tanggal terakhir diperbarui.
- [ ] KP5: Peta mendukung interaksi zoom, geser, dan seret dengan lancar di ponsel maupun desktop.
- [ ] KP6: Di area padat, penanda secara otomatis dikelompokkan dengan lencana jumlah. Mengklik klaster memperbesar untuk membuka pengelompokan.

#### US-MAP-02: Menyaring Data Peta

> **Sebagai seorang** pengguna publik,  
> **Saya ingin** menyaring peta berdasarkan kategori dan status,  
> **Sehingga** saya dapat fokus pada jenis masalah infrastruktur tertentu.

**Kriteria Penerimaan:**

- [ ] KP1: Panel filter dapat diakses pada UI peta.
- [ ] KP2: Pengguna dapat mengaktifkan/mematikan kategori (multi-select).
- [ ] KP3: Pengguna dapat mengaktifkan/mematikan status (multi-select).
- [ ] KP4: Filter diterapkan segera tanpa _full page reload_.
- [ ] KP5: URL diperbarui untuk mencerminkan filter aktif (status link yang dapat dibagikan).

---

### 4.3 Pelaporan Berbasis Geo-Tag

#### US-RPT-01: Mengirimkan Laporan Baru (Lokasi Berbasis Form)

> **Sebagai seorang** warga yang terautentikasi,  
> **Saya ingin** mengirimkan laporan kerusakan infrastruktur baru dengan memilih lokasi melalui form terstruktur dan pin peta opsional,  
> **Sehingga** saya dapat melaporkan masalah bahkan ketika GPS tidak akurat atau tidak tersedia.

**Kriteria Penerimaan:**

- [ ] KP1: Pengguna harus terautentikasi. Pengguna yang belum login yang mengeklik "Laporkan" diarahkan ke login dengan URL kembali.
- [ ] KP2: Bidang formulir meliputi: Judul (maks. 100 karakter), Deskripsi (maks. 500 karakter), Kategori (single-select dari data master), Teks Alamat Spesifik (teks bebas, maks. 200 karakter), dan Unggah Gambar (1–3 gambar, maks. 5MB masing-masing, tipe: JPG/PNG).
- [ ] KP3: Pemilihan lokasi wajib melalui dropdown bertingkat: Provinsi → Kota → Kecamatan. Kelurahan opsional.
- [ ] KP4: Setelah memilih kecamatan, mini peta muncul diperbesar ke area distrik tersebut. Pengguna dapat meletakkan pin untuk menyempurnakan lokasi. Pin opsional tetapi sangat dianjurkan.
- [ ] KP5: Jika pin diletakkan, lintang dan bujur ditangkap dan disimpan. Jika tidak, `lat` dan `lng` bernilai NULL tetapi laporan tetap diterima.
- [ ] KP6: Gambar dikompresi sisi klien ke target ≤500KB masing-masing sebelum unggah ke backend Express.
- [ ] KP7: Saat submit, gambar diunggah terlebih dahulu ke backend Express, backend melakukan validasi & kompresi ulang jika perlu, lalu backend mengunggah ke Supabase Storage menggunakan Service Role Key. Jika ada gambar yang gagal, seluruh pengiriman dibatalkan dengan error dan tidak ada record database yang dibuat.
- [ ] KP8: Saat unggah berhasil, baris laporan dimasukkan dengan `status = 'pending_verification`. Laporan tersebut BELUM muncul di peta publik.
- [ ] KP9: Pengguna melihat pesan sukses: "Laporan berhasil dikirim dan sedang menunggu verifikasi admin."
- [ ] KP10: Pengguna diarahkan ke halaman "Laporan Saya" di mana laporan baru muncul dengan lencana "Menunggu Verifikasi".

#### US-RPT-02: Melihat Laporan Saya

> **Sebagai seorang** warga yang terautentikasi,  
> **Saya ingin** melihat daftar semua laporan yang pernah saya kirimkan beserta statusnya saat ini,  
> **Sehingga** saya dapat memantau apakah laporan saya ditindaklanjuti.

**Kriteria Penerimaan:**

- [ ] KP1: Halaman "Laporan Saya" menampilkan semua laporan yang dibuat oleh pengguna yang login, diurutkan terbaru dulu.
- [ ] KP2: Setiap item menampilkan: judul, ikon kategori, lencana status, tanggal pengiriman, thumbnail, dan jumlah upvote.
- [ ] KP3: Mengklik item menavigasi ke halaman detail laporan.
- [ ] KP4: Laporan dengan `updated_at > user.last_seen_at` menampilkan indikator "Pembaruan Baru" (titik merah atau lencana "Diperbarui"). **Pendekatan MVP: global `last_seen_at` per user.**
- [ ] KP5: Paginasi atau _infinite scroll_ diimplementasikan jika pengguna memiliki >20 laporan.

---

### 4.4 Sistem Upvote Komunitas

#### US-UPV-01: Memberikan Upvote pada Laporan

> **Sebagai seorang** warga yang terautentikasi,  
> **Saya ingin** memberikan upvote pada laporan terverifikasi yang menurut saya penting,  
> **Sehingga** saya dapat membantu menyinyal urgensi kepada administrator tanpa membuat laporan duplikat.

**Kriteria Penerimaan:**

- [ ] KP1: Hanya laporan dengan `status = 'verified'`, `'in_progress'`, atau `'resolved'` yang dapat di-upvote.
- [ ] KP2: Pengguna yang belum login melihat tombol upvote, tetapi mengekliknya memicu modal login/redirect.
- [ ] KP3: Pengguna terverifikasi melihat tombol upvote aktif/non-aktif. Satu upvote per pengguna per laporan.
- [ ] KP4: Mengklik upvote menaikkan jumlah segera (optimistic UI) dan mengirimkan request ke backend.
- [ ] KP5: Backend menegakkan keunikan melalui _composite unique constraint_ `(report_id, user_id)` pada tabel `upvotes`.
- [ ] KP6: Jika pengguna sudah memberikan upvote, mengeklik lagi menghapus upvote (perilaku _toggle_) dan menurunkan jumlah.
- [ ] KP7: Tindakan upvote direkam di tabel `activity_logs`.
- [ ] KP8: Siaran real-time memperbarui jumlah upvote di semua klien terhubung yang sedang melihat laporan atau peta tersebut.

---

### 4.5 Manajemen Siklus Hidup Laporan (Admin)

#### US-ADM-01: Memverifikasi atau Menolak Laporan (Admin Wilayah)

> **Sebagai seorang** Admin Wilayah,  
> **Saya ingin** meninjau laporan pending di zona yang ditugaskan kepada saya dan memverifikasi atau menolaknya,  
> **Sehingga** hanya laporan yang sahih yang muncul di peta publik.

**Kriteria Penerimaan:**

- [ ] KP1: Dasbor Admin Wilayah menampilkan hanya laporan di mana `wilayah_id` cocok dengan `assigned_wilayah_id` mereka DAN `status = 'pending_verification'`.
- [ ] KP2: Setiap kartu laporan pending menampilkan: semua gambar, judul, deskripsi, kategori, alamat spesifik, distrik yang dipilih, pin peta (jika tersedia), nama pengirim, dan tanggal pengiriman.
- [ ] KP3: Admin dapat mengeklik "Verifikasi" untuk mengubah status menjadi `verified`. Laporan segera menjadi terlihat di peta publik dan memenuhi syarat untuk di-upvote.
- [ ] KP4: Admin dapat mengeklik "Tolak" untuk mengubah status menjadi `rejected`. Bidang alasan penolakan wajib diisi (min. 10 karakter). Laporan yang ditolak tidak pernah muncul di peta publik.
- [ ] KP5: Kedua tindakan direkam di `activity_logs` dengan `actor_id = admin_saat_ini`.
- [ ] KP6: Siaran real-time memberitahu klien peta publik jika laporan diverifikasi.
- [ ] KP7: Admin tidak dapat memverifikasi/menolak laporan di luar zona yang ditugaskan.

#### US-ADM-02: Memperbarui Status Laporan (Admin Wilayah)

> **Sebagai seorang** Admin Wilayah,  
> **Saya ingin** memperbarui status laporan terverifikasi di zona saya untuk mencerminkan progress perbaikan,  
> **Sehingga** warga dapat secara transparan memantau apa yang sedang diperbaiki.

**Kriteria Penerimaan:**

- [ ] KP1: Admin dapat memperbarui status dari `verified` → `in_progress`, atau `in_progress` → `resolved`.
- [ ] KP2: Perubahan status dibatasi pada progresi maju saja. Tidak ada perubahan mundur yang diizinkan (kecuali _override_ Admin Pusat).
- [ ] KP3: Saat menandai `resolved`, admin dapat secara opsional mengunggah gambar "sesudah" (maks. 3) untuk mendemonstrasikan perbaikan. Gambar ini ditandai `is_after = true` dan hanya dapat diunggah oleh admin.
- [ ] KP4: Perubahan status memicu pembaruan real-time pada peta publik dan halaman detail laporan.
- [ ] KP5: Log aktivitas mencatat: status lama, status baru, aktor, stempel waktu, dan catatan opsional.
- [ ] KP6: Bidang `updated_at` laporan di-_refresh_, memicu lencana "Pembaruan Baru" bagi pelapor saat kunjungan berikutnya.

#### US-ADM-03: Menugaskan Ulang Zona Laporan (Admin Pusat)

> **Sebagai seorang** Admin Pusat,  
> **Saya ingin** menugaskan ulang laporan ke zona administratif yang berbeda,  
> **Sehingga** laporan yang diajukan di zona salah atau di area perbatasan mencapai administrator yang benar.

**Kriteria Penerimaan:**

- [ ] KP1: Admin Pusat dapat mengedit `wilayah_id` dari laporan mana pun.
- [ ] KP2: Saat diubah, laporan dihapus dari antrian Admin Wilayah sebelumnya dan muncul di antrian zona baru.
- [ ] KP3: Jika zona baru memiliki Admin Wilayah yang ditugaskan, mereka menerima laporan di dasbor mereka (real-time).
- [ ] KP4: Jika zona baru TIDAK memiliki admin yang ditugaskan, laporan tersebut _fallback_ ke antrian Admin Pusat.
- [ ] KP5: Penugasan ulang dicatat di `activity_logs`.

#### US-ADM-04: Mengesampingkan Tindakan Admin Wilayah (Admin Pusat)

> **Sebagai seorang** Admin Pusat,  
> **Saya ingin** mengesampingkan tindakan apa pun yang diambil oleh Admin Wilayah,  
> **Sehingga** saya dapat memperbaiki kesalahan atau menangani eskalasi.

**Kriteria Penerimaan:**

- [ ] KP1: Admin Pusat dapat mengubah status laporan apa pun ke arah mana pun (termasuk mengembalikan `resolved` ke `in_progress` atau `verified`).
- [ ] KP2: Admin Pusat dapat menolak laporan bahkan setelah diverifikasi oleh Admin Wilayah.
- [ ] KP3: Admin Pusat dapat mengedit metadata laporan (judul, deskripsi, kategori) jika diperlukan.
- [ ] KP4: Semua tindakan _override_ di-_flag_ di `activity_logs` dengan _flag_ khusus `is_override = true`.

---

### 4.6 Sinkronisasi Data Real-Time

#### US-RTC-01: Pembaruan Peta Real-Time

> **Sebagai seorang** pengguna publik yang sedang melihat peta,  
> **Saya ingin** melihat laporan terverifikasi baru dan perubahan status muncul di peta tanpa perlu menyegarkan halaman,  
> **Sehingga** saya selalu melihat kondisi terkini masalah infrastruktur.

**Kriteria Penerimaan:**

- [ ] KP1: Klien publik berlangganan ke satu room Socket.io server pada Express: `public:reports`.
- [ ] KP2: Saat laporan diverifikasi (`pending_verification` → `verified`), penanda baru muncul di peta pada koordinat yang benar (atau pada titik tengah distrik jika tidak ada koordinat).
- [ ] KP3: Saat status laporan berubah (misalnya `in_progress` → `resolved`), warna/bentuk penanda diperbarui segera.
- [ ] KP4: Saat laporan ditolak, laporan tersebut dihapus dari peta jika sebelumnya terlihat (kasus tepi: seharusnya tidak terjadi karena laporan yang ditolak tidak pernah diverifikasi, tetapi ditangani secara defensif).
- [ ] KP5: Event real-time menyertakan _payload_ laporan lengkap sehingga klien dapat merender tanpa panggilan API tambahan.
- [ ] KP6: Jika koneksi real-time terputus, klien menampilkan indikator "Menyambungkan kembali..." yang halus dan mencoba ulang secara otomatis.

#### US-RTC-02: Pembaruan Dasbor Admin Real-Time

> **Sebagai seorang** Admin Wilayah,  
> **Saya ingin** melihat laporan baru yang ditugaskan ke zona saya muncul secara instan di dasbor,  
> **Sehingga** saya dapat merespons dengan cepat tanpa menyegarkan secara manual.

**Kriteria Penerimaan:**

- [ ] KP1: Klien Admin Wilayah berlangganan ke room Socket.io server pada Express: `admin:{wilayah_id}`.
- [ ] KP2: Laporan baru yang cocok dengan `assigned_wilayah_id` admin menyiarkan event INSERT.
- [ ] KP3: Perubahan status pada laporan di zona tersebut menyiarkan event UPDATE.
- [ ] KP4: Antrian dasbor diperbarui real-time dengan animasi sorot halus pada item baru selama 3 detik.
- [ ] KP5: Admin Pusat berlangganan ke room global `admin:pusat` yang menerima semua event di semua zona.

---

### 4.7 Aktivitas & Transparansi

#### US-LOG-01: Melihat Linimasa Aktivitas Laporan

> **Sebagai seorang** warga,  
> **Saya ingin** melihat linimasa kronologis dari semua tindakan yang diambil pada laporan saya,  
> **Sehingga** saya memiliki transparansi penuh mengenai bagaimana laporan saya ditangani.

**Kriteria Penerimaan:**

- [ ] KP1: Setiap halaman detail laporan menyertakan bagian "Linimasa Aktivitas".
- [ ] KP2: Entri linimasa meliputi: jenis tindakan (ikon + label), nama aktor (atau "Sistem"), stempel waktu (relatif: "2 jam lalu" + absolut saat _hover_), dan metadata (misalnya status lama→baru untuk perubahan status).
- [ ] KP3: Linimasa tak terubah dan diurutkan dari terbaru ke terlama.
- [ ] KP4: Event upvote diagregasi jika memungkinkan (misalnya "+5 upvote minggu ini") untuk mencegah _spam_ linimasa dari laporan populer.

#### US-LOG-02: Memeriksa Pembaruan (Berbasis Pull - Global)

> **Sebagai seorang** warga,  
> **Saya ingin** melihat indikator visual ketika laporan saya telah diperbarui sejak kunjungan terakhir,  
> **Sehingga** saya tahu kapan harus memeriksa kembali progress meskipun tanpa notifikasi _push_.

**Kriteria Penerimaan:**

- [ ] KP1: Pada setiap _page load_ yang terautentikasi, sistem memperbarui `users.last_seen_at` ke stempel waktu saat ini.
- [ ] KP2: Pada halaman "Laporan Saya", laporan apa pun di mana `updated_at > user.last_seen_at` menampilkan lencana titik merah atau label "Diperbarui".
- [ ] KP3: Mengklik masuk ke detail laporan tidak menghapus lencana secara individual (karena pendekatan global MVP). Lencana hilang saat _page load_ berikutnya setelah `last_seen_at` diperbarui.
- [ ] KP4: Lencana bertahan di seluruh sesi sampai pengguna melakukan _page load_ baru atau logout-login ulang.

> **Catatan Teknis:** Pendekatan global ini adalah trade-off MVP. Untuk tracking per laporan yang lebih akurat, diperlukan tabel `user_report_views` (Could-Have / Post-MVP).

---

### 4.8 Hierarki Administrasi

#### US-HIE-01: Mengelola Akun Admin (Admin Pusat)

> **Sebagai seorang** Admin Pusat,  
> **Saya ingin** membuat dan mengelola akun admin lain (Wilayah maupun Pusat),  
> **Sehingga** saya dapat mendelegasikan pengelolaan zona seiring platform berkembang.

**Kriteria Penerimaan:**

- [ ] KP1: Dasbor Admin Pusat menyertakan bagian "Manajemen Pengguna".
- [ ] KP2: Dapat mengundang admin baru melalui email. Sistem membuat entri di tabel `invitations` dengan token unik dan batas waktu (24 jam). Email undangan dikirim (atau token dibagikan manual jika email service belum tersedia).
- [ ] KP3: Saat membuat Admin Wilayah, Admin Pusat harus menugaskan tepat satu `wilayah_id` dari data master.
- [ ] KP4: Dapat menonaktifkan/mengaktifkan kembali akun admin. Admin yang dinonaktifkan kehilangan akses dasbor segera.
- [ ] KP5: Dapat menugaskan ulang Admin Wilayah ke zona berbeda. Dasbor mereka diperbarui saat _load_ berikutnya.
- [ ] KP6: Tidak dapat menghapus akun Admin Pusat terakhir yang tersisa (pengaman).

#### US-HIE-02: Menangani Zona Tanpa Admin

> **Sebagai** sistem,  
> **Saya ingin** secara otomatis mengarahkan laporan dari zona tanpa Admin Wilayah yang ditugaskan ke antrian Admin Pusat,  
> **Sehingga** tidak ada laporan yang terlewat.

**Kriteria Penerimaan:**

- [ ] KP1: Saat pembuatan laporan, sistem memeriksa apakah `wilayah_id` memiliki `admin_wilayah` aktif yang ditugaskan.
- [ ] KP2: Jika ya, laporan muncul di dasbor admin tersebut.
- [ ] KP3: Jika tidak, laporan muncul di dasbor Admin Pusat dengan tag filter "Zona Tanpa Admin".
- [ ] KP4: Admin Pusat kemudian dapat memverifikasi/mengelolanya langsung atau menugaskan admin ke zona tersebut dan menugaskan ulang laporan.
- [ ] KP5: Logika ini ditegakkan sepenuhnya di lapisan aplikasi Express (bukan RLS database).

---

## Lampiran A: Referensi Tech Stack Final

| Lapisan                | Teknologi                                             | Catatan                                                                                             |
| ---------------------- | ----------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| **Framework Frontend** | React + Vite                                          | SPA (_Single Page Application_) dengan React Router.                                                |
| **Library UI**         | Tailwind CSS, Shadcn UI, Lucide Icons                 | Desain responsif _mobile-first_.                                                                    |
| **State Management**   | TanStack Query (React Query)                          | Caching state server, _background refetch_, _optimistic updates_.                                   |
| **Routing Client**     | React Router                                          | Navigasi halaman publik, admin, dan autentikasi.                                                    |
| **Mesin Peta**         | Leaflet.js + React-Leaflet                            | Plugin MarkerCluster wajib untuk penanganan kepadatan.                                              |
| **Penyedia Tile**      | OpenStreetMap (via default Leaflet)                   | Tidak memerlukan API key.                                                                           |
| **Database**           | Supabase (PostgreSQL)                                 | DB utama.                                                                                           |
| **Backend**            | Node.js + Express.js                                  | Server terpisah yang menangani autentikasi, business logic, dan real-time.                          |
| **Lapisan API**        | Express.js REST API                                   | Menggunakan server Express terpisah. Semua query ke Supabase via Service Role Key dari backend.     |
| **Penyimpanan File**   | Supabase Storage                                      | Diakses oleh backend Express menggunakan Service Role Key. Client tidak mengakses storage langsung. |
| **Real-Time**          | Socket.io (di atas Express)                           | Room broadcast untuk peta publik dan dasbor admin.                                                  |
| **Autentikasi**        | Custom JWT (Express + jsonwebtoken)                   | Access token (15 menit) + Refresh token (7 hari). Refresh token disimpan di DB.                     |
| **Deployment**         | Frontend: Vercel/Netlify; Backend: VPS/Railway/Render | Frontend dan backend di-deploy terpisah.                                                            |

---

## Lampiran B: Mesin Status State Machine

```
[Pengguna Submit]
    |
    v
+---------------+       +-----------+       +-------------+       +-----------+
|   PENDING     |------>|  VERIFIED |------>| IN PROGRESS |------>| RESOLVED  |
| VERIFICATION  |       |           |       |             |       |           |
+---------------+       +-----------+       +-------------+       +-----------+
    |                         ^
    |                         |
    +------------------>+-----------+
                        |  REJECTED |
                        +-----------+
```

**Aturan Transisi:**

- `Pending Verification` → `Verified`: Oleh Admin Wilayah (zona sendiri) atau Admin Pusat.
- `Pending Verification` → `Rejected`: Oleh Admin Wilayah (zona sendiri) atau Admin Pusat. Memerlukan alasan.
- `Verified` → `In Progress`: Oleh Admin Wilayah (zona sendiri) atau Admin Pusat.
- `In Progress` → `Resolved`: Oleh Admin Wilayah (zona sendiri) atau Admin Pusat. Gambar "sesudah" opsional.
- `Resolved` → `In Progress` / `Verified`: **Hanya override Admin Pusat** (dispute/pembukaan ulang).
- `Verified` → `Rejected`: **Hanya override Admin Pusat**.

---

## Lampiran C: Formula Skor Prioritas (v2.0 Final)

```
Priority Score = (Jumlah_Upvote × 3)
               + (Bobot_Urgensi_Kategori × 5)
               + (Memiliki_Koordinat ? 2 : 0)
               − (Usia_Laporan_dalam_Hari × 0.5)
```

**Bobot Urgensi Kategori (dapat dikonfigurasi di tabel `categories`):**

- Jalan Berlubang / Tiang Listrik Roboh: Bobot = 5
- Lampu Penerangan Mati: Bobot = 4
- Drainase Tersumbat: Bobot = 3
- Trotoar Rusak: Bobot = 2
- Fasilitas Publik Rusak: Bobot = 1

**Catatan:**

- Skor dihitung saat _read_ oleh API backend atau melalui kolom _generated_ PostgreSQL.
- Lantai skor minimum: 0.
- Urutan default dasbor admin: Skor Prioritas (menurun).
- Bonus koordinat (`+2`) memberikan insentif bagi warga untuk menyertakan pin lokasi, meningkatkan akurasi data.

---

_End Of Document_
